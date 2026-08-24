#!/usr/bin/env node
/**
 * Hook telemetry sync — pushes hooks-state.json event log to Turso.
 * Called automatically from post-commit hook (fire-and-forget).
 * Gives cross-device visibility into what automation actually fires.
 *
 * Durable: rides scripts/lib/turso-sync.mjs — offline writes queue locally
 * and flush on the next successful sync. Dedup via INSERT OR IGNORE on
 * UNIQUE(at, name), so re-pushing the same events is always safe.
 *
 * Env:
 *   TELEMETRY_SKIP=1   disable this sync
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

if (process.env.TELEMETRY_SKIP === '1') process.exit(0);

const STATE_PATH = join(ROOT, '.agents', 'hooks-state.json');
if (!existsSync(STATE_PATH)) process.exit(0);

let state;
try {
  state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
} catch {
  process.exit(0);
}

const events = state.last_events || [];
if (events.length === 0) process.exit(0);

try {
  const { durableExecute } = await import('../lib/turso-sync.mjs');

  const writes = events.map((ev) => {
    const { at, name, ...rest } = ev;
    return {
      table: 'hook_telemetry',
      // INSERT OR IGNORE + UNIQUE(at, name): idempotent, safe to re-push
      sql: 'INSERT OR IGNORE INTO hook_telemetry (at, name, ok, detail) VALUES (?, ?, ?, ?)',
      args: [
        at,
        name,
        ev.ok === false ? 0 : 1,
        Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
      ],
    };
  });

  writes.push({
    table: 'hook_state_summary',
    sql: `INSERT INTO hook_state_summary (id, last_graphify, last_session_sync, last_session_learn, last_episode, event_count, synced_at)
          VALUES ('local', ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            last_graphify = excluded.last_graphify,
            last_session_sync = excluded.last_session_sync,
            last_session_learn = excluded.last_session_learn,
            last_episode = excluded.last_episode,
            event_count = excluded.event_count,
            synced_at = excluded.synced_at`,
    args: [
      state.last_graphify || 0,
      state.last_session_sync || 0,
      state.last_session_learn || 0,
      state.last_episode || 0,
      events.length,
      new Date().toISOString(),
    ],
  });

  await durableExecute(writes);
} catch {
  // Best-effort — never block the hook chain
}
