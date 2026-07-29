import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  reconcileActiveState,
  reconciliationStateHash,
} from '../scripts/lib/active-state-reconciliation.mjs';

const NOW = new Date('2026-07-29T20:45:00Z');
const AUDITED_HEAD = '5eb385d33976503cdac81e982ed74fbbc7f6839c';
const CHECKPOINT_HEAD = '82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a';
const NEXT_HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function baseState(overrides = {}) {
  return {
    programId: 'stl-post-g20-sequential-tdd-v1',
    integrationBranch: 'agent/skys-limit-convex-os',
    importedCursor: {
      nodeId: 'AUDIT-SECURITY-REMEDIATION',
      stageId: 'stage:AUDIT-SECURITY-REMEDIATION:write_red_test',
      headSha: AUDITED_HEAD,
    },
    graph: {
      nodes: {
        'AUDIT-SECURITY-REMEDIATION': { dependsOn: [] },
        'AUDIT-REPOSITORY-HYGIENE': { dependsOn: ['AUDIT-SECURITY-REMEDIATION'] },
        'STL-301': { dependsOn: ['ORCH-004'] },
        'STL-201': { dependsOn: ['STL-004', 'STL-103', 'STL-106', 'STL-107', 'STL-301'] },
        'STL-202': { dependsOn: ['STL-107', 'STL-201'] },
      },
      historicalCompleteNodeIds: ['STL-004', 'STL-103', 'STL-106', 'STL-107', 'ORCH-004'],
    },
    lifecycle: {
      activeLeases: [],
      checkpoints: [],
      handoffs: [],
    },
    worktree: {
      branch: 'agent/skys-limit-convex-os',
      headSha: CHECKPOINT_HEAD,
      ancestorShas: [AUDITED_HEAD, CHECKPOINT_HEAD],
      clean: true,
    },
    ...overrides,
  };
}

function checkpoint(overrides = {}) {
  return {
    checkpointId: 'cp-20260729-stl301-001',
    nodeId: 'STL-301',
    stageId: 'stage:STL-301:complete',
    eventType: 'checkpoint_completed',
    headSha: CHECKPOINT_HEAD,
    createdAt: '2026-07-29T20:26:17Z',
    ...overrides,
  };
}

function handoff(overrides = {}) {
  return {
    handoffId: 'handoff-20260729-stl301-to-stl201-001',
    status: 'accepted',
    checkpointId: 'cp-20260729-stl301-001',
    nodeId: 'STL-301',
    stageId: 'stage:STL-301:complete',
    headSha: CHECKPOINT_HEAD,
    nextNode: 'STL-201',
    nextStage: 'stage:STL-201:acquire_writer_mutex',
    createdAt: '2026-07-29T20:26:17Z',
    acceptedAt: '2026-07-29T20:28:24Z',
    ...overrides,
  };
}

function lease(overrides = {}) {
  return {
    checkpointId: 'cp-20260729-stl201-001',
    nodeId: 'STL-201',
    stageId: 'stage:STL-201:acquire_writer_mutex',
    branch: 'agent/skys-limit-convex-os',
    headSha: CHECKPOINT_HEAD,
    acquiredAt: '2026-07-29T20:28:41Z',
    expiresAt: '2026-07-29T21:28:41Z',
    ...overrides,
  };
}

test('reconciles stale imported cursor with newer accepted lifecycle progress', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [],
        checkpoints: [checkpoint()],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'RECONCILED');
  assert.equal(result.authority, 'accepted_handoff');
  assert.equal(result.effectiveCursor.nodeId, 'STL-201');
  assert.equal(result.effectiveCursor.stageId, 'stage:STL-201:acquire_writer_mutex');
});

test('expired lease does not override a valid accepted handoff', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [lease({ expiresAt: '2026-07-29T20:30:00Z' })],
        checkpoints: [checkpoint()],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'RECONCILED');
  assert.equal(result.authority, 'accepted_handoff');
  assert.equal(result.effectiveCursor.nodeId, 'STL-201');
});

test('quarantines a lease pointing to a missing checkpoint', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [lease()],
        checkpoints: [],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.match(result.reason, /missing checkpoint/i);
});

test('quarantines a lease bound to the wrong branch', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [lease({ branch: 'agent/other-branch' })],
        checkpoints: [checkpoint({ checkpointId: 'cp-20260729-stl201-001', nodeId: 'STL-201' })],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.match(result.reason, /branch/i);
});

test('quarantines a lease whose head is not ancestral to the current worktree head', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [lease({ headSha: NEXT_HEAD })],
        checkpoints: [checkpoint({ checkpointId: 'cp-20260729-stl201-001', nodeId: 'STL-201', headSha: NEXT_HEAD })],
        handoffs: [handoff()],
      },
      worktree: {
        branch: 'agent/skys-limit-convex-os',
        headSha: CHECKPOINT_HEAD,
        ancestorShas: [AUDITED_HEAD, CHECKPOINT_HEAD],
        clean: true,
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.match(result.reason, /ancestral/i);
});

test('quarantines handoff with unsatisfied dependencies', () => {
  const result = reconcileActiveState(
    baseState({
      graph: {
        nodes: {
          'STL-201': { dependsOn: ['STL-301', 'MISSING-DONE'] },
        },
        historicalCompleteNodeIds: ['STL-301'],
      },
      lifecycle: {
        activeLeases: [],
        checkpoints: [checkpoint({ nodeId: 'STL-301' })],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.match(result.reason, /unsatisfied dependencies/i);
});

test('quarantines contradictory active lifecycle records', () => {
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [
          lease(),
          lease({ checkpointId: 'cp-other', nodeId: 'STL-202' }),
        ],
        checkpoints: [
          checkpoint({ checkpointId: 'cp-20260729-stl201-001', nodeId: 'STL-201' }),
          checkpoint({ checkpointId: 'cp-other', nodeId: 'STL-202' }),
        ],
        handoffs: [handoff()],
      },
    }),
    { now: NOW },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.match(result.reason, /contradictory/i);
});

test('does not apply partial reconciliation mutation when quarantine is required', () => {
  const applied = [];
  const result = reconcileActiveState(
    baseState({
      lifecycle: {
        activeLeases: [lease({ branch: 'agent/wrong' })],
        checkpoints: [checkpoint({ checkpointId: 'cp-20260729-stl201-001', nodeId: 'STL-201' })],
        handoffs: [handoff()],
      },
    }),
    {
      now: NOW,
      apply: (state) => applied.push(state),
    },
  );

  assert.equal(result.status, 'QUARANTINED');
  assert.deepEqual(applied, []);
});

test('falls back to imported cursor when lifecycle history is empty', () => {
  const result = reconcileActiveState(baseState(), { now: NOW });

  assert.equal(result.status, 'NO_LIFECYCLE_PROGRESS');
  assert.equal(result.authority, 'imported_cursor');
  assert.deepEqual(result.effectiveCursor, {
    nodeId: 'AUDIT-SECURITY-REMEDIATION',
    stageId: 'stage:AUDIT-SECURITY-REMEDIATION:write_red_test',
    headSha: AUDITED_HEAD,
  });
});

test('repeated reconciliation produces an identical state hash', () => {
  const state = baseState({
    lifecycle: {
      activeLeases: [],
      checkpoints: [checkpoint()],
      handoffs: [handoff()],
    },
  });
  const first = reconcileActiveState(state, { now: NOW });
  const second = reconcileActiveState(state, { now: NOW });

  assert.equal(first.status, 'RECONCILED');
  assert.equal(reconciliationStateHash(first), reconciliationStateHash(second));
});
