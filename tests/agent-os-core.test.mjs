import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  AGENT_OS_VERSION,
  MAX_TASK_ATTEMPTS,
  assertPhaseEntry,
  bumpMetric,
  getAgentCheckpointDir,
  hasCheckpointForTask,
  idempotencyKey,
  isTaskRunnable,
  normalizeTask,
  pickNextTask,
  safePhaseResumeIndex,
  shouldQuarantineTask,
  writePhaseCheckpoint,
} from '../scripts/agent-os-core.mjs';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('exports a versioned bulletproof core', () => {
  assert.match(AGENT_OS_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(MAX_TASK_ATTEMPTS, 3);
});

test('normalizeTask fills safe defaults', () => {
  const t = normalizeTask({ id: 'T1', status: 'pending' });
  assert.equal(t.attempts, 0);
  assert.deepEqual(t.dependencies, []);
  assert.equal(t.priority, 'medium');
});

test('isTaskRunnable blocks verified/blocked and over-attempted failed', () => {
  const done = new Set(['DEP']);
  assert.equal(isTaskRunnable({ id: 'a', status: 'verified', dependencies: [] }, done), false);
  assert.equal(isTaskRunnable({ id: 'b', status: 'blocked', dependencies: [] }, done), false);
  assert.equal(
    isTaskRunnable({ id: 'c', status: 'failed', attempts: MAX_TASK_ATTEMPTS, dependencies: [] }, done),
    false
  );
  assert.equal(
    isTaskRunnable({ id: 'd', status: 'failed', attempts: 1, dependencies: [] }, done),
    true
  );
  assert.equal(
    isTaskRunnable({ id: 'e', status: 'pending', dependencies: ['DEP'] }, done),
    true
  );
  assert.equal(
    isTaskRunnable({ id: 'f', status: 'pending', dependencies: ['MISSING'] }, done),
    false
  );
});

test('pickNextTask prefers high priority and ignores blocked', () => {
  const next = pickNextTask([
    { id: 'low', status: 'pending', priority: 'low', dependencies: [], attempts: 0 },
    { id: 'high', status: 'pending', priority: 'high', dependencies: [], attempts: 0 },
    { id: 'blocked', status: 'blocked', priority: 'high', dependencies: [], attempts: 3 },
  ]);
  assert.equal(next.id, 'high');
});

test('safePhaseResumeIndex recovers from unknown phase', () => {
  assert.equal(safePhaseResumeIndex({ phases: ['PLAN', 'EXECUTE'], current_phase: null }), 0);
  assert.equal(safePhaseResumeIndex({ phases: ['PLAN', 'EXECUTE'], current_phase: 'PLAN' }), 1);
  assert.equal(safePhaseResumeIndex({ phases: ['PLAN', 'EXECUTE'], current_phase: 'NOPE' }), 0);
});

test('shouldQuarantineTask at max attempts', () => {
  assert.equal(shouldQuarantineTask({ attempts: 2 }), false);
  assert.equal(shouldQuarantineTask({ attempts: 3 }), true);
});

test('assertPhaseEntry auto-seeds when checkpoint missing', () => {
  const db = { checkpoints: [] };
  const task = { id: `TEST-PHASE-${Date.now()}`, title: 't' };
  const entry = assertPhaseEntry(db, task, 'RESEARCH', 'SESS-1', { autoSeed: true });
  assert.equal(entry.ok, true);
  assert.equal(entry.seeded, true);
  assert.equal(hasCheckpointForTask(db, task.id), true);
});

test('phase checkpoints use executable data storage, never the repository', () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'agent-os-repo-'));
  const executableDataRoot = mkdtempSync(join(tmpdir(), 'agent-os-state-'));
  const dataDir = getAgentCheckpointDir({
    ANTIGRAVITY_EXECUTABLE_DATA_DIR: executableDataRoot,
  });

  try {
    const db = { checkpoints: [] };
    const record = writePhaseCheckpoint(db, {
      taskId: 'TEST-EXTERNAL-STATE',
      sessionId: 'SESS-1',
      phase: 'PLAN',
      root: repoRoot,
      dataDir,
    });

    assert.equal(existsSync(join(repoRoot, '.agents', 'goals', '_harness')), false);
    assert.equal(existsSync(join(dataDir, `${record.id}.json`)), true);
    assert.equal(hasCheckpointForTask({ checkpoints: [] }, record.task_id, repoRoot, dataDir), true);
    assert.match(db.checkpoints[0].evidence, /agent-os[\\/]checkpoints/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
    rmSync(executableDataRoot, { recursive: true, force: true });
  }
});

test('idempotencyKey is stable', () => {
  assert.equal(idempotencyKey('npm test', 'T1'), idempotencyKey('npm test', 'T1'));
  assert.notEqual(idempotencyKey('npm test', 'T1'), idempotencyKey('npm test', 'T2'));
});

test('bumpMetric never NaNs', () => {
  const db = { metrics: {} };
  bumpMetric(db, 'tasks_verified', 1);
  bumpMetric(db, 'tasks_verified', 2);
  assert.equal(db.metrics.tasks_verified, 3);
});

test('agent-os.js is a zero-theater kernel wired to core only', () => {
  const src = readFileSync(new URL('../scripts/agent-os.js', import.meta.url), 'utf8');
  assert.match(src, /agent-os-core\.mjs/);
  assert.match(src, /MAX_TASK_ATTEMPTS|shouldQuarantineTask/);
  assert.match(src, /assertPhaseEntry|auto-seed/);
  assert.match(src, /Quarantine only/);
  assert.doesNotMatch(src, /executable\s*=\s*['`]powershell -ExecutionPolicy Bypass -Command "npm/);
  assert.doesNotMatch(src, /runQueueLoop/);
  assert.doesNotMatch(src, /executeNextTask/);
  assert.doesNotMatch(src, /generateHtmlDashboard/);
});
