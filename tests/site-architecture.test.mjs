import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('top-level routes use the three-market architecture in Next.js filesystem routing', () => {
  const appExists = existsSync(new URL('../src/App.tsx', import.meta.url));
  assert.ok(!appExists, 'src/App.tsx should be deleted to clean up Vite router remnants');

  for (const route of ['', 'residential', 'commercial', 'public-sector', 'projects', 'about', 'contact', 'service-area']) {
    const pagePath = route === '' ? 'src/app/page.tsx' : `src/app/${route}/page.tsx`;
    assert.ok(existsSync(new URL(`../${pagePath}`, import.meta.url)), `${pagePath} should exist`);
  }

  assert.ok(existsSync(new URL('../src/app/service-areas/[slug]/page.tsx', import.meta.url)));
  assert.ok(existsSync(new URL('../src/app/painting-services/[slug]/page.tsx', import.meta.url)));
});

test('primary navigation leads with residential, commercial, and public sector', () => {
  const header = read('src/components/ConversionHeader.tsx');

  const residential = header.indexOf('Residential');
  const commercial = header.indexOf('Commercial');
  const publicSector = header.indexOf('Public Sector');

  assert.ok(residential >= 0, 'Residential nav item is missing');
  assert.ok(commercial > residential, 'Commercial should follow Residential');
  assert.ok(publicSector > commercial, 'Public Sector should follow Commercial');
  assert.doesNotMatch(header, /Services/);
});

test('homepage states the approved positioning and avoids forbidden claims', () => {
  const home = read('src/app/HomeClient.tsx');

  assert.match(home, /A finish that lasts starts before the first coat\./i);
  assert.match(home, /Minnesota registration[\s\S]*IR816596/);
  assert.doesNotMatch(home, /Public-work ambition/i);
  assert.doesNotMatch(home, /Licensed|Bonded|MnDOT-approved|Government-certified|DBE certified|TGB certified|Trusted by government agencies|Awarded public contracts|Workers comp/i);
});

test('remediation guardrails cover secrets, headers, App Router SEO, and accessible interactions', () => {
  const viteConfigExists = existsSync(new URL('../vite.config.ts', import.meta.url));
  assert.ok(!viteConfigExists, 'vite.config.ts should be deleted to prevent client exposure of configs');

  const packageJson = read('package.json');
  assert.ok(!existsSync(new URL('../vercel.ts', import.meta.url)), 'legacy vercel.ts should remain deleted');
  assert.ok(existsSync(new URL('../vercel.json', import.meta.url)), 'vercel.json should exist');
  const vercelJson = read('vercel.json');
  const rootLayout = read('src/app/layout.tsx');
  const slider = read('src/components/BeforeAfterSlider.tsx');
  const leadForm = read('src/components/LeadForm.tsx');
  const serviceAreaMap = read('src/components/ServiceAreaMap.tsx');
  const leadsApi = read('src/lib/api/utils.ts');

  assert.doesNotMatch(packageJson, /@google\/genai/);
  assert.doesNotMatch(packageJson, /react-router-dom/);
  assert.match(leadsApi, /export function escapeHtml/);
  assert.match(leadsApi, /escapeHtml\(key\)/);
  assert.match(leadsApi, /escapeHtml\(value\)/);

  for (const key of [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
    'Content-Security-Policy',
  ]) {
    assert.match(vercelJson, new RegExp(escapeRegExp(key)), `${key} header is missing`);
  }
  assert.ok(!Object.hasOwn(JSON.parse(vercelJson), 'rewrites'));

  // Real App Router surface — not Vite prerender.mjs theater
  for (const route of ['residential', 'commercial', 'public-sector', 'projects', 'about', 'contact', 'capabilities', 'service-area']) {
    assert.ok(existsSync(new URL(`../src/app/${route}/page.tsx`, import.meta.url)), `src/app/${route}/page.tsx missing`);
  }
  assert.match(rootLayout, /application\/ld\+json/);
  assert.doesNotMatch(rootLayout, /ssr:\s*false/);
  assert.ok(!existsSync(new URL('../scripts/prerender.mjs', import.meta.url)));
  assert.ok(!existsSync(new URL('../src/components/Layout.tsx', import.meta.url)));

  assert.match(slider, /type="range"/);
  assert.match(slider, /aria-valuetext/);
  assert.match(slider, /onKeyDown/);
  assert.match(serviceAreaMap, /role="img"/);
  assert.match(serviceAreaMap, /aria-labelledby/);
  assert.match(serviceAreaMap, /useReducedMotion/);
  assert.doesNotMatch(serviceAreaMap, /iframe/);

  for (const label of ['Full name', 'Phone', 'Email', 'City', 'Market', 'Project type', 'Timeline', 'Budget range', 'Preferred contact method', 'Project details']) {
    assert.match(leadForm, new RegExp(`aria-label="${label}"`));
  }
});

test('local SEO and service landing pages are routable and listed in the sitemap', () => {
  const landingPages = read('src/data/landingPages.ts');
  const landingRoute = read('src/views/LandingPage.tsx');
  const sitemap = read('public/sitemap.xml');

  for (const slug of [
    'inver-grove-heights',
    'south-st-paul',
    'st-paul',
    'eagan',
    'woodbury',
    'minneapolis',
    'twin-cities',
    'interior-painting',
    'exterior-painting',
    'commercial-painting',
    'cabinet-painting',
    'drywall-repair',
    'deck-fence-staining',
    'parking-lot-striping',
    'pavement-marking',
  ]) {
    assert.match(landingPages, new RegExp(`slug: '${slug}'`));
    assert.match(sitemap, new RegExp(slug));
  }

  assert.match(landingRoute, /LeadForm/);
  assert.match(landingRoute, /landingPagePath/);

  // Assert that App Router dynamic page has generateMetadata for SEO headers
  const appSlugPage = read('src/app/service-areas/[slug]/page.tsx');
  assert.match(appSlugPage, /generateMetadata/);
});

test('M2 compliance and contractor registration statements are correctly set', () => {
  const layout = read('src/app/layout.tsx');
  const publicFooter = read('src/components/public/PublicFooter.tsx');
  const footerCta = read('src/components/ConversionFooterCta.tsx');
  const refer = read('src/views/Refer.tsx');
  const estimate = read('src/views/Estimate.tsx');
  const ogPreview = read('public/og-preview.svg');

  // 1. og-preview.svg
  assert.match(ogPreview, /REGISTERED • MN SPECIALTY • INSURED/);
  assert.match(ogPreview, /width="530"/);
  assert.match(ogPreview, /MN CONTRACTOR REG\./);

  // 2. Real root layout (App Router)
  assert.match(layout, /IR816596/);
  assert.match(publicFooter, /176\.041/);
  assert.match(publicFooter, /fully insured/i);

  // 3. ConversionFooterCta.tsx
  assert.match(footerCta, /IR816596/);

  // 4. Refer.tsx
  assert.match(refer, /registered Minnesota Specialty Contractor, Registration ID IR816596/);
  assert.match(refer, /Minnesota Statute 176\.041/);

  // 5. Estimate.tsx
  assert.match(estimate, /MN registration IR816596/);
});
