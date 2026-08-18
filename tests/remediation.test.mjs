import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Vite config is deleted and package.json does not expose Gemini sdk', () => {
  const viteConfigExists = existsSync(new URL('../vite.config.ts', import.meta.url));
  assert.ok(!viteConfigExists, 'vite.config.ts should be deleted to prevent client exposure of configs');

  const packageJson = read('package.json');
  assert.doesNotMatch(packageJson, /@google\/genai/);
});

test('lead email HTML escapes submitted keys and values', () => {
  const leadsApi = read('src/lib/api/utils.ts');

  assert.match(leadsApi, /export function escapeHtml/);
  assert.match(leadsApi, /replaceAll\('&', '&amp;'\)/);
  assert.match(leadsApi, /escapeHtml\(key\)/);
  assert.match(leadsApi, /escapeHtml\(value\)/);
});

test('Vercel config has security headers and no blanket SPA rewrite', () => {
  assert.ok(!existsSync(new URL('../vercel.ts', import.meta.url)), 'legacy vercel.ts should remain deleted');
  assert.ok(existsSync(new URL('../vercel.json', import.meta.url)), 'vercel.json should exist');

  const vercel = JSON.parse(read('vercel.json'));
  const headerKeys = new Set(
    vercel.headers.flatMap((rule) => rule.headers ?? []).map(({ key }) => key)
  );
  for (const key of [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ]) {
    assert.ok(headerKeys.has(key), `${key} header is missing`);
  }

  assert.ok(!Object.hasOwn(vercel, 'rewrites'));
  assert.ok(
    vercel.redirects.some(
      ({ source, destination }) => source === '/services' && destination === '/residential'
    )
  );
});

test('build pipeline prerenders public routes and static 404 metadata', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts.build, 'next build');

  const layout = read('src/app/layout.tsx');
  assert.match(layout, /JsonLd/);
  assert.match(read('src/components/JsonLd.tsx'), /application\/ld\+json/);
  assert.match(layout, /canonical/);

  // Assert that App Router directories exist for core pages
  for (const route of ['residential', 'commercial', 'public-sector', 'projects', 'about', 'contact', 'capabilities', 'service-area']) {
    const pagePath = `src/app/${route}/page.tsx`;
    assert.ok(existsSync(new URL(`../${pagePath}`, import.meta.url)), `${pagePath} should exist for the route ${route}`);
  }
});

test('before and after slider remains pointer-enabled and is keyboard accessible', () => {
  const slider = read('src/components/BeforeAfterSlider.tsx');

  assert.match(slider, /type="range"/);
  assert.match(slider, /aria-valuetext/);
  assert.match(slider, /onKeyDown/);
  assert.match(slider, /onMouseDown/);
  assert.match(slider, /onTouchStart/);
});

test('service area map is fast, routable, and accessible', () => {
  const appExists = existsSync(new URL('../src/App.tsx', import.meta.url));
  assert.ok(!appExists, 'src/App.tsx should be deleted to clean up Vite router remnants');

  const page = read('src/app/service-area/page.tsx');
  const header = read('src/components/ConversionHeader.tsx');
  const map = read('src/components/ServiceAreaMap.tsx');
  const sitemapGenerator = read('scripts/generate-sitemap.js');

  assert.match(page, /ServiceArea/);
  assert.match(header, /href: '\/service-area'/);
  assert.match(sitemapGenerator, /'\/service-area'/);
  assert.match(map, /role="img"/);
  assert.match(map, /aria-describedby/);
  assert.match(map, /View \$\{pin.name\} painting service area/);
  assert.doesNotMatch(map, /iframe/);
});

test('lead form controls have accessible names and normalized funnel events', () => {
  const leadForm = read('src/components/LeadForm.tsx');
  const leadsApi = read('src/app/api/leads/route.ts');
  const apiUtils = read('src/lib/api/utils.ts');

  for (const label of ['Full name', 'Phone', 'Email', 'City', 'Project address or cross streets', 'Market', 'Project type', 'Property type', 'Timeline', 'Budget range', 'Preferred contact method', 'Project photo link', 'Project details']) {
    assert.match(leadForm, new RegExp(`aria-label="${label}"`));
  }

  for (const eventName of ['lead_form_start', 'lead_form_submit_success', 'lead_form_submit_error', 'lead_mailto_fallback_opened']) {
    assert.match(leadForm, new RegExp(`'${eventName}'`));
  }

  assert.match(leadForm, /photosUrl/);
  assert.match(leadForm, /response\.status === 502/);
  assert.match(leadsApi, /LEAD_WEBHOOK_URL/);
  assert.match(leadsApi, /leadId/);
  assert.match(apiUtils, /new URL\(photosUrl\)/);
  assert.match(leadsApi, /fallback: 'email'/);
});

