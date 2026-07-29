import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyWorktree,
  createQuarantinePlan,
} from '../scripts/lib/worktree-quarantine.mjs';

const HEAD = '82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a';

test('classifies a clean checkpointed worktree as resumable', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: '',
  });

  assert.equal(result.classification, 'CLEAN_RESUMABLE');
  assert.equal(result.preservationRequired, false);
  assert.equal(result.safeToResume, true);
});

test('classifies tracked dirty changes as preservation required', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: ' M src/views/Estimate.tsx\nM  tests/estimate.test.mjs\n',
  });

  assert.equal(result.classification, 'DIRTY_PRESERVE');
  assert.equal(result.preservationRequired, true);
  assert.equal(result.safeToResume, false);
  assert.deepEqual(result.changedFiles, ['src/views/Estimate.tsx', 'tests/estimate.test.mjs']);
});

test('classifies untracked files as preservation required', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: '?? src/lib/estimate.ts\n',
  });

  assert.equal(result.classification, 'DIRTY_PRESERVE');
  assert.deepEqual(result.untrackedFiles, ['src/lib/estimate.ts']);
});

test('quarantines wrong branch even when clean', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/other',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: '',
  });

  assert.equal(result.classification, 'QUARANTINE');
  assert.match(result.reason, /branch/i);
  assert.equal(result.safeToResume, false);
});

test('quarantines descendant head missing checkpoint', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: '',
  });

  assert.equal(result.classification, 'QUARANTINE');
  assert.match(result.reason, /checkpoint/i);
});

test('quarantines unrelated history', () => {
  const result = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: false,
    porcelain: '',
  });

  assert.equal(result.classification, 'QUARANTINE');
  assert.match(result.reason, /ancestor/i);
});

test('creates deterministic quarantine plan without discarding changes', () => {
  const classification = classifyWorktree({
    path: 'C:/repo/worktree',
    branch: 'agent/skys-limit-convex-os',
    expectedBranch: 'agent/skys-limit-convex-os',
    headSha: HEAD,
    checkpointHeadSha: HEAD,
    auditedHeadIsAncestor: true,
    porcelain: ' M src/views/Estimate.tsx\n?? src/lib/estimate.ts\n',
  });
  const first = createQuarantinePlan(classification, {
    diffText: 'diff --git a/src/views/Estimate.tsx b/src/views/Estimate.tsx\n',
    capturedAt: '2026-07-29T20:50:00Z',
  });
  const second = createQuarantinePlan(classification, {
    diffText: 'diff --git a/src/views/Estimate.tsx b/src/views/Estimate.tsx\n',
    capturedAt: '2026-07-29T20:50:00Z',
  });

  assert.equal(first.action, 'PRESERVE_AND_QUARANTINE');
  assert.equal(first.discardAllowed, false);
  assert.equal(first.quarantineId, second.quarantineId);
  assert.equal(first.artifacts[0].sha256.length, 64);
});
