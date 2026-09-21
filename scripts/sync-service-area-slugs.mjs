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
// error, query error, malformed payload, or any row with a missing/empty/
// non-string slug). A partial snapshot is never written. A legitimately EMPTY
// table writes an empty snapshot (with a loud warning) so the file represents
// the table instead of preserving a stale one: the internal-link test trusts
// this file.
import { renameSync, writeFileSync } from 'node:fs';
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

// PostgREST silently truncates unpaged selects at 1,000 rows: page through
// the table in slug order so a large table never produces a truncated
// snapshot that looks complete.
const PAGE_SIZE = 1000;

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
  rows = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('service_areas')
      .select('slug')
      .order('slug', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!Array.isArray(data)) {
      fail('service_areas query returned a non-array payload.');
    }
    rows.push(...data);
    if (data.length < PAGE_SIZE) break; // last page (also covers the empty table)
    offset += PAGE_SIZE;
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(`service_areas query failed: ${message}`);
}

// Every row must carry a usable slug: one malformed row alongside valid rows
// must fail the run, never silently produce a partial snapshot.
rows.forEach((row, index) => {
  if (typeof row?.slug !== 'string' || row.slug.length === 0) {
    fail(
      `service_areas row at index ${index} has a missing, empty, or non-string slug; ` +
        'refusing to write a partial snapshot.',
    );
  }
});

const slugs = [...new Set(rows.map((row) => row.slug))];
slugs.sort();

if (slugs.length === 0) {
  console.warn(
    'sync:service-area-slugs WARNING: the service_areas table is EMPTY — ' +
      'writing an empty snapshot. Links to DB-backed service areas will fail validation.',
  );
}

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

// Atomic write: an interrupted sync or a full disk must never leave an
// empty or partial snapshot behind for the validator to trust. The complete
// file is written to a temp path first and renamed over the snapshot only
// after the write succeeds (rename is atomic on POSIX within one directory).
const tmpPath = `${SNAPSHOT_PATH}.tmp-${process.pid}`;
writeFileSync(tmpPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
renameSync(tmpPath, SNAPSHOT_PATH);
console.log(
  `sync:service-area-slugs OK: wrote ${slugs.length} slug(s) to src/data/serviceAreaSlugs.snapshot.json`,
);