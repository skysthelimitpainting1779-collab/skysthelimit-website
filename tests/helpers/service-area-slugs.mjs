// Best-effort, DB-aware slug source for the service-areas link validation.
//
// src/app/service-areas/[slug]/page.tsx serves database-backed slugs FIRST
// (Supabase `service_areas` table) and only falls back to the static
// `areaLandingPages` list. Validating static header/footer links against the
// static list alone would falsely flag a link to a DB-created service area
// as broken.
//
// getServiceAreaSlugs(staticPages, { createClient }) unions the DB slugs with
// the static ones when NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are present. When the credentials are missing
// (local runs without creds) or the query fails, it degrades to the static
// list AND prints a loud console warning naming the degraded check: degraded
// validation must never be silent.
//
// The Supabase client factory is dependency-injected so unit tests can supply
// a mock client instead of hitting the real network; it defaults to the real
// `createClient` from @supabase/supabase-js.

const CHECK_NAME = '[internal-links] service-areas slug validation';
const ENV_URL = 'NEXT_PUBLIC_SUPABASE_URL';
const ENV_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

function warnDegraded(reason) {
  console.warn(
    `WARNING: ${CHECK_NAME} is DEGRADED (${reason}). ` +
      `Database-backed slugs from the service_areas table were NOT checked; ` +
      `only the static areaLandingPages slugs were validated. ` +
      `Set ${ENV_URL} and ${ENV_KEY} to restore full coverage.`,
  );
}

// Returns { slugs: Set<string>, dbAware: boolean }.
export async function getServiceAreaSlugs(staticPages, { createClient } = {}) {
  const slugs = new Set(staticPages.map((page) => page.slug));

  const url = process.env[ENV_URL];
  const key = process.env[ENV_KEY];
  if (!url || !key) {
    warnDegraded(`${ENV_URL} / ${ENV_KEY} not set`);
    return { slugs, dbAware: false };
  }

  try {
    const factory = createClient ?? (await import('@supabase/supabase-js')).createClient;
    const supabase = factory(url, key);
    const { data, error } = await supabase.from('service_areas').select('slug');
    if (error) throw error;
    for (const row of data ?? []) {
      if (row && typeof row.slug === 'string' && row.slug.length > 0) {
        slugs.add(row.slug);
      }
    }
    return { slugs, dbAware: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnDegraded(`service_areas query failed: ${message}`);
    return { slugs, dbAware: false };
  }
}
