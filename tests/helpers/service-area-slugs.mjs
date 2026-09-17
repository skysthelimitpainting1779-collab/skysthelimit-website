// Deterministic, DB-aware slug source for the service-areas link validation.
//
// src/app/service-areas/[slug]/page.tsx serves database-backed slugs FIRST
// (Supabase `service_areas` table) and only falls back to the static
// `areaLandingPages` list. Validating static header/footer links against the
// static list alone would falsely flag a link to a DB-created service area
// as broken.
//
// The DB side is represented by a CHECKED-IN SNAPSHOT
// (src/data/serviceAreaSlugs.snapshot.json), regenerated from the real
// `service_areas` table with `npm run sync:service-area-slugs` (see
// scripts/sync-service-area-slugs.mjs). Querying the live DB from the test
// suite is deliberately NOT done: .github/workflows/ci.yml supplies no
// Supabase credentials, so a live query would ALWAYS degrade in CI — the
// snapshot is the deterministic source of truth instead.
//
// getServiceAreaSlugs(staticPages, { snapshotPath }) returns
// { slugs: Set<string>, dbAware: boolean }: the union of the static slugs and
// the committed snapshot slugs. dbAware is true exactly when the snapshot
// loaded successfully. The loud console warning is reserved for the
// genuinely-unverifiable case — a missing or unreadable snapshot — where
// validation degrades to the static list only. A healthy snapshot in the
// normal CI path produces no warning at all.

import { existsSync, readFileSync } from 'node:fs';

const CHECK_NAME = '[internal-links] service-areas slug validation';
const DEFAULT_SNAPSHOT_PATH = new URL(
  '../../src/data/serviceAreaSlugs.snapshot.json',
  import.meta.url,
);

function warnDegraded(reason) {
  console.warn(
    `WARNING: ${CHECK_NAME} is DEGRADED (${reason}). ` +
      `Database-backed slugs from the service_areas table were NOT checked; ` +
      `only the static areaLandingPages slugs were validated. ` +
      `Restore the snapshot with: npm run sync:service-area-slugs.`,
  );
}

function loadSnapshotSlugs(snapshotPath) {
  const raw = readFileSync(snapshotPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('snapshot is not valid JSON');
  }
  if (!parsed || !Array.isArray(parsed.slugs)) {
    throw new Error('snapshot has no "slugs" array');
  }
  const slugs = parsed.slugs.filter(
    (slug) => typeof slug === 'string' && slug.length > 0,
  );
  if (slugs.length !== parsed.slugs.length) {
    throw new Error('snapshot contains non-string or empty slugs');
  }
  return new Set(slugs);
}

// Returns { slugs: Set<string>, dbAware: boolean }.
export async function getServiceAreaSlugs(
  staticPages,
  { snapshotPath = DEFAULT_SNAPSHOT_PATH } = {},
) {
  const slugs = new Set(staticPages.map((page) => page.slug));

  if (!existsSync(snapshotPath)) {
    warnDegraded(`snapshot not found at ${snapshotPath}`);
    return { slugs, dbAware: false };
  }

  try {
    for (const slug of loadSnapshotSlugs(snapshotPath)) {
      slugs.add(slug);
    }
    return { slugs, dbAware: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnDegraded(`snapshot unreadable: ${message}`);
    return { slugs, dbAware: false };
  }
}
