import assert from 'node:assert/strict';
import test from 'node:test';

import {
  nextCommandIdentity,
  resolveRevisionSync,
} from '../src/components/estimates/estimate-builder-state.ts';

test('dirty estimate edits survive a newer subscription revision until explicit reload', () => {
  assert.equal(
    resolveRevisionSync({
      serverRevision: 2,
      hydratedRevision: 1,
      dirty: true,
      awaitingRevision: null,
    }),
    'preserve-stale'
  );
  assert.equal(
    resolveRevisionSync({
      serverRevision: 2,
      hydratedRevision: 1,
      dirty: false,
      awaitingRevision: null,
    }),
    'hydrate'
  );
  assert.equal(
    resolveRevisionSync({
      serverRevision: 2,
      hydratedRevision: 1,
      dirty: true,
      awaitingRevision: 2,
    }),
    'hydrate'
  );
  assert.equal(
    resolveRevisionSync({
      serverRevision: 1,
      hydratedRevision: 1,
      dirty: true,
      awaitingRevision: 2,
    }),
    'wait'
  );
  assert.equal(
    resolveRevisionSync({
      serverRevision: 3,
      hydratedRevision: 1,
      dirty: true,
      awaitingRevision: 2,
    }),
    'preserve-stale'
  );
});

test('a command retry reuses its request ID until the payload changes', () => {
  let sequence = 0;
  const createId = () => `request-${++sequence}`;
  const first = nextCommandIdentity(null, 'payload-a', createId);
  const retry = nextCommandIdentity(first, 'payload-a', createId);
  const changed = nextCommandIdentity(retry, 'payload-b', createId);

  assert.equal(retry.requestId, first.requestId);
  assert.equal(changed.requestId, 'request-2');
  assert.notEqual(changed.requestId, first.requestId);
});
