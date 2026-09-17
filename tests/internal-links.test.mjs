import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { areaLandingPages, serviceLandingPages } from '../src/data/landingPages.ts';

// Contract: every STATIC internal navigation link in the global header and
// footer must resolve to a known route. "Static" means a string literal in
// the component source: data-array entries, static href attributes, and
// static JSX-expression literals (href={'/x'}, href={`/x`}). Hrefs computed
// at runtime (interpolated template literals, values derived from request
// data) cannot be validated statically and are out of scope by design.
// Each navigation source must contribute at least one collectible link, so
// the test fails loudly if a source's links stop being statically visible
// instead of silently losing coverage.
const navigationSources = [
  'src/components/ConversionHeader.tsx',
  'src/components/public/PublicFooter.tsx',
];

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function collectStaticInternalLinks(source) {
  const links = new Set();
  const patterns = [
    /\bhref\s*=\s*["'](\/[^"']*)["']/g,
    /\bhref\s*=\s*\{\s*["'](\/[^"']*)["']\s*\}/g,
    /\bhref\s*=\s*\{\s*`(\/[^`$]*)`\s*\}/g,
    /\bhref\s*:\s*["'](\/[^"']*)["']/g,
    /\[\s*["'](\/[^"']*)["']\s*,\s*["'][^"']+["']\s*\]/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) links.add(match[1]);
  }

  return [...links];
}

function resolvesToKnownRoute(target) {
  const pathname = target.split(/[?#]/, 1)[0];
  const segments = pathname.split('/').filter(Boolean);
  const staticPage = segments.length === 0
    ? 'src/app/page.tsx'
    : `src/app/${segments.join('/')}/page.tsx`;

  if (existsSync(new URL(`../${staticPage}`, import.meta.url))) return true;

  if (segments.length !== 2) return false;
  const [route, slug] = segments;

  if (route === 'painting-services') {
    return serviceLandingPages.some((page) => page.slug === slug);
  }
  if (route === 'service-areas') {
    return areaLandingPages.some((page) => page.slug === slug);
  }

  return false;
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
