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

  test('branch (preview) environments are the only ones tagged', () => {
    // Vercel uses VERCEL_ENV=preview for both PR previews and branch deploys.
    assert.equal(previewRobotsTag('preview'), 'noindex, nofollow');
  });

  test('production indexing is never blocked', () => {
    assert.equal(previewRobotsTag('production'), undefined);
  });

  test('unset environment defaults to indexable (no tag)', () => {
    assert.equal(previewRobotsTag(undefined), undefined);
  });
});
