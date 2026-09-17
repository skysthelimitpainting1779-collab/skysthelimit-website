import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { areaLandingPages, serviceLandingPages } from '../src/data/landingPages.ts';
import { collectStaticInternalLinks } from './helpers/collect-links.mjs';
import { getServiceAreaSlugs } from './helpers/service-area-slugs.mjs';
import { stripComments } from './helpers/strip-comments.mjs';

// Contract: every STATIC internal navigation link in the global header and
// footer must resolve to a known route. "Static" means a string literal in
// the component source (see helpers/collect-links.mjs). Source is stripped
// of JS/TS comments before collection (helpers/strip-comments.mjs): an href
// inside a comment is not live navigation, so commenting out a link must not
// keep the test failing, and a commented valid link must not fake the
// non-empty guard below.
// Each navigation source must contribute at least one collectible link, so
// the test fails loudly if a source's links stop being statically visible
// instead of silently losing coverage.
// Route-group ((name)) and catch-all ([[...segments]]) targets are not
// resolved: no current header/footer link uses them, and the resolver covers
// the conventions the site's navigation actually uses (literal segments
// plus the two data-driven dynamic sections above).
const navigationSources = [
  'src/components/ConversionHeader.tsx',
  'src/components/public/PublicFooter.tsx',
];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// Dynamic sections whose slugs are validated against landing-page data. The
// [slug] page module must exist, or the whole section counts as broken: data
// slugs alone must not keep the test green if the route module is removed,
// renamed, or moved.
// The service-areas route serves database-backed slugs first
// (getServiceAreaPage in the route module queries the service_areas table
// before falling back to the static list), so the slug set validated here is
// the deterministic union of the static areaLandingPages slugs and the
// checked-in DB snapshot (src/data/serviceAreaSlugs.snapshot.json,
// regenerated with `npm run sync:service-area-slugs`). No live DB query
// happens: CI supplies no Supabase credentials, so a live query would always
// degrade there. The loud degradation warning fires only when the snapshot
// itself is missing or unreadable.
const { slugs: serviceAreaSlugs } = await getServiceAreaSlugs(areaLandingPages);

const dynamicSections = {
  'painting-services': {
    module: 'src/app/painting-services/[slug]/page.tsx',
    slugs: serviceLandingPages,
  },
  'service-areas': {
    module: 'src/app/service-areas/[slug]/page.tsx',
    slugs: [...serviceAreaSlugs].map((slug) => ({ slug })),
  },
};

function resolvesToKnownRoute(target) {
  // Only root-relative targets are valid nav links: protocol-relative
  // (//host) targets are external URLs, and relative hrefs (no leading
  // slash) resolve against the current nested route and 404.
  if (!target.startsWith('/') || target.startsWith('//')) return false;

  const pathname = target.split(/[?#]/, 1)[0];
  const segments = pathname.split('/').filter(Boolean);
  const staticPage = segments.length === 0
    ? 'src/app/page.tsx'
    : `src/app/${segments.join('/')}/page.tsx`;

  if (existsSync(new URL(`../${staticPage}`, import.meta.url))) return true;

  if (segments.length !== 2) return false;
  const [route, slug] = segments;
  const section = dynamicSections[route];
  if (!section) return false;

  return (
    existsSync(new URL(`../${section.module}`, import.meta.url)) &&
    section.slugs.some((page) => page.slug === slug)
  );
}

test('static links in the global header and footer resolve to known routes', () => {
  const linksBySource = navigationSources.map((sourcePath) => ({
    sourcePath,
    links: collectStaticInternalLinks(stripComments(read(sourcePath))),
  }));

  for (const { sourcePath, links } of linksBySource) {
    assert.ok(
      links.length > 0,
      `${sourcePath} contributed no collectible static internal links — coverage dropped silently`,
    );
  }

  const brokenLinks = linksBySource.flatMap(({ sourcePath, links }) =>
    links
      .filter((target) => !resolvesToKnownRoute(target))
      .map((target) => ({ sourcePath, target })),
  );
  assert.deepEqual(
    brokenLinks,
    [],
    `static internal navigation targets must resolve:\n${brokenLinks
      .map(({ sourcePath, target }) => `- ${target} (${sourcePath})`)
      .join('\n')}`,
  );
});
