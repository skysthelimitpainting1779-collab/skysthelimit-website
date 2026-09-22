// Parity guard: scripts/generate-sitemap.js duplicates the landing-page slug
// lists from src/data/landingPages.ts (the source of truth that also feeds
// src/app/sitemap.ts). If a page is added to landingPages.ts without syncing
// the generator's static defaults, it silently drops out of the committed
// public/sitemap.xml artifact. This test fails on any drift.
//
// Runs under `npm test` (tsx --test); no network access.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { areaLandingPages, serviceLandingPages } from '../src/data/landingPages.ts';

function extractDefaultSlugs(script, varName) {
  const match = script.match(new RegExp(`const ${varName} = \\[([\\s\\S]*?)\\];`));
  assert.ok(match, `expected declaration of ${varName} in generate-sitemap.js`);
  const slugs = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(slugs.length > 0, `${varName} must not be empty`);
  assert.equal(new Set(slugs).size, slugs.length, `${varName} must not contain duplicates`);
  return slugs;
}

function assertSameSet(scriptSlugs, dataSlugs, label) {
  const scriptSet = new Set(scriptSlugs);
  const dataSet = new Set(dataSlugs);
  const missing = [...dataSet].filter((s) => !scriptSet.has(s));
  const extra = [...scriptSet].filter((s) => !dataSet.has(s));
  assert.deepEqual(missing, [], `${label}: slugs in landingPages.ts missing from generate-sitemap.js: ${missing.join(', ')}`);
  assert.deepEqual(extra, [], `${label}: slugs in generate-sitemap.js not present in landingPages.ts: ${extra.join(', ')}`);
}

test('sitemap generator area defaults match landing-page data slugs', () => {
  const script = readFileSync(new URL('../scripts/generate-sitemap.js', import.meta.url), 'utf8');
  const defaults = extractDefaultSlugs(script, 'defaultServiceAreasSlugs');
  const dataSlugs = areaLandingPages.map((page) => page.slug);
  assertSameSet(defaults, dataSlugs, 'service-area slugs');
});

test('sitemap generator service defaults match landing-page data slugs', () => {
  const script = readFileSync(new URL('../scripts/generate-sitemap.js', import.meta.url), 'utf8');
  const defaults = extractDefaultSlugs(script, 'defaultPaintingServicesSlugs');
  const dataSlugs = serviceLandingPages.map((page) => page.slug);
  assertSameSet(defaults, dataSlugs, 'painting-service slugs');
});
