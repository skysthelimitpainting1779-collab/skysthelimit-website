#!/usr/bin/env node
/**
 * Durable Turso sync — shared by learning-loop, goal, and hook telemetry.
 *
 * Guarantees:
 *   - Never throws to callers (best-effort, always returns a result object)
 *   - Offline/failed writes land in .learnings/sync-queue.jsonl (durable retry queue)
 *   - Every successful sync first flushes the queue (self-healing)
 *   - Timeout-capped so git hooks never hang
 *   - Schema is idempotent (CREATE TABLE IF NOT EXISTS on every connect)
 *
 * Queue entry: { table, sql, args, queued_at, attempts }
 */

import { appendFileSync, existsSync, readFileSync, renameSync, unlinkSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const QUEUE_PATH = join(ROOT, '.learnings', 'sync-queue.jsonl');
const MAX_QUEUE_ENTRIES = 500;
const MAX_ATTEMPTS = 10;
const CONNECT_TIMEOUT_MS = 8_000;

// ---------------------------------------------------------------------------
// Schema — one place, applied idempotently on every connect
// ---------------------------------------------------------------------------

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS agent_os_episodes (
    id TEXT PRIMARY KEY NOT NULL,
    task TEXT, outcome TEXT, area TEXT, pattern TEXT, friction TEXT,
    duration_min INTEGER, tools_used TEXT, steps_count INTEGER,
    incident_refs TEXT, commit_sha TEXT, recorded_at TEXT, payload TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS ship_loop_goals (
    slug TEXT PRIMARY KEY NOT NULL,
    title TEXT, phase TEXT, status TEXT, verify_ok INTEGER,
    created TEXT, completed TEXT, payload TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS ship_loop_evals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_slug TEXT, ok INTEGER NOT NULL, pass_rate REAL,
    graders TEXT, at TEXT NOT NULL, payload TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS hook_telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL, name TEXT NOT NULL, ok INTEGER, detail TEXT,
    UNIQUE(at, name)
  )`,
  `CREATE TABLE IF NOT EXISTS hook_state_summary (
    id TEXT PRIMARY KEY NOT NULL,
    last_graphify INTEGER, last_session_sync INTEGER,
    last_session_learn INTEGER, last_episode INTEGER,
    event_count INTEGER, synced_at TEXT
  )`,
];

// ---------------------------------------------------------------------------
// Connection (never throws; null on failure)
// ---------------------------------------------------------------------------

let envLoaded = false;

async function loadEnvOnce() {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const { config: loadDotenv } = await import('dotenv');
    for (const f of ['.env.local', '.env']) {
      const p = join(ROOT, f);
      if (existsSync(p)) loadDotenv({ path: p, override: false, quiet: true });
    }
  } catch {
    /* dotenv optional */
  }
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms).unref?.()),
  ]);
}

// Additive migrations for tables that predate a column. Errors are expected
// (duplicate column) and safely ignored.
const MIGRATIONS = [
  `ALTER TABLE agent_os_episodes ADD COLUMN commit_sha TEXT`,
  // Dedup guard for telemetry tables created before UNIQUE(at, name) existed
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_hook_telemetry_at_name ON hook_telemetry(at, name)`,
];

/** @returns {Promise<{client: object|null, error?: string}>} */
export async function connect() {
  await loadEnvOnce();
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || '';
  if (!url) return { client: null, error: 'no TURSO_DATABASE_URL' };
  try {
    const { createClient } = await import('@libsql/client');
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
    const isFile = url.startsWith('file:');
    const client = createClient({ url, ...(authToken && !isFile ? { authToken } : {}) });
    for (const ddl of SCHEMA) {
      await withTimeout(client.execute(ddl), CONNECT_TIMEOUT_MS, 'schema');
    }
    for (const mig of MIGRATIONS) {
      try {
        await withTimeout(client.execute(mig), CONNECT_TIMEOUT_MS, 'migration');
      } catch {
        /* column already exists */
      }
    }
    return { client, url };
  } catch (err) {
    return { client: null, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Durable queue (offline retry)
// ---------------------------------------------------------------------------

function ensureQueueDir() {
  const dir = dirname(QUEUE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readQueue() {
  if (!existsSync(QUEUE_PATH)) return [];
  try {
    return readFileSync(QUEUE_PATH, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function writeQueue(entries) {
  ensureQueueDir();
  const capped = entries.slice(-MAX_QUEUE_ENTRIES);
  const tmp = `${QUEUE_PATH}.${process.pid}.tmp`;
  const body = capped.map((e) => JSON.stringify(e)).join('\n') + (capped.length ? '\n' : '');
  try {
    writeFileSync(tmp, body, 'utf8');
    renameSync(tmp, QUEUE_PATH);
  } catch {
    try {
      writeFileSync(QUEUE_PATH, body, 'utf8');
      unlinkSync(tmp);
    } catch {
      /* give up quietly */
    }
  }
}

function enqueue(table, sql, args) {
  try {
    ensureQueueDir();
    const entry = { table, sql, args, queued_at: new Date().toISOString(), attempts: 0 };
    appendFileSync(QUEUE_PATH, JSON.stringify(entry) + '\n', 'utf8');
    // Cap file growth
    const q = readQueue();
    if (q.length > MAX_QUEUE_ENTRIES) writeQueue(q);
    return true;
  } catch {
    return false;
  }
}

/**
 * Flush queued writes. Called automatically before every new sync.
 * Entries that keep failing past MAX_ATTEMPTS are dropped (with count reported).
 */
export async function flushQueue(client) {
  const queue = readQueue();
  if (queue.length === 0) return { flushed: 0, remaining: 0, dropped: 0 };

  let ownClient = null;
  if (!client) {
    const conn = await connect();
    if (!conn.client) return { flushed: 0, remaining: queue.length, dropped: 0, error: conn.error };
    ownClient = conn.client;
    client = ownClient;
  }

  const remaining = [];
  let flushed = 0;
  let dropped = 0;
  for (const entry of queue) {
    try {
      await withTimeout(client.execute({ sql: entry.sql, args: entry.args }), CONNECT_TIMEOUT_MS, 'flush');
      flushed++;
    } catch (err) {
      entry.attempts = (entry.attempts || 0) + 1;
      entry.last_error = String(err.message).slice(0, 200);
      if (entry.attempts >= MAX_ATTEMPTS) {
        dropped++;
      } else {
        remaining.push(entry);
      }
    }
  }
  writeQueue(remaining);
  if (ownClient) ownClient.close();
  return { flushed, remaining: remaining.length, dropped };
}

// ---------------------------------------------------------------------------
// Durable execute: try live write; on failure enqueue for later
// ---------------------------------------------------------------------------

/**
 * Execute a batch of writes durably.
 * @param {Array<{table: string, sql: string, args: Array}>} writes
 * @returns {{synced: boolean, live: number, queued: number, flushed: number, reason?: string}}
 */
export async function durableExecute(writes) {
  if (!Array.isArray(writes) || writes.length === 0) {
    return { synced: true, live: 0, queued: 0, flushed: 0 };
  }

  const conn = await connect();
  if (!conn.client) {
    // Fully offline: everything to the queue
    let queued = 0;
    for (const w of writes) {
      if (enqueue(w.table, w.sql, w.args)) queued++;
    }
    return { synced: false, live: 0, queued, flushed: 0, reason: conn.error };
  }

  // Self-heal: flush backlog first so ordering is roughly preserved
  const flush = await flushQueue(conn.client);

  let live = 0;
  let queued = 0;
  for (const w of writes) {
    try {
      await withTimeout(conn.client.execute({ sql: w.sql, args: w.args }), CONNECT_TIMEOUT_MS, w.table);
      live++;
    } catch (err) {
      if (enqueue(w.table, w.sql, w.args)) queued++;
    }
  }
  conn.client.close();
  return { synced: queued === 0, live, queued, flushed: flush.flushed };
}

/**
 * Health check: connectivity, queue depth, table counts.
 */
export async function syncHealth() {
  const queue = readQueue();
  const conn = await connect();
  if (!conn.client) {
    return {
      ok: false,
      reachable: false,
      reason: conn.error,
      queue_depth: queue.length,
      hint: queue.length > 0 ? 'Writes are queued locally and will flush on next successful sync.' : undefined,
    };
  }
  const counts = {};
  for (const table of ['agent_os_episodes', 'ship_loop_goals', 'ship_loop_evals', 'hook_telemetry']) {
    try {
      const rs = await conn.client.execute(`SELECT COUNT(*) AS n FROM ${table}`);
      counts[table] = Number(rs.rows[0]?.n || 0);
    } catch {
      counts[table] = null;
    }
  }
  conn.client.close();
  return { ok: true, reachable: true, url: String(conn.url).slice(0, 48), queue_depth: queue.length, counts };
}
