/**
 * Bulletproof primitives for Agent OS.
 * Pure helpers — no hidden side effects beyond optional exec.
 */

import { execFileSync, execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

export const MAX_TASK_ATTEMPTS = 3;
export const STALE_RUNNING_MS = 30 * 60 * 1000; // 30m
export const DEFAULT_CMD_TIMEOUT_MS = 10 * 60 * 1000; // 10m
export const AGENT_OS_VERSION = '2.0.0';

export function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * Zero-theater control plane: only dirs that still do real work.
 * No queues/domains/checkpoints theater trees.
 */
export function ensureControlPlane(root = process.cwd()) {
  const agents = join(root, '.agents');
  const dirs = [
    agents,
    join(agents, 'skills'),
    join(agents, 'rules'),
    join(agents, 'governance'),
    join(agents, 'workflows'),
    join(agents, 'goals'),
    join(agents, 'goals', '_eval'),
    join(root, '.learnings'),
  ];
  for (const d of dirs) ensureDir(d);
  return agents;
}

/**
 * Cross-platform command runner. Prefer direct npm/node over nested PowerShell.
 * Returns { ok, stdout, stderr, code, error }.
 */
export function safeExec(cmd, options = {}) {
  const {
    cwd = process.cwd(),
    timeout = DEFAULT_CMD_TIMEOUT_MS,
    env = process.env,
    maxBuffer = 8 * 1024 * 1024,
  } = options;

  const trimmed = String(cmd || '').trim();
  if (!trimmed) {
    return { ok: false, stdout: '', stderr: 'Empty command', code: 1, error: new Error('Empty command') };
  }

  // Parse simple npm scripts without shell nesting
  const npmRun = trimmed.match(/^npm\s+run\s+(\S+)(.*)$/);
  const npmTest = trimmed.match(/^npm\s+test(.*)$/);
  const nodeScript = trimmed.match(/^node\s+(.+)$/);

  try {
    let stdout = '';
    if (npmRun) {
      const script = npmRun[1];
      const rest = (npmRun[2] || '').trim();
      const args = ['run', script, ...(rest ? rest.split(/\s+/).filter(Boolean) : [])];
      stdout = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
        cwd,
        encoding: 'utf8',
        timeout,
        env,
        maxBuffer,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } else if (npmTest) {
      const rest = (npmTest[1] || '').trim();
      const args = ['test', ...(rest ? rest.split(/\s+/).filter(Boolean) : [])];
      stdout = execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
        cwd,
        encoding: 'utf8',
        timeout,
        env,
        maxBuffer,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } else if (nodeScript) {
      const parts = nodeScript[1].match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const args = parts.map((p) => p.replace(/^"|"$/g, ''));
      stdout = execFileSync(process.execPath, args, {
        cwd,
        encoding: 'utf8',
        timeout,
        env,
        maxBuffer,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } else {
      // Fallback: shell (still no PowerShell nesting)
      const shellCmd =
        process.platform === 'win32' ? trimmed : trimmed;
      stdout = execSync(shellCmd, {
        cwd,
        encoding: 'utf8',
        timeout,
        env,
        maxBuffer,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        shell: true,
      });
    }
    return { ok: true, stdout: stdout || '', stderr: '', code: 0, error: null };
  } catch (err) {
    const stdout = err.stdout ? String(err.stdout) : '';
    const stderr = err.stderr ? String(err.stderr) : err.message || String(err);
    return {
      ok: false,
      stdout,
      stderr,
      code: typeof err.status === 'number' ? err.status : 1,
      error: err,
    };
  }
}

/** Throws with combined message if command fails (compat with existing try/catch). */
export function runCommandOrThrow(cmd, options = {}) {
  const result = safeExec(cmd, options);
  if (!result.ok) {
    const err = new Error(
      `Command failed (${result.code}): ${cmd}\n${result.stderr || result.stdout}`.slice(0, 4000)
    );
    err.stdout = result.stdout;
    err.stderr = result.stderr;
    err.status = result.code;
    throw err;
  }
  return result.stdout;
}

export function normalizeDependencies(task) {
  if (!task) return [];
  if (!Array.isArray(task.dependencies)) return [];
  return task.dependencies.filter(Boolean);
}

export function normalizeTask(task) {
  if (!task || typeof task !== 'object') return null;
  task.attempts = Number.isFinite(task.attempts) ? task.attempts : 0;
  task.dependencies = normalizeDependencies(task);
  task.status = task.status || 'pending';
  task.priority = task.priority || 'medium';
  task.risk_level = task.risk_level || 'low';
  if (!Array.isArray(task.phases)) task.phases = null;
  return task;
}

/**
 * True if task may be scheduled.
 * - pending always (deps ok)
 * - failed only if under max attempts
 * - running only if stale (crash recovery)
 * - never blocked/verified
 */
export function isTaskRunnable(task, completedIds = new Set(), now = Date.now()) {
  const t = normalizeTask(task);
  if (!t) return false;
  if (t.status === 'verified' || t.status === 'blocked') return false;

  const depsOk = t.dependencies.every((d) => completedIds.has(d));
  if (!depsOk) return false;

  if (t.status === 'pending') return true;

  if (t.status === 'failed') {
    return t.attempts < MAX_TASK_ATTEMPTS;
  }

  if (t.status === 'running') {
    const claimed = t.claimed_at || t.updated_at || t.started_at;
    if (!claimed) return true; // unknown — allow reclaim
    const age = now - new Date(claimed).getTime();
    return Number.isFinite(age) && age > STALE_RUNNING_MS;
  }

  return false;
}

export function pickNextTask(tasks, now = Date.now()) {
  const list = Array.isArray(tasks) ? tasks : [];
  const completedIds = new Set(
    list.filter((t) => t && t.status === 'verified').map((t) => t.id)
  );
  const priorityMap = { high: 3, medium: 2, low: 1 };

  const candidates = list
    .filter((t) => isTaskRunnable(t, completedIds, now))
    .sort((a, b) => {
      const pa = priorityMap[a.priority] || 0;
      const pb = priorityMap[b.priority] || 0;
      if (pb !== pa) return pb - pa;
      return String(a.id).localeCompare(String(b.id));
    });

  return candidates[0] || null;
}

function canonicalRepositoryPath(root) {
  const resolved = resolve(String(root || process.cwd()));
  let canonical = resolved;
  try {
    canonical = realpathSync.native(resolved);
  } catch {
    // A not-yet-created root still has a stable absolute identity.
  }
  const normalized = canonical.replace(/\\/g, '/').replace(/\/+$/, '');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function getRepositoryStateNamespace(root = process.cwd()) {
  const canonical = canonicalRepositoryPath(root);
  const label = basename(canonical).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48) || 'repository';
  const digest = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 16);
  return `${label}-${digest}`;
}

function getTaskCheckpointDir(checkpointRoot, taskId) {
  const value = String(taskId);
  const label = value.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 48) || 'task';
  const digest = crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
  return join(checkpointRoot, `${label}-${digest}`);
}

export function getAgentCheckpointDir(env = process.env, root = process.cwd()) {
  const configured = String(env.ANTIGRAVITY_EXECUTABLE_DATA_DIR || '').trim();
  const stateRoot = configured || join(tmpdir(), 'skysthelimit-agent-state');
  return join(stateRoot, 'agent-os', getRepositoryStateNamespace(root), 'checkpoints');
}

export function hasCheckpointForTask(
  db,
  taskId,
  root = process.cwd(),
  dataDir
) {
  const canonicalTaskId = String(taskId || '');
  if (!canonicalTaskId) return false;

  // In-memory first
  if (db && Array.isArray(db.checkpoints)) {
    if (
      db.checkpoints.some(
        (checkpoint) =>
          checkpoint && String(checkpoint.task_id || '') === canonicalTaskId
      )
    ) {
      return true;
    }
  }

  // Dynamic state must stay outside the repository.
  const taskDir = getTaskCheckpointDir(
    dataDir || getAgentCheckpointDir(process.env, root),
    canonicalTaskId
  );
  if (!existsSync(taskDir)) return false;
  try {
    return readdirSync(taskDir).some((name) => name.endsWith('.json'));
  } catch {
    return false;
  }
}

export function writePhaseCheckpoint(
  db,
  {
    taskId,
    sessionId,
    phase,
    logs = '',
    root = process.cwd(),
    dataDir,
  }
) {
  const checkpointRoot = dataDir || getAgentCheckpointDir(process.env, root);
  const taskDir = getTaskCheckpointDir(checkpointRoot, taskId);
  ensureDir(taskDir);
  const chkId = `CHK-${taskId}-${Date.now()}-${phase}`;
  const planPath = join(taskDir, `${Date.now()}-${phase}.json`);
  const record = {
    id: chkId,
    task_id: taskId,
    session_id: sessionId,
    phase,
    status: 'success',
    timestamp: new Date().toISOString(),
    logs: String(logs || '').slice(0, 50_000),
  };
  writeFileSync(planPath, JSON.stringify(record, null, 2), 'utf8');

  if (db) {
    db.checkpoints = Array.isArray(db.checkpoints) ? db.checkpoints : [];
    db.checkpoints.push({
      id: chkId,
      task_id: taskId,
      session_id: sessionId,
      status: 'success',
      phase,
      evidence: planPath.replace(/\\/g, '/').replace(root.replace(/\\/g, '/') + '/', ''),
      timestamp: record.timestamp,
    });
  }
  return record;
}

export function bumpMetric(db, key, delta = 1) {
  if (!db) return;
  db.metrics = db.metrics || {};
  const cur = Number(db.metrics[key]);
  db.metrics[key] = (Number.isFinite(cur) ? cur : 0) + delta;
}

export function safePhaseResumeIndex(task) {
  if (!task || !Array.isArray(task.phases) || task.phases.length === 0) return 0;
  if (!task.current_phase) return 0;
  const idx = task.phases.indexOf(task.current_phase);
  if (idx < 0) return 0;
  // Resume at NEXT phase after last completed
  return Math.min(idx + 1, task.phases.length);
}

export function shouldQuarantineTask(task) {
  const t = normalizeTask(task);
  return t && t.attempts >= MAX_TASK_ATTEMPTS;
}

export function graphifyEnabled() {
  return process.env.AGENT_OS_GRAPHIFY === '1' || process.env.AGENT_OS_GRAPHIFY === 'true';
}

export function scanOnSaveEnabled() {
  // Default ON for status/bootstrap richness; allow disable for speed/tests
  if (process.env.AGENT_OS_SKIP_SCAN === '1' || process.env.AGENT_OS_SKIP_SCAN === 'true') {
    return false;
  }
  return true;
}

export function idempotencyKey(cmd, context) {
  return crypto.createHash('sha256').update(String(cmd) + '|' + String(context)).digest('hex').slice(0, 24);
}

/**
 * Atomic-ish JSON write: write temp then rename (Windows-safe fallback).
 */
export function writeJsonAtomic(filePath, data) {
  const payload = JSON.stringify(data, null, 2);
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

export function readJsonSafe(filePath, fallback = null) {
  try {
    if (!existsSync(filePath)) return fallback;
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Entry criteria: initial phases free; later phases need a prior checkpoint (auto-seed PLAN if missing). */
export function assertPhaseEntry(db, task, phase, sessionId, options = {}) {
  const initialPhases = new Set(['PLAN', 'QUERY', 'TRIAGE']);
  if (initialPhases.has(phase)) return { ok: true, seeded: false };

  const root = options.root || process.cwd();
  const dataDir = options.dataDir || getAgentCheckpointDir(process.env, root);
  if (hasCheckpointForTask(db, task.id, root, dataDir)) {
    return { ok: true, seeded: false };
  }

  // Bulletproof: auto-seed a PLAN checkpoint instead of hard-failing the whole harness
  if (options.autoSeed !== false) {
    writePhaseCheckpoint(db, {
      taskId: task.id,
      sessionId,
      phase: 'PLAN',
      logs: `[auto-seed] Entry criteria: seeded PLAN checkpoint before ${phase}`,
      root,
      dataDir,
    });
    return { ok: true, seeded: true };
  }

  return {
    ok: false,
    seeded: false,
    error: `Entry criteria failed for phase ${phase}: No active checkpoints found for task ${task.id}`,
  };
}
