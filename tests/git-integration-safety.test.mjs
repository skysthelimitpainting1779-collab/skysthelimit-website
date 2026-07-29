import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  validateIntegrationCandidate,
  validateWorktreeCleanup,
} from '../scripts/lib/git-integration-safety.mjs';

const AUDITED = '5eb385d33976503cdac81e982ed74fbbc7f6839c';
const INTEGRATION = '82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a';
const WORKER = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

test('accepts an integration candidate based on the audited integration line', () => {
  const result = validateIntegrationCandidate({
    auditedHeadSha: AUDITED,
    integrationHeadSha: INTEGRATION,
    workerBaseSha: INTEGRATION,
    workerHeadSha: WORKER,
    workerClean: true,
    integrationHeadAncestors: [AUDITED, INTEGRATION],
    changedFiles: ['src/views/Estimate.tsx'],
    executionAuthorityFiles: ['.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl'],
  });

  assert.deepEqual(result, { ok: true, errors: [], warnings: [] });
});

test('rejects integration candidate from stale base', () => {
  const result = validateIntegrationCandidate({
    auditedHeadSha: AUDITED,
    integrationHeadSha: INTEGRATION,
    workerBaseSha: AUDITED,
    workerHeadSha: WORKER,
    workerClean: true,
    integrationHeadAncestors: [AUDITED, INTEGRATION],
    changedFiles: ['src/views/Estimate.tsx'],
    executionAuthorityFiles: ['.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl'],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /stale base/i);
});

test('rejects dirty worker integration', () => {
  const result = validateIntegrationCandidate({
    auditedHeadSha: AUDITED,
    integrationHeadSha: INTEGRATION,
    workerBaseSha: INTEGRATION,
    workerHeadSha: WORKER,
    workerClean: false,
    integrationHeadAncestors: [AUDITED, INTEGRATION],
    changedFiles: ['src/views/Estimate.tsx'],
    executionAuthorityFiles: ['.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl'],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /dirty/i);
});

test('rejects duplicate execution authority files in a candidate', () => {
  const result = validateIntegrationCandidate({
    auditedHeadSha: AUDITED,
    integrationHeadSha: INTEGRATION,
    workerBaseSha: INTEGRATION,
    workerHeadSha: WORKER,
    workerClean: true,
    integrationHeadAncestors: [AUDITED, INTEGRATION],
    changedFiles: ['.agents/execution/copy-audited.jsonl'],
    executionAuthorityFiles: [
      '.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl',
      '.agents/execution/copy-audited.jsonl',
    ],
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /duplicate execution authority/i);
});

test('allows cleanup for a clean worktree whose head is reachable from integration', () => {
  const result = validateWorktreeCleanup({
    classification: 'CLEAN_RESUMABLE',
    headSha: WORKER,
    reachableShas: [AUDITED, INTEGRATION, WORKER],
    quarantineId: null,
    archiveSha256: null,
  });

  assert.deepEqual(result, { ok: true, action: 'REMOVE_WORKTREE_ALLOWED', errors: [] });
});

test('rejects cleanup for dirty changes without quarantine preservation', () => {
  const result = validateWorktreeCleanup({
    classification: 'DIRTY_PRESERVE',
    headSha: WORKER,
    reachableShas: [AUDITED, INTEGRATION],
    quarantineId: null,
    archiveSha256: null,
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /quarantine/i);
});

test('allows cleanup for dirty changes only after quarantine preservation exists', () => {
  const result = validateWorktreeCleanup({
    classification: 'DIRTY_PRESERVE',
    headSha: WORKER,
    reachableShas: [AUDITED, INTEGRATION],
    quarantineId: 'f'.repeat(64),
    archiveSha256: 'e'.repeat(64),
  });

  assert.deepEqual(result, { ok: true, action: 'REMOVE_WORKTREE_ALLOWED', errors: [] });
});

test('rejects cleanup when unique commit is neither reachable nor archived', () => {
  const result = validateWorktreeCleanup({
    classification: 'QUARANTINE',
    headSha: WORKER,
    reachableShas: [AUDITED, INTEGRATION],
    quarantineId: 'f'.repeat(64),
    archiveSha256: null,
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /reachable or archived/i);
});
