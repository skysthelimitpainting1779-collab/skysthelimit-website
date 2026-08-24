import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createManualApplyController } from '../.github/skills/impeccable/scripts/live/manual-apply.mjs';
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
  const hardenedPrefix = 'python .agents/skills/hardened-validation/scripts/run.py node ';

  assert.equal(agentSkill, githubSkill);
  for (const command of [
    'scripts/validate-graph.mjs .graph/graph.json',
    'scripts/critical-path.mjs .graph/graph.json',
    'scripts/estimate-cost.mjs .graph/graph.json --scenario expected',
  ]) {
    assert.match(agentSkill, new RegExp(`^${hardenedPrefix}${command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
  }
  assert.doesNotMatch(agentSkill, /^node scripts\/(?:validate-graph|critical-path|estimate-cost)\.mjs/m);
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
  assert.match(liveServer, /manualApply\.finalizeRecoveredResult\(recoveredManualApplyEvent, validation\.result\)/);
});

test('recovered Manual Apply completion clears only the exact applied operations', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'manual-apply-recovery-'));
  const store = createLiveSessionStore({ cwd });
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
  const result = {
    status: 'done',
    appliedEntryIds: ['entry-1'],
    failed: [],
    files: ['src/page.tsx'],
    notes: [],
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
        store.appendEvent(value);
      },
      cwd,
    });

    assert.deepEqual(controller.finalizeRecoveredResult(event, result), { ok: true, cleared: 1 });
    assert.equal(store.getSnapshot(event.id), null);
    assert.deepEqual(readBuffer(cwd).entries[0].ops, [{ ref: 'body', newText: 'Keep this pending' }]);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
