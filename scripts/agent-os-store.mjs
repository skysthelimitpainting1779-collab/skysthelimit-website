/**
 * Agent OS control-plane store.
 *
 * Backends:
 *   1. Turso / libSQL  — when TURSO_DATABASE_URL is set (optional TURSO_AUTH_TOKEN)
 *   2. Local JSON      — always mirrored at .agents/hub_db.json (offline + git-friendly)
 *
 * Document model: single row `agent_os_docs.id = 'hub'` holds the full hub payload JSON.
 * That preserves the existing agent-os document shape without a full relational rewrite.
 *
 * Env:
 *   TURSO_DATABASE_URL   libsql://... or file:./.agents/agent-os.db
 *   TURSO_AUTH_TOKEN     required for remote Turso
 *   AGENT_OS_STORE=json|turso|auto   default auto (turso if URL set, else json)
 */

import { createClient } from '@libsql/client';
import { config as loadDotenv } from 'dotenv';
import { execFileSync, execSync as gitExecSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const DOC_ID = 'hub';

function root() {
  return process.cwd();
}

function localJsonPath() {
  return join(root(), '.agents', 'hub_db.json');
}

let dotenvLoaded = false;
let client = null;
let mode = 'json'; // 'json' | 'turso'
let cache = null;
let ready = false;
let lastPersistError = null;

function loadEnv() {
  if (dotenvLoaded) return;
  dotenvLoaded = true;
  // Local overrides first; ignore missing files
  for (const f of ['.env.local', '.env']) {
    const p = join(root(), f);
    if (existsSync(p)) {
      loadDotenv({ path: p, override: false });
    }
  }
}

function ensureParent(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function writeJsonAtomic(filePath, data) {
  ensureParent(filePath);
  const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, payload, 'utf8');
  try {
    renameSync(tmp, filePath);
  } catch {
    writeFileSync(filePath, payload, 'utf8');
    try {
      unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  }
}

function readLocalJson() {
  const LOCAL_JSON = localJsonPath();
  if (!existsSync(LOCAL_JSON)) return null;
  try {
    return JSON.parse(readFileSync(LOCAL_JSON, 'utf8'));
  } catch (err) {
    const bak = `${LOCAL_JSON}.corrupt.${Date.now()}.bak`;
    try {
      copyFileSync(LOCAL_JSON, bak);
      console.error(`[agent-os-store] Local hub corrupt; backed up to ${bak}`);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function writeLocalJson(db) {
  writeJsonAtomic(localJsonPath(), db);
}

export function getStoreMode() {
  return mode;
}

export function getLocalJsonPath() {
  return localJsonPath();
}

export function isStoreReady() {
  return ready;
}

export function getLastPersistError() {
  return lastPersistError;
}

/**
 * Resolve backend: auto | turso | json
 */
function resolveMode() {
  loadEnv();
  const pref = (process.env.AGENT_OS_STORE || 'auto').toLowerCase();
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || '';
  if (pref === 'json') return 'json';
  if (pref === 'turso') {
    if (!url) {
      console.warn('[agent-os-store] AGENT_OS_STORE=turso but TURSO_DATABASE_URL missing — falling back to json');
      return 'json';
    }
    return 'turso';
  }
  // auto
  return url ? 'turso' : 'json';
}

async function ensureSchema(c) {
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_docs (
      id TEXT PRIMARY KEY NOT NULL,
      kind TEXT NOT NULL DEFAULT 'hub',
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )
  `);
  // Optional relational index for fast filters (mirrors learning incidents)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_incidents (
      fingerprint TEXT PRIMARY KEY NOT NULL,
      id TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      status TEXT,
      title TEXT,
      prevention TEXT,
      count INTEGER DEFAULT 1,
      healable INTEGER DEFAULT 0,
      last_seen TEXT,
      payload TEXT
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT,
      title TEXT,
      status TEXT,
      priority TEXT,
      attempts INTEGER DEFAULT 0,
      command TEXT,
      payload TEXT,
      updated_at TEXT
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_episodes (
      id TEXT PRIMARY KEY NOT NULL,
      task TEXT,
      outcome TEXT,
      area TEXT,
      pattern TEXT,
      friction TEXT,
      duration_min INTEGER,
      tools_used TEXT,
      steps_count INTEGER,
      incident_refs TEXT,
      recorded_at TEXT,
      payload TEXT
    )
  `);
}

function readTextIfExists(relPath) {
  const p = join(root(), relPath);
  if (!existsSync(p)) return null;
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function readJsonIfExists(relPath) {
  const raw = readTextIfExists(relPath);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function upsertDoc(c, id, kind, payloadObjOrString) {
  const updatedAt = new Date().toISOString();
  const payload =
    typeof payloadObjOrString === 'string'
      ? payloadObjOrString
      : JSON.stringify(payloadObjOrString);
  await c.execute({
    sql: `
      INSERT INTO agent_os_docs (id, kind, payload, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    args: [id, kind, payload, updatedAt],
  });
  return updatedAt;
}

/**
 * Build a compact, agent-readable summary of the entire control plane.
 */
export function buildControlPlaneSummary() {
  const hub = readLocalJson() || readJsonIfExists('.agents/hub_db.json') || {};
  const learn = readJsonIfExists('.learnings/index.json') || { incidents: {}, stats: {} };
  const prevention = readTextIfExists('.agents/governance/PREVENTION_RULES.md') || '';
  const errorsIndex = readTextIfExists('.learnings/ERRORS_INDEX.md') || '';
  const contract = readTextIfExists('.agents/implementation-contract.md') || '';
  const operating = readTextIfExists('.agents/operating-summary.md') || '';

  const tasks = Array.isArray(hub.tasks) ? hub.tasks : [];
  const goals = Array.isArray(hub.goals) ? hub.goals : [];
  const incidents = Object.values(learn.incidents || {});
  const byStatus = {};
  for (const t of tasks) {
    byStatus[t.status || 'unknown'] = (byStatus[t.status || 'unknown'] || 0) + 1;
  }
  const byCategory = {};
  for (const i of incidents) {
    byCategory[i.category || 'general'] = (byCategory[i.category || 'general'] || 0) + 1;
  }

  const realLessons = incidents
    .filter((i) => !/synthetic|dedupe-test/i.test(String(i.title || '')))
    .sort((a, b) => (b.count || 1) - (a.count || 1));

  const summary = {
    type: 'agent_os_summary',
    version: 1,
    generated_at: new Date().toISOString(),
    project: "Sky's the Limit Painting LLC",
    system: hub.meta?.system || 'Agentic OS',
    store: {
      prefer: 'turso',
      local_mirror: '.agents/hub_db.json',
    },
    goals: goals.map((g) => ({
      id: g.id,
      status: g.status,
      description: g.description,
    })),
    tasks: {
      total: tasks.length,
      by_status: byStatus,
      items: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        goal_id: t.goal_id,
        attempts: t.attempts || 0,
        command: t.command || null,
      })),
    },
    metrics: hub.metrics || {},
    learning: {
      stats: learn.stats || {},
      unique: incidents.length,
      by_category: byCategory,
      top_lessons: realLessons.slice(0, 15).map((i) => ({
        id: i.id,
        category: i.category,
        status: i.status,
        count: i.count,
        title: i.title,
        prevention: i.prevention,
      })),
    },
    policies: (hub.policies || []).map((p) => ({ id: p.id, type: p.type, rule: p.rule })),
    rails: {
      max_task_attempts: 3,
      quarantine_only: true,
      learning_loop: 'scripts/learning-loop.mjs',
      core: 'scripts/agent-os-core.mjs',
      store: 'scripts/agent-os-store.mjs',
    },
    cold_start: {
      read: [
        '.learnings/ERRORS_INDEX.md',
        '.agents/governance/PREVENTION_RULES.md',
        'summary doc in Turso (id=summary)',
      ],
      do_not_read: ['.learnings/ERRORS.md full dump', '.agents/knowledge.md error paste'],
    },
    artifacts_included: [
      'hub',
      'learnings',
      'summary',
      'summary_md',
      'prevention_md',
      'errors_index_md',
      'operating_summary_md',
      'implementation_contract_md',
    ],
  };

  const md = `# Agent OS Control Plane Summary

**Generated:** ${summary.generated_at}  
**Project:** Sky's the Limit Painting LLC  
**System:** ${summary.system}

## Goals

${goals.length ? goals.map((g) => `- **${g.id}** [${g.status}] ${g.description || ''}`).join('\n') : '_None_'}

## Tasks (${tasks.length})

| Status | Count |
|--------|------:|
${Object.entries(byStatus)
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n') || '| — | 0 |'}

### Task list

${tasks
  .map((t) => `- \`${t.id}\` **${t.status}** — ${t.title || '(untitled)'}${t.command ? ` (\`${t.command}\`)` : ''}`)
  .join('\n') || '_None_'}

## Learning loop

- Unique fingerprints: **${incidents.length}**
- Total records: **${learn.stats?.total_records ?? 'n/a'}**
- Dupes suppressed: **${learn.stats?.duplicates_suppressed ?? 0}**
- Auto-heals: **${learn.stats?.auto_heals ?? 0}**

### Top real lessons

${
  realLessons.length
    ? realLessons
        .slice(0, 12)
        .map(
          (i) =>
            `- **${i.id}** [${i.category}/${i.status} ×${i.count}] ${i.title}\n  - Prevention: ${i.prevention}`
        )
        .join('\n')
    : '_No production lessons yet._'
}

## Reliability rails

- Max attempts: 3 → blocked + dead-letter
- Quarantine only (no auto git checkout)
- Checkpoints auto-seed PLAN when missing
- Commands via safeExec (no nested PowerShell npm)
- Dual-write: Turso + \`.agents/hub_db.json\`

## Cold-start for agents

1. Turso doc \`summary\` (this summary JSON) or local \`.agents/TURSO_SUMMARY.md\`
2. \`.learnings/ERRORS_INDEX.md\`
3. \`.agents/governance/PREVENTION_RULES.md\`
4. Do **not** load full ERRORS dumps by default

## Docs embedded in Turso

| Doc id | Kind | Source |
|--------|------|--------|
| hub | hub | .agents/hub_db.json |
| learnings | learnings | .learnings/index.json |
| summary | summary | generated |
| summary_md | markdown | generated |
| prevention_md | markdown | .agents/governance/PREVENTION_RULES.md |
| errors_index_md | markdown | .learnings/ERRORS_INDEX.md |
| operating_summary_md | markdown | .agents/operating-summary.md |
| implementation_contract_md | markdown | .agents/implementation-contract.md |

---
_Also mirrored locally at \`.agents/TURSO_SUMMARY.md\` and \`.agents/TURSO_SUMMARY.json\`._
`;

  return {
    summary,
    md,
    hub,
    learn,
    prevention,
    errorsIndex,
    contract,
    operating,
  };
}

/**
 * Connect to Turso/libSQL using env, or default file:./.agents/agent-os.db
 * so "push entire" always has a place to land.
 */
export async function connectTursoClient(options = {}) {
  loadEnv();
  let url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || options.url || '';
  if (!url) {
    url = 'file:./.agents/agent-os.db';
    console.warn(`[agent-os-store] No TURSO_DATABASE_URL — using local ${url}`);
  }
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || options.authToken;
  const isFile = String(url).startsWith('file:');
  const c = createClient({
    url,
    ...(authToken && !isFile ? { authToken } : {}),
  });
  await ensureSchema(c);
  return { client: c, url, isFile };
}

function runGit(args) {
  try {
    const argv = Array.isArray(args) ? args : String(args).split(' ').filter(Boolean);
    // Prefer execFileSync for git so Windows does not expand %H/%h
    if (argv[0] === 'git' || !Array.isArray(args)) {
      const gitArgs = argv[0] === 'git' ? argv.slice(1) : argv;
      return execFileSync('git', gitArgs, {
        encoding: 'utf8',
        cwd: root(),
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        timeout: 45_000,
      }).trim();
    }
    return gitExecSync(args, {
      encoding: 'utf8',
      cwd: root(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      timeout: 45_000,
    }).trim();
  } catch (err) {
    const msg = err.stderr ? String(err.stderr) : err.message;
    return `[git error] ${msg}`.slice(0, 2000);
  }
}

/**
 * Capture full git platform snapshot (branch policy surface + live repo state).
 */
export function captureGitPlatform() {
  const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const sha = runGit(['rev-parse', 'HEAD']);
  const short = runGit(['rev-parse', '--short', 'HEAD']);
  const status = runGit(['status', '--porcelain=v1', '-b']);
  const remotes = runGit(['remote', '-v']);
  const log = runGit([
    'log',
    '-20',
    '--pretty=format:%H%x7c%h%x7c%an%x7c%ae%x7c%cI%x7c%s',
  ]);
  const commits = String(log)
    .split('\n')
    .filter((l) => l && !l.startsWith('[git error]'))
    .map((line) => {
      const [full, h, an, ae, cI, ...rest] = line.split('|');
      return {
        sha: full,
        short: h,
        author: an,
        email: ae,
        date: cI,
        subject: rest.join('|'),
      };
    });

  return {
    captured_at: new Date().toISOString(),
    branch,
    head: { sha, short },
    status_porcelain: status,
    remotes,
    recent_commits: commits,
    policies: {
      protected_branches: ['main', 'staging'],
      allowed_branch_prefixes: [
        'feat/',
        'fix/',
        'chore/',
        'docs/',
        'infra/',
        'devin/',
        'agent/',
        'dependabot/',
      ],
      conventional_commits: true,
      enforce_script: 'scripts/enforce-git.js',
      no_direct_push_main_staging: true,
      ci_boomerang_disabled_on_protected: true,
    },
    scripts: [
      'scripts/enforce-git.js',
      'scripts/agent-os.js',
      'scripts/agent-os-core.mjs',
      'scripts/agent-os-store.mjs',
      'scripts/learning-loop.mjs',
      'scripts/active-prevention.mjs',
      'scripts/goal.mjs',
      'scripts/zero-theater.mjs',
      'scripts/ship-eval.mjs',
    ],
  };
}

/** Lean set — only host-native + real scripts (no queues/hub novels). */
const PLATFORM_FILES = [
  ['.agents/STACK.md', 'markdown'],
  ['.agents/HOST_NATIVE.md', 'markdown'],
  ['.agents/specialists.json', 'json'],
  ['.agents/governance/ROOT_CAUSE.md', 'markdown'],
  ['.agents/governance/ACTIVE_PREVENTION.md', 'markdown'],
  ['.agents/governance/PREVENTION_RULES.md', 'markdown'],
  ['.learnings/index.json', 'json'],
  ['.learnings/ERRORS_INDEX.md', 'markdown'],
  ['.learnings/ERRORS.md', 'markdown'],
  ['scripts/enforce-git.js', 'code'],
  ['scripts/agent-os.js', 'code'],
  ['scripts/agent-os-core.mjs', 'code'],
  ['scripts/agent-os-store.mjs', 'code'],
  ['scripts/learning-loop.mjs', 'code'],
  ['scripts/active-prevention.mjs', 'code'],
  ['scripts/goal.mjs', 'code'],
  ['package.json', 'json'],
  ['AGENTS.md', 'markdown'],
  ['CLAUDE.md', 'markdown'],
  ['README.md', 'markdown'],
];

/**
 * Push the ENTIRE agent + git platform into Turso (full docs, not summary-only).
 * Includes hub, state, learnings, git snapshot, governance, queues, core scripts.
 */
export async function pushAgentGitPlatform(options = {}) {
  const { client: c, url, isFile } = await connectTursoClient(options);
  await ensureSchema(c);

  // Extra tables for full platform
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_files (
      path TEXT PRIMARY KEY NOT NULL,
      kind TEXT,
      bytes INTEGER,
      content TEXT,
      updated_at TEXT
    )
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS agent_os_git_commits (
      sha TEXT PRIMARY KEY NOT NULL,
      short TEXT,
      author TEXT,
      email TEXT,
      date TEXT,
      subject TEXT
    )
  `);

  const pack = buildControlPlaneSummary();
  const { summary, md, hub, learn, prevention, errorsIndex, contract, operating } = pack;
  const gitPlatform = captureGitPlatform();
  const state = readJsonIfExists('.agents/state.json') || {};
  const errorsFull = readTextIfExists('.learnings/ERRORS.md') || '';
  const successLog = readTextIfExists('.learnings/SUCCESS.md') || '';
  const agentsMd = readTextIfExists('.agents/AGENTS.md') || '';
  const rulesMd = readTextIfExists('.agents/rules.md') || '';

  // Local inventory mirror
  ensureParent(join(root(), '.agents', 'TURSO_SUMMARY.md'));
  writeFileSync(join(root(), '.agents', 'TURSO_SUMMARY.md'), md, 'utf8');
  writeJsonAtomic(join(root(), '.agents', 'TURSO_SUMMARY.json'), {
    ...summary,
    git: {
      branch: gitPlatform.branch,
      head: gitPlatform.head,
      commit_count_captured: gitPlatform.recent_commits.length,
    },
    platform: 'agent-git-full',
  });
  writeJsonAtomic(join(root(), '.agents', 'TURSO_GIT_PLATFORM.json'), gitPlatform);

  const updatedAt = new Date().toISOString();
  const docsWritten = [];

  async function put(id, kind, payload) {
    await upsertDoc(c, id, kind, payload);
    docsWritten.push(id);
  }

  // Core control-plane documents (FULL payloads)
  await put('hub', 'hub', hub || {});
  await put('state', 'state', state);
  await put('learnings', 'learnings', learn || {});
  await put('git_platform', 'git', gitPlatform);
  await put('summary', 'summary', {
    ...summary,
    platform: 'agent-git-full',
    git_branch: gitPlatform.branch,
    git_head: gitPlatform.head,
  });
  await put('summary_md', 'markdown', md);
  await put('agents_md', 'markdown', agentsMd);
  await put('rules_md', 'markdown', rulesMd);
  await put('prevention_md', 'markdown', prevention || '');
  await put('errors_index_md', 'markdown', errorsIndex || '');
  await put('errors_md', 'markdown', errorsFull);
  await put('success_md', 'markdown', successLog);
  await put('operating_summary_md', 'markdown', operating || '');
  await put('implementation_contract_md', 'markdown', contract || '');

  // Full file table — entire agent/git platform source of truth files
  await c.execute('DELETE FROM agent_os_files');
  let filesWritten = 0;
  const MAX_FILE_BYTES = 1_500_000; // skip multi-MB skills/dashboard
  for (const [rel, kind] of PLATFORM_FILES) {
    const abs = join(root(), rel);
    if (!existsSync(abs)) continue;
    let content = '';
    try {
      const buf = readFileSync(abs);
      if (buf.length > MAX_FILE_BYTES) {
        content = `[skipped: ${buf.length} bytes exceeds cap ${MAX_FILE_BYTES}]`;
      } else {
        content = buf.toString('utf8');
      }
    } catch (err) {
      content = `[read error: ${err.message}]`;
    }
    await c.execute({
      sql: `
        INSERT INTO agent_os_files (path, kind, bytes, content, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [rel.replace(/\\/g, '/'), kind, Buffer.byteLength(content, 'utf8'), content, updatedAt],
    });
    filesWritten += 1;
  }

  // Relational tasks + incidents
  await c.execute('DELETE FROM agent_os_tasks');
  for (const t of hub.tasks || []) {
    await c.execute({
      sql: `
        INSERT INTO agent_os_tasks (id, goal_id, title, status, priority, attempts, command, payload, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        t.id,
        t.goal_id || null,
        t.title || null,
        t.status || null,
        t.priority || null,
        Number(t.attempts) || 0,
        t.command || null,
        JSON.stringify(t),
        updatedAt,
      ],
    });
  }

  await c.execute('DELETE FROM agent_os_incidents');
  for (const [fp, i] of Object.entries(learn.incidents || {})) {
    await c.execute({
      sql: `
        INSERT INTO agent_os_incidents
          (fingerprint, id, category, severity, status, title, prevention, count, healable, last_seen, payload)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        fp,
        i.id || fp,
        i.category || null,
        i.severity || null,
        i.status || null,
        i.title || null,
        i.prevention || null,
        Number(i.count) || 1,
        i.healable ? 1 : 0,
        i.last_seen || null,
        JSON.stringify(i),
      ],
    });
  }

  await c.execute('DELETE FROM agent_os_git_commits');
  for (const cm of gitPlatform.recent_commits || []) {
    if (!cm.sha || String(cm.sha).startsWith('[')) continue;
    await c.execute({
      sql: `
        INSERT INTO agent_os_git_commits (sha, short, author, email, date, subject)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [cm.sha, cm.short, cm.author, cm.email, cm.date, cm.subject],
    });
  }

  await c.execute({
    sql: `
      INSERT INTO agent_os_meta (key, value) VALUES ('platform_synced_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [updatedAt],
  });
  await c.execute({
    sql: `
      INSERT INTO agent_os_meta (key, value) VALUES ('platform_kind', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: ['agent-git-full'],
  });

  if (hub) {
    hub.meta = hub.meta || {};
    hub.meta.store = 'turso';
    hub.meta.platform_synced_at = updatedAt;
    writeLocalJson(hub);
    cache = hub;
  }
  client = c;
  mode = 'turso';
  ready = true;
  if (!process.env.TURSO_DATABASE_URL && !process.env.LIBSQL_URL) {
    process.env.TURSO_DATABASE_URL = url;
  }
  process.env.AGENT_OS_STORE = process.env.AGENT_OS_STORE || 'turso';

  const docs = await c.execute(
    'SELECT id, kind, length(payload) AS bytes, updated_at FROM agent_os_docs ORDER BY id'
  );
  const taskCount = await c.execute('SELECT COUNT(*) AS n FROM agent_os_tasks');
  const incCount = await c.execute('SELECT COUNT(*) AS n FROM agent_os_incidents');
  const fileCount = await c.execute('SELECT COUNT(*) AS n FROM agent_os_files');
  const commitCount = await c.execute('SELECT COUNT(*) AS n FROM agent_os_git_commits');

  return {
    ok: true,
    platform: 'agent-git-full',
    url: isFile ? url : String(url).slice(0, 64),
    is_file_backend: isFile,
    synced_at: updatedAt,
    git: {
      branch: gitPlatform.branch,
      head: gitPlatform.head,
      commits: Number(commitCount.rows[0]?.n || 0),
    },
    docs: docs.rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      bytes: Number(r.bytes),
      updated_at: r.updated_at,
    })),
    tables: {
      tasks: Number(taskCount.rows[0]?.n || 0),
      incidents: Number(incCount.rows[0]?.n || 0),
      files: Number(fileCount.rows[0]?.n || 0),
      git_commits: Number(commitCount.rows[0]?.n || 0),
    },
    files_written: filesWritten,
    docs_written: docsWritten,
    local_mirrors: [
      '.agents/hub_db.json',
      '.agents/TURSO_SUMMARY.md',
      '.agents/TURSO_SUMMARY.json',
      '.agents/TURSO_GIT_PLATFORM.json',
    ],
  };
}

/** @deprecated use pushAgentGitPlatform */
export async function pushEntireToTurso(options = {}) {
  return pushAgentGitPlatform(options);
}

/**
 * Initialize store. Call once at process start (await).
 * @param {{ seed?: object }} [opts] seed document if empty
 */
export async function initStore(opts = {}) {
  loadEnv();
  mode = resolveMode();
  client = null;
  lastPersistError = null;

  if (mode === 'turso') {
    const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined;
    try {
      // file: URLs work offline without token
      const isFile = String(url).startsWith('file:');
      client = createClient({
        url,
        ...(authToken && !isFile ? { authToken } : {}),
      });
      await ensureSchema(client);
      const rs = await client.execute({
        sql: 'SELECT payload FROM agent_os_docs WHERE id = ?',
        args: [DOC_ID],
      });
      if (rs.rows.length > 0 && rs.rows[0].payload) {
        cache = JSON.parse(String(rs.rows[0].payload));
        // Keep local mirror in sync for tooling/git
        writeLocalJson(cache);
      } else {
        // Seed from local JSON if present, else opts.seed
        const local = readLocalJson();
        cache = local || opts.seed || null;
        if (cache) {
          await persistTurso(cache);
          writeLocalJson(cache);
        }
      }
      // stamp backend
      if (cache) {
        cache.meta = cache.meta || {};
        cache.meta.store = 'turso';
        cache.meta.store_url = String(url).replace(/\/\/.*@/, '//***@').slice(0, 80);
      }
      console.log(`[agent-os-store] backend=turso url=${String(url).slice(0, 48)}…`);
    } catch (err) {
      console.error(`[agent-os-store] Turso init failed (${err.message}); falling back to local JSON`);
      mode = 'json';
      client = null;
      cache = readLocalJson() || opts.seed || null;
    }
  } else {
    cache = readLocalJson() || opts.seed || null;
    if (cache) {
      cache.meta = cache.meta || {};
      cache.meta.store = 'json';
    }
    console.log('[agent-os-store] backend=json (.agents/hub_db.json)');
  }

  ready = true;
  return { mode, hasData: !!cache };
}

async function persistTurso(db) {
  if (!client) throw new Error('Turso client not initialized');
  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify(db);
  await client.execute({
    sql: `
      INSERT INTO agent_os_docs (id, kind, payload, updated_at)
      VALUES (?, 'hub', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    args: [DOC_ID, payload, updatedAt],
  });
  await client.execute({
    sql: `
      INSERT INTO agent_os_meta (key, value) VALUES ('hub_updated_at', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [updatedAt],
  });
}

/**
 * Sync get of cached document (after initStore).
 */
export function getHub() {
  return cache;
}

/**
 * Replace in-memory cache (does not persist).
 */
export function setHubCache(db) {
  cache = db;
  return cache;
}

/**
 * Persist hub document to active backend(s). Always mirrors local JSON.
 * @returns {{ mode: string, ok: boolean, error?: string }}
 */
export async function saveHub(db) {
  if (!db || typeof db !== 'object') {
    return { mode, ok: false, error: 'invalid db' };
  }
  cache = db;
  db.meta = db.meta || {};
  db.meta.last_updated = new Date().toISOString();
  db.meta.store = mode;

  // Local mirror always (offline safety)
  try {
    writeLocalJson(db);
  } catch (err) {
    lastPersistError = err.message;
    console.error(`[agent-os-store] local mirror write failed: ${err.message}`);
  }

  if (mode === 'turso' && client) {
    try {
      await persistTurso(db);
      lastPersistError = null;
      return { mode, ok: true };
    } catch (err) {
      lastPersistError = err.message;
      console.error(`[agent-os-store] Turso persist failed (local mirror kept): ${err.message}`);
      return { mode, ok: false, error: err.message };
    }
  }

  return { mode: 'json', ok: true };
}

/**
 * Push local hub_db.json → Turso (migration helper).
 */
export async function migrateLocalToTurso() {
  loadEnv();
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  if (!url) {
    throw new Error('TURSO_DATABASE_URL is required for migrate');
  }
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined;
  const isFile = String(url).startsWith('file:');
  const c = createClient({
    url,
    ...(authToken && !isFile ? { authToken } : {}),
  });
  await ensureSchema(c);

  const local = readLocalJson();
  if (!local) {
    throw new Error(`No local hub at ${localJsonPath()} to migrate`);
  }

  const updatedAt = new Date().toISOString();
  local.meta = local.meta || {};
  local.meta.store = 'turso';
  local.meta.migrated_at = updatedAt;

  await c.execute({
    sql: `
      INSERT INTO agent_os_docs (id, kind, payload, updated_at)
      VALUES (?, 'hub', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    args: [DOC_ID, JSON.stringify(local), updatedAt],
  });

  // Switch process to turso and refresh cache
  process.env.AGENT_OS_STORE = 'turso';
  client = c;
  mode = 'turso';
  cache = local;
  writeLocalJson(local);
  ready = true;

  return {
    ok: true,
    url: String(url).slice(0, 64),
    goals: (local.goals || []).length,
    tasks: (local.tasks || []).length,
    updated_at: updatedAt,
  };
}

/**
 * Pull Turso → local JSON (recovery / inspect).
 */
export async function pullTursoToLocal() {
  loadEnv();
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
  if (!url) throw new Error('TURSO_DATABASE_URL is required');
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined;
  const isFile = String(url).startsWith('file:');
  const c = createClient({
    url,
    ...(authToken && !isFile ? { authToken } : {}),
  });
  await ensureSchema(c);
  const rs = await c.execute({
    sql: 'SELECT payload, updated_at FROM agent_os_docs WHERE id = ?',
    args: [DOC_ID],
  });
  if (!rs.rows.length) {
    throw new Error('No hub document on Turso');
  }
  const db = JSON.parse(String(rs.rows[0].payload));
  writeLocalJson(db);
  cache = db;
  return { ok: true, updated_at: rs.rows[0].updated_at, tasks: (db.tasks || []).length };
}

/**
 * Health / status for CLI.
 */
export async function storeStatus() {
  loadEnv();
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || null;
  return {
    ready,
    mode,
    local_path: localJsonPath(),
    local_exists: existsSync(localJsonPath()),
    turso_url_configured: !!url,
    turso_token_configured: !!(process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN),
    last_persist_error: lastPersistError,
    cache_loaded: !!cache,
    cache_tasks: cache?.tasks?.length ?? 0,
    cache_goals: cache?.goals?.length ?? 0,
  };
}

/** Test helper: reset module state */
export function _resetStoreForTests() {
  client = null;
  mode = 'json';
  cache = null;
  ready = false;
  lastPersistError = null;
  dotenvLoaded = false;
}
