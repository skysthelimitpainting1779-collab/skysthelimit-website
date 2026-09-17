#!/usr/bin/env node
// Regenerates src/data/serviceAreaSlugs.snapshot.json from the live Supabase
// `service_areas` table (slug column, sorted, deduplicated).
//
// Usage: npm run sync:service-area-slugs
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the
// environment (the anon key is enough: the table has a public SELECT policy).
//
// Run this after ANY insert/update/delete on public.service_areas — the
// internal-link test validates /service-areas/<slug> against the union of
// the static areaLandingPages slugs and this committed snapshot, so a stale
// snapshot means stale validation.
//
// The script exits non-zero on ANY failure (missing credentials, network
// error, query error, empty/malformed payload). A partial or empty snapshot
// must never be written silently: the internal-link test trusts this file.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const SNAPSHOT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'serviceAreaSlugs.snapshot.json',
);

function fail(message) {
  console.error(`sync:service-area-slugs FAILED: ${message}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  fail(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set. ' +
      'Refusing to write a snapshot without a live DB query.',
  );
}

let rows;
try {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('service_areas').select('slug');
  if (error) throw error;
  rows = data;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(`service_areas query failed: ${message}`);
}

if (!Array.isArray(rows)) {
  fail('service_areas query returned a non-array payload.');
}

const slugs = [...new Set(rows.map((row) => row?.slug))].filter(
  (slug) => typeof slug === 'string' && slug.length > 0,
);
if (slugs.length === 0) {
  fail('service_areas returned zero usable slugs; refusing to write an empty snapshot.');
}
slugs.sort();

const snapshot = {
  '// header': [
    'CHECKED-IN SNAPSHOT of the Supabase `service_areas` table (slug column).',
    'The /service-areas/[slug] route serves database-backed slugs FIRST and falls back to the',
    'static areaLandingPages list, so the internal-link test validates header/footer links',
    'against the UNION of the static slugs and this snapshot (see tests/helpers/service-area-slugs.mjs).',
    '',
    'HOW TO REGENERATE: npm run sync:service-area-slugs',
    '(queries the live service_areas table; requires NEXT_PUBLIC_SUPABASE_URL and',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment; exits non-zero on any failure).',
    '',
    'WHEN TO REGENERATE: after ANY insert/update/delete on public.service_areas, and before',
    'releasing a PR that adds a DB-backed service area. A stale snapshot means stale validation:',
    'a link to a newly added DB area would be falsely flagged as broken (or a removed area',
    'would keep passing).',
  ],
  generatedAt: new Date().toISOString(),
  regenerate: 'npm run sync:service-area-slugs',
  source: 'supabase.public.service_areas',
  slugs,
};

writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
console.log(
  `sync:service-area-slugs OK: wrote ${slugs.length} slug(s) to src/data/serviceAreaSlugs.snapshot.json`,
);
