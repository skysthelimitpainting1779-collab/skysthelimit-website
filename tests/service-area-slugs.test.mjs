// Unit tests for the snapshot-based service-area slug source used by
// internal-links.test.mjs. No network access: the DB side is the checked-in
// snapshot (src/data/serviceAreaSlugs.snapshot.json), regenerated with
// `npm run sync:service-area-slugs`.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';

import { getServiceAreaSlugs } from './helpers/service-area-slugs.mjs';

const SNAPSHOT_PATH = new URL(
  '../src/data/serviceAreaSlugs.snapshot.json',
  import.meta.url,
);
const staticPages = [{ slug: 'minneapolis' }, { slug: 'st-paul' }];

let warnings;
let originalWarn;
let fixtures = [];

beforeEach(() => {
  warnings = [];
  originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
  fixtures = [];
});

afterEach(() => {
  console.warn = originalWarn;
});

function fixtureSnapshot(payload) {
  const dir = mkdtempSync(join(tmpdir(), 'service-area-slugs-'));
  const path = join(dir, 'serviceAreaSlugs.snapshot.json');
  writeFileSync(path, typeof payload === 'string' ? payload : JSON.stringify(payload));
  fixtures.push(dir);
  return path;
}

test('unions snapshot slugs with the static list, with no degradation warning', async () => {
  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages);

  assert.equal(dbAware, true, 'the committed snapshot must load in the normal path');
  assert.ok(slugs.has('minneapolis'), 'static slug retained');
  assert.ok(slugs.has('st-paul'), 'static slug retained');
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  for (const slug of snapshot.slugs) {
    assert.ok(slugs.has(slug), `snapshot slug "${slug}" is in the validated set`);
  }
  assert.ok(!slugs.has('totally-unknown-slug'), 'unknown slugs still fail');
  assert.deepEqual(warnings, [], 'no warning on the healthy, deterministic CI path');
});

test('a snapshot-only slug is checked against the existing [slug] route module', async () => {
  // Honest name: this asserts the two halves of the resolution contract the
  // link validator relies on — the [slug] route module exists, and the
  // DB-side slug is present in the validated slug set. It does not execute
  // the route's own getServiceAreaPage (that needs the Next runtime).
  const snapshotPath = fixtureSnapshot({
    generatedAt: new Date().toISOString(),
    slugs: ['db-only-area'],
  });

  const { slugs } = await getServiceAreaSlugs(staticPages, { snapshotPath });

  assert.ok(
    existsSync(new URL('../src/app/service-areas/[slug]/page.tsx', import.meta.url)),
    'route module must exist for the snapshot-only slug to resolve',
  );
  assert.ok(slugs.has('db-only-area'), 'snapshot-only slug is in the validated slug set');
  assert.ok(!slugs.has('totally-unknown-slug'), 'unknown slugs still fail');
  assert.deepEqual(warnings, []);
});

test('the committed snapshot is well-formed and documents its own regeneration', () => {
  const parsed = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));

  assert.ok(Array.isArray(parsed.slugs), 'snapshot carries a slugs array');
  assert.ok(parsed.slugs.length > 0, 'snapshot is not empty');
  assert.deepEqual(
    [...parsed.slugs].sort(),
    parsed.slugs,
    'snapshot slugs are sorted for stable diffs',
  );
  assert.deepEqual(
    [...new Set(parsed.slugs)],
    parsed.slugs,
    'snapshot slugs are deduplicated',
  );
  for (const slug of parsed.slugs) {
    assert.equal(typeof slug, 'string');
    assert.ok(slug.length > 0, 'no empty slugs');
  }
  const header = (parsed['// header'] ?? []).join('\n');
  assert.match(header, /sync:service-area-slugs/, 'snapshot documents how to regenerate it');
  assert.match(header, /WHEN TO REGENERATE/, 'snapshot documents when to regenerate it');
});

test('warns loud with a named warning when the snapshot is missing', async () => {
  const snapshotPath = join(tmpdir(), 'service-area-slugs-does-not-exist.json');

  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages, { snapshotPath });

  assert.equal(dbAware, false);
  assert.ok(slugs.has('minneapolis') && slugs.has('st-paul'), 'static list still validated');
  assert.equal(warnings.length, 1, 'exactly one loud degradation warning');
  const warning = warnings[0];
  assert.match(warning, /\[internal-links\] service-areas slug validation/);
  assert.match(warning, /DEGRADED/);
  assert.match(warning, /service_areas/);
  assert.match(warning, /sync:service-area-slugs/);
});

test('degrades to the static list with a warning when the snapshot is invalid', async () => {
  const snapshotPath = fixtureSnapshot('this is not JSON {{{');

  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages, { snapshotPath });

  assert.equal(dbAware, false);
  assert.ok(slugs.has('minneapolis') && slugs.has('st-paul'), 'static list still validated');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /\[internal-links\] service-areas slug validation/);
  assert.match(warnings[0], /DEGRADED/);
});
