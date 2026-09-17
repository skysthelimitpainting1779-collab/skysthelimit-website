import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { areaLandingPages, serviceLandingPages } from '../src/data/landingPages.ts';
import { getServiceAreaSlugs } from './helpers/service-area-slugs.mjs';

// Contract: every STATIC internal navigation link in the global header and
// footer must resolve to a known route. "Static" means a string literal in
// the component source: data-array entries, static href attributes, and
// static JSX-expression literals (href={'/x'}, href={`/x`} — a literal $
// in the path is fine; only ${...} interpolation is out of scope). Hrefs
// computed at runtime (interpolated template literals, values derived from
// request data) cannot be validated statically and are out of scope by
// design. Relative hrefs without a leading slash (and without a scheme)
// are collected so they fail loudly: global nav links must be
// root-relative, otherwise the browser resolves them against the current
// nested route and 404s.
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

// Template-literal hrefs need a second look: only ${...} is interpolation,
// so a literal $ in the path must not disqualify the match.
const templateLiteralPattern = /\bhref\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g;
const relativeTemplatePattern = /\bhref\s*=\s*\{\s*`((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^`]*)`\s*\}/g;
const interpolatedPatterns = new Set([templateLiteralPattern, relativeTemplatePattern]);

function collectStaticInternalLinks(source) {
  const links = new Set();
  const patterns = [
    /\bhref\s*=\s*["'](\/[^"']*)["']/g,
    /\bhref\s*=\s*\{\s*["'](\/[^"']*)["']\s*\}/g,
    templateLiteralPattern,
    /\bhref\s*:\s*["'](\/[^"']*)["']/g,
    /\[\s*["'](\/[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g,
    // Relative hrefs (no leading slash, no scheme, no anchor): the same
    // syntactic forms as above, collected so they are reported broken
    // instead of silently ignored.
    /\bhref\s*=\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']/g,
    /\bhref\s*=\s*\{\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']\s*\}/g,
    relativeTemplatePattern,
    /\bhref\s*:\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']/g,
    /\[\s*["']((?![a-zA-Z][a-zA-Z0-9+.-]*:)(?![#/])[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      // Interpolated template literals are not statically resolvable.
      if (interpolatedPatterns.has(pattern) && match[1].includes('${')) continue;
      links.add(match[1]);
    }
  }

  return [...links];
}

// Dynamic sections whose slugs are validated against landing-page data. The
// [slug] page module must exist, or the whole section counts as broken: data
// slugs alone must not keep the test green if the route module is removed,
// renamed, or moved.
// The service-areas route serves database-backed slugs first
// (getServiceAreaPage in the route module queries the service_areas table
// before falling back to the static list), so the slug set validated here is
// DB-aware on a best-effort basis: when Supabase credentials are absent, it
// degrades to the static list with a loud console warning (never silently).
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
    links: collectStaticInternalLinks(read(sourcePath)),
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
