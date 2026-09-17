import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import { previewRobotsTag, PREVIEW_ROBOTS_TAG } from '../src/lib/preview-noindex.ts';

// ---------------------------------------------------------------------------
// #162 — Noindex Vercel preview deployments, preserve production indexation
// ---------------------------------------------------------------------------
describe('preview noindex policy (#162)', () => {
  test('preview deployments return noindex, nofollow', () => {
    assert.equal(previewRobotsTag('preview'), 'noindex, nofollow');
    assert.equal(previewRobotsTag('preview'), PREVIEW_ROBOTS_TAG);
  });

  test('only VERCEL_ENV=preview is tagged (other values stay indexable)', () => {
    // Vercel uses VERCEL_ENV=preview for both PR previews and branch deploys;
    // every other value — development, empty string, anything unrecognized —
    // must return undefined so production indexing is never blocked.
    assert.equal(previewRobotsTag('development'), undefined);
    assert.equal(previewRobotsTag(''), undefined);
    assert.equal(previewRobotsTag('staging'), undefined);
  });

  test('production indexing is never blocked', () => {
    assert.equal(previewRobotsTag('production'), undefined);
  });

  test('unset environment defaults to indexable (no tag)', () => {
    assert.equal(previewRobotsTag(undefined), undefined);
  });
});
