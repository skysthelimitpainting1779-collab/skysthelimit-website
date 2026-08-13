import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createManualApplyController } from '../.github/skills/impeccable/scripts/live/manual-apply.mjs';
import { selectResumeSnapshot } from '../.github/skills/impeccable/scripts/live-resume.mjs';
import {
  readBuffer,
  writeBuffer,
} from '../.github/skills/impeccable/scripts/live/manual-edits-buffer.mjs';
import { createLiveSessionStore } from '../.github/skills/impeccable/scripts/live/session-store.mjs';

const ROOT = new URL('../', import.meta.url);

function read(relativePath) {
  return readFileSync(new URL(relativePath, ROOT), 'utf8');
}

test('Graphify generated output is not assigned an unconfigured merge driver', () => {
  const attributesPath = new URL('../.gitattributes', import.meta.url);
  const attributes = existsSync(attributesPath) ? read('.gitattributes') : '';
  const gitignore = read('.gitignore');

  assert.doesNotMatch(attributes, /merge=graphify/);
  assert.match(gitignore, /^graphify-out\/$/m);
});

test('execution graph gate uses hardened validation in both mirrored bundles', () => {
  const agentSkill = read('.agents/skills/execution-graph-gate/SKILL.md');
  const githubSkill = read('.github/skills/execution-graph-gate/SKILL.md');
  const hardenedPrefix = 'python .agents/skills/hardened-validation/scripts/run.py ';

  assert.equal(agentSkill, githubSkill);
  for (const command of [
    'npm run lifecycle:verify',
    'python scripts/execution/validate_execution_graph.py',
  ]) {
    assert.match(
      agentSkill,
      new RegExp(`^${(hardenedPrefix + command).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'),
    );
  }
  assert.doesNotMatch(agentSkill, /^npm run lifecycle:verify$/m);
  assert.doesNotMatch(agentSkill, /^python scripts\/execution\/validate_execution_graph\.py/m);
});

test('manual Apply dispatch and completion survive through the durable session journal', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'manual-apply-journal-'));
  const pendingEvents = [];
  const pendingApplyDeferreds = new Map();
  const timedOutApplyIds = new Map();
  const store = createLiveSessionStore({ cwd });
  let failCompletionPersistence = false;
  const controller = createManualApplyController({
    pendingEvents,
    pendingApplyDeferreds,
    timedOutApplyIds,
    enqueueEvent(event) {
      pendingEvents.push({ event, leaseUntil: 0 });
    },
    acknowledgePendingEvent() {},
    flushPendingPolls() {},
    recordManualEditActivity() {},
    persistEvent(event) {
      if (event.type === 'complete' && failCompletionPersistence) {
        throw new Error('simulated journal failure');
      }
      store.appendEvent(event);
    },
    cwd,
  });
  const batch = {
    version: 1,
    pageUrl: '/portal',
    count: 1,
    entries: [{
      id: 'entry-1',
      pageUrl: '/portal',
      ops: [{
        ref: 'headline',
        originalText: 'Old headline',
        newText: 'New headline',
        sourceHint: { file: 'src/page.tsx' },
      }],
    }],
    candidates: [],
  };

  try {
    const applyPromise = controller.pushBatchInChunksAndWait(batch, '/portal');
    const event = pendingEvents[0]?.event;
    assert.ok(event?.id);

    const pendingSnapshot = store.getSnapshot(event.id);
    assert.equal(pendingSnapshot.phase, 'manual_edit_apply_requested');
    assert.equal(pendingSnapshot.pendingEvent?.type, 'manual_edit_apply');
    assert.equal(pendingSnapshot.pendingEvent?.batch?.entries?.[0]?.id, 'entry-1');

    const result = {
      status: 'done',
      appliedEntryIds: ['entry-1'],
      failed: [],
      files: ['src/page.tsx'],
      notes: [],
    };
    failCompletionPersistence = true;
    assert.equal(controller.resolveDeferred(event.id, result), false);
    assert.equal(pendingApplyDeferreds.has(event.id), true);
    assert.equal(store.getSnapshot(event.id)?.phase, 'manual_edit_apply_requested');

    failCompletionPersistence = false;
    assert.equal(controller.resolveDeferred(event.id, result), true);
    assert.deepEqual(await applyPromise, result);

    assert.equal(store.getSnapshot(event.id), null);
    const completedSnapshot = store.getSnapshot(event.id, { includeCompleted: true });
    assert.equal(completedSnapshot.phase, 'completed');
    assert.equal(completedSnapshot.pendingEvent, null);
  } finally {
    for (const deferred of pendingApplyDeferreds.values()) clearTimeout(deferred.timer);
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('manual Apply durability code remains mirrored across skill bundles', () => {
  for (const relativePath of [
    'scripts/live/manual-apply.mjs',
    'scripts/live-server.mjs',
    'scripts/live-resume.mjs',
    'scripts/live/session-store.mjs',
  ]) {
    assert.equal(
      read(`.agents/skills/impeccable/${relativePath}`),
      read(`.github/skills/impeccable/${relativePath}`),
      `${relativePath} must be mirrored`,
    );
  }

  const liveServer = read('.agents/skills/impeccable/scripts/live-server.mjs');
  assert.match(liveServer, /const resolved = manualApply\.resolveDeferred\(msg\.id, validation\.result\);/);
  assert.match(liveServer, /if \(!resolved\) \{/);
  assert.match(liveServer, /manual_edit_apply_completion_persist_failed/);
  assert.match(liveServer, /const recoveredManualApplyEvent = findPendingEventById\(msg\.id, 'manual_edit_apply'\);/);
  assert.match(liveServer, /manualApply\.discardRecoveredEvent\(recoveredManualApplyEvent\)/);
  assert.match(liveServer, /manual_edit_apply_requires_retry_after_restart/);
  assert.match(liveServer, /\.sort\(comparePendingSnapshotsForPolling\)/);
  assert.doesNotMatch(liveServer, /finalizeRecoveredResult/);
});

test('no-ID live resume follows poll priority and FIFO ordering', () => {
  const selected = selectResumeSnapshot([
    {
      id: 'newer-but-idle',
      updatedAt: '2026-07-28T12:05:00.000Z',
      pendingEvent: null,
    },
    {
      id: 'old-generate',
      updatedAt: '2026-07-28T12:00:00.000Z',
      pendingEvent: { id: 'generate', type: 'generate' },
    },
    {
      id: 'newer-manual',
      updatedAt: '2026-07-28T12:03:00.000Z',
      pendingEventAt: '2026-07-28T12:01:00.000Z',
      pendingEvent: { id: 'manual-new', type: 'manual_edit_apply' },
    },
    {
      id: 'older-manual',
      updatedAt: '2026-07-28T12:04:00.000Z',
      pendingEventAt: '2026-07-28T12:00:00.000Z',
      pendingEvent: { id: 'manual-old', type: 'manual_edit_apply' },
    },
  ]);

  assert.equal(selected.id, 'older-manual');
  assert.equal(selectResumeSnapshot([
    { id: 'older-idle', updatedAt: '2026-07-28T12:01:00.000Z' },
    { id: 'newer-idle', updatedAt: '2026-07-28T12:02:00.000Z' },
  ]).id, 'newer-idle');
  assert.equal(selectResumeSnapshot([]), null);
});

test('pending event arrival remains stable across later journal updates', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pending-event-arrival-'));
  const store = createLiveSessionStore({ cwd });
  try {
    store.appendEvent({ id: 'resume-1', type: 'manual_edit_apply', pageUrl: '/portal' });
    const initial = store.getSnapshot('resume-1');
    store.appendEvent({
      id: 'resume-1',
      type: 'checkpoint',
      phase: 'manual_edit_apply_requested',
      revision: 2,
    });
    const updated = store.getSnapshot('resume-1');

    assert.ok(initial.pendingEventAt);
    assert.equal(updated.pendingEventAt, initial.pendingEventAt);
    assert.notEqual(updated.updatedAt, null);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('manual edit discard journals Apply cancellation before mutating the buffer', () => {
  const agentRoutes = read('.agents/skills/impeccable/scripts/live/manual-edit-routes.mjs');
  const githubRoutes = read('.github/skills/impeccable/scripts/live/manual-edit-routes.mjs');
  assert.equal(agentRoutes, githubRoutes);
  const discardRoute = agentRoutes.slice(agentRoutes.indexOf("if (p === '/manual-edit-discard'"));
  const cancelIndex = discardRoute.indexOf('manualApply.cancelPendingEvents(pageUrl)');
  const rollbackIndex = discardRoute.indexOf('manualApply.rollbackTransaction');
  const truncateIndex = discardRoute.indexOf('truncateManualEditsBuffer');
  assert.ok(cancelIndex >= 0 && cancelIndex < rollbackIndex && rollbackIndex < truncateIndex);
  assert.match(discardRoute, /failedApplyIds:\s*err\.failedEventIds \|\| \[\]/);
});

test('recovered Manual Apply replies require a fresh verified transaction', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'manual-apply-recovery-'));
  const store = createLiveSessionStore({ cwd });
  let failDiscardPersistence = true;
  const event = {
    type: 'manual_edit_apply',
    id: 'recover-1',
    pageUrl: '/portal',
    batch: {
      entries: [{
        id: 'entry-1',
        ops: [{ ref: 'headline', newText: 'New headline' }],
      }],
    },
  };
  try {
    writeBuffer(cwd, {
      entries: [{
        id: 'entry-1',
        pageUrl: '/portal',
        ops: [
          { ref: 'headline', newText: 'New headline' },
          { ref: 'body', newText: 'Keep this pending' },
        ],
      }],
    });
    store.appendEvent(event);
    const controller = createManualApplyController({
      pendingEvents: [],
      pendingApplyDeferreds: new Map(),
      timedOutApplyIds: new Map(),
      enqueueEvent() {},
      acknowledgePendingEvent() {},
      flushPendingPolls() {},
      recordManualEditActivity() {},
      persistEvent(value) {
        if (value.type === 'discarded' && failDiscardPersistence) {
          throw new Error('simulated journal failure');
        }
        store.appendEvent(value);
      },
      cwd,
    });

    assert.equal(controller.discardRecoveredEvent(event), false);
    assert.equal(store.getSnapshot(event.id)?.phase, 'manual_edit_apply_requested');
    assert.equal(readBuffer(cwd).entries[0].ops.length, 2);

    failDiscardPersistence = false;
    assert.equal(controller.discardRecoveredEvent(event), true);
    assert.equal(store.getSnapshot(event.id), null);
    assert.equal(readBuffer(cwd).entries[0].ops.length, 2);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('manual Apply cancellation fails closed when terminal journaling fails', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'manual-apply-cancel-'));
  const pendingEvents = [];
  const pendingApplyDeferreds = new Map();
  let failDiscardPersistence = true;
  const controller = createManualApplyController({
    pendingEvents,
    pendingApplyDeferreds,
    timedOutApplyIds: new Map(),
    enqueueEvent(event) {
      pendingEvents.push({ event, leaseUntil: 0 });
    },
    acknowledgePendingEvent() {},
    flushPendingPolls() {},
    recordManualEditActivity() {},
    persistEvent(event) {
      if (event.type === 'discarded' && failDiscardPersistence) {
        throw new Error('simulated journal failure');
      }
    },
    cwd,
  });
  const batch = {
    version: 1,
    pageUrl: '/portal',
    entries: [{
      id: 'entry-1',
      pageUrl: '/portal',
      ops: [{ ref: 'headline', originalText: 'Old', newText: 'New' }],
    }],
    candidates: [],
  };
  const applyPromise = controller.pushBatchInChunksAndWait(batch, '/portal');
  applyPromise.catch(() => {});

  try {
    assert.throws(
      () => controller.cancelPendingEvents('/portal'),
      /cancellation was not journaled/
    );
    assert.equal(pendingEvents.length, 1);
    assert.equal(pendingApplyDeferreds.size, 1);

    failDiscardPersistence = false;
    assert.equal(controller.cancelPendingEvents('/portal').length, 1);
    assert.equal(pendingEvents.length, 0);
    assert.equal(pendingApplyDeferreds.size, 0);
    await assert.rejects(applyPromise, /manual_edit_discarded/);
  } finally {
    for (const deferred of pendingApplyDeferreds.values()) clearTimeout(deferred.timer);
    rmSync(cwd, { recursive: true, force: true });
  }
});
