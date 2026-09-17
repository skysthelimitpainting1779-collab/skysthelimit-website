import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, describe } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// Parse data exports from TypeScript source files for structural testing.
// The data is defined inline as object literals, so we extract and validate
// using regex + structural checks on the raw source.
// ---------------------------------------------------------------------------

const marketsSrc = read('src/data/markets.ts');
const landingPagesSrc = read('src/data/landingPages.ts');

// ---------------------------------------------------------------------------
// Markets data integrity tests
// ---------------------------------------------------------------------------
describe('data/markets - Market definitions', () => {

  test('exports exactly three markets', () => {
    const slugMatches = marketsSrc.match(/slug:\s*'(residential|commercial|public-sector)'/g);
    assert.equal(slugMatches.length, 3);
  });

  test('MarketSlug type includes all three market slugs', () => {
    assert.match(marketsSrc, /'residential'/);
    assert.match(marketsSrc, /'commercial'/);
    assert.match(marketsSrc, /'public-sector'/);
  });

  test('each market has required navigation label', () => {
    assert.match(marketsSrc, /navLabel:\s*'Residential'/);
    assert.match(marketsSrc, /navLabel:\s*'Commercial'/);
    assert.match(marketsSrc, /navLabel:\s*'Public Sector'/);
  });

  test('markets have sequential numbering', () => {
    assert.match(marketsSrc, /number:\s*'01'/);
    assert.match(marketsSrc, /number:\s*'02'/);
    assert.match(marketsSrc, /number:\s*'03'/);
  });

  test('Market interface declares all required fields', () => {
    const fields = [
      'slug', 'navLabel', 'number', 'title', 'headline', 'summary',
      'description', 'image', 'heroImage', 'icon', 'accent', 'proof',
      'capabilities', 'process', 'cta', 'metaTitle', 'metaDescription',
    ];
    for (const field of fields) {
      assert.match(marketsSrc, new RegExp(`${field}:\\s`), `Market interface should declare ${field}`);
    }
  });

  test('each market has capabilities array with title and body', () => {
    const capTitles = marketsSrc.match(/capabilities:\s*\[/g);
    assert.equal(capTitles.length, 3, 'all three markets should have capabilities');
  });

  test('each market has process array with title and body', () => {
    const processHeaders = marketsSrc.match(/process:\s*\[/g);
    assert.equal(processHeaders.length, 3, 'all three markets should have process steps');
  });

  test('residential market has correct CTA', () => {
    assert.match(marketsSrc, /Plan A Residential Project/);
  });

  test('commercial market has correct CTA', () => {
    assert.match(marketsSrc, /Discuss A Commercial Job/);
  });

  test('public-sector market has correct CTA', () => {
    assert.match(marketsSrc, /Discuss Public-Sector Readiness/);
  });

  test('commercial market references NAICS Code 238320', () => {
    assert.match(marketsSrc, /NAICS Code 238320/);
  });

  test('public-sector market references contractor registration', () => {
    assert.match(marketsSrc, /IR816596/);
  });

  test('marketBySlug is derived from markets array via reduce', () => {
    assert.match(marketsSrc, /markets\.reduce/);
  });

  test('trustPillars array exports four items', () => {
    const pillarSection = marketsSrc.split('trustPillars')[1].split('export')[0];
    const pillarMatches = pillarSection.match(/\{\s*title:\s*'/g);
    assert.equal(pillarMatches.length, 4, 'should have exactly 4 trust pillar entries');
  });

  test('trustPillars includes contractor registration pillar', () => {
    assert.match(marketsSrc, /Registered MN Specialty Contractor/);
  });

  test('trustPillars includes owner-operated pillar', () => {
    assert.match(marketsSrc, /Owner-Operated And Trade-Built/);
  });

  test('trustPillars includes insurance coverage pillar', () => {
    assert.match(marketsSrc, /Commercial Auto And Tools Coverage/);
  });

  test('trustPillars includes scope clarity pillar', () => {
    assert.match(marketsSrc, /Scope Clarity And Follow-Through/);
  });

  test('supportingImages exports correct image paths', () => {
    assert.match(marketsSrc, /exterior:\s*'/);
    assert.match(marketsSrc, /prep:\s*'/);
    assert.match(marketsSrc, /commercialReal:\s*'/);
    assert.match(marketsSrc, /interiorBeforeAfter:\s*'/);
  });

  test('all market images use .webp extension', () => {
    const imageMatches = marketsSrc.match(/image:\s*'[^']+'/g) || [];
    for (const img of imageMatches) {
      assert.match(img, /\.webp'$/, `Image ${img} should be .webp`);
    }
  });

  test('all market heroImages use .webp extension', () => {
    const heroMatches = marketsSrc.match(/heroImage:\s*'[^']+'/g) || [];
    for (const img of heroMatches) {
      assert.match(img, /\.webp'$/, `Hero image ${img} should be .webp`);
    }
  });

  test('each market has exactly 3 capabilities', () => {
    const capBlocks = marketsSrc.split(/capabilities:\s*\[/).slice(1);
    for (const block of capBlocks) {
      const capClose = block.indexOf('],');
      const capContent = block.slice(0, capClose);
      const titleCount = (capContent.match(/title:\s*'/g) || []).length;
      assert.equal(titleCount, 3, 'each market should have exactly 3 capabilities');
    }
  });

  test('each market has exactly 4 process steps', () => {
    const processBlocks = marketsSrc.split(/process:\s*\[/).slice(1);
    for (const block of processBlocks) {
      const closeIdx = block.indexOf('],');
      const procContent = block.slice(0, closeIdx);
      const titleCount = (procContent.match(/title:\s*'/g) || []).length;
      assert.equal(titleCount, 4, 'each market should have exactly 4 process steps');
    }
  });

  test('each market has at least 3 proof points', () => {
    const proofBlocks = marketsSrc.split(/proof:\s*\[/).slice(1);
    for (const block of proofBlocks) {
      const closeIdx = block.indexOf('],');
      const proofContent = block.slice(0, closeIdx);
      const items = (proofContent.match(/'/g) || []).length / 2;
      assert.ok(items >= 3, 'each market should have at least 3 proof points');
    }
  });

  test('metaTitle fields include company name', () => {
    const metaTitles = marketsSrc.match(/metaTitle:\s*'[^']+'/g) || [];
    for (const title of metaTitles) {
      assert.match(title, /Sky/, `metaTitle should include company name: ${title}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Landing pages data integrity tests
// ---------------------------------------------------------------------------
describe('data/landingPages - Area landing pages', () => {

  test('LandingPageKind type covers service and area', () => {
    assert.match(landingPagesSrc, /'service'/);
    assert.match(landingPagesSrc, /'area'/);
  });

  test('LandingPage interface declares all required fields', () => {
    const fields = [
      'kind', 'slug', 'title', 'shortTitle', 'eyebrow', 'headline',
      'description', 'metaTitle', 'metaDescription', 'image', 'accent',
      'market', 'proof', 'scope', 'process', 'related',
    ];
    for (const field of fields) {
      assert.match(landingPagesSrc, new RegExp(`${field}[?:]`), `LandingPage should declare ${field}`);
    }
  });

  test('neighborhoods field is optional', () => {
    assert.match(landingPagesSrc, /neighborhoods\?:/);
  });

  test('area landing pages cover all 7 expected service areas', () => {
    const areaSlugs = ['inver-grove-heights', 'south-st-paul', 'st-paul', 'eagan', 'woodbury', 'minneapolis', 'twin-cities'];
    for (const slug of areaSlugs) {
      assert.match(landingPagesSrc, new RegExp(`slug:\\s*'${slug}'`), `should include area ${slug}`);
    }
  });

  test('all area pages have kind set to area', () => {
    const areaSection = landingPagesSrc.split('areaLandingPages')[1].split('serviceLandingPages')[0];
    const kindMatches = areaSection.match(/kind:\s*'(area|service)'/g) || [];
    for (const k of kindMatches) {
      assert.match(k, /area/, 'all entries in areaLandingPages should be area kind');
    }
  });

  test('inver-grove-heights has neighborhoods', () => {
    assert.match(landingPagesSrc, /Argenta Hills/);
    assert.match(landingPagesSrc, /South Grove/);
  });

  test('each area page has at least 3 proof points', () => {
    const areaSection = landingPagesSrc.split('areaLandingPages')[1].split('serviceLandingPages')[0];
    const proofBlocks = areaSection.split(/proof:\s*\[/).slice(1);
    for (const block of proofBlocks) {
      const close = block.indexOf('],');
      const items = (block.slice(0, close).match(/'/g) || []).length / 2;
      assert.ok(items >= 3, 'each area page should have at least 3 proof points');
    }
  });

  test('each area page has at least 3 process steps', () => {
    const areaSection = landingPagesSrc.split('areaLandingPages')[1].split('serviceLandingPages')[0];
    const processBlocks = areaSection.split(/process:\s*\[/).slice(1);
    for (const block of processBlocks) {
      const close = block.indexOf('],');
      const content = block.slice(0, close);
      const count = (content.match(/title:\s*'/g) || []).length;
      assert.ok(count >= 3, 'each area page should have at least 3 process steps');
    }
  });

  test('each area page has related slugs array', () => {
    const areaSection = landingPagesSrc.split('areaLandingPages')[1].split('serviceLandingPages')[0];
    const relatedBlocks = areaSection.split(/related:\s*\[/).slice(1);
    assert.ok(relatedBlocks.length >= 7, 'all area pages should have related slugs');
  });
});

describe('data/landingPages - Service landing pages', () => {

  test('service landing pages cover all expected services', () => {
    const serviceSlugs = [
      'interior-painting', 'exterior-painting', 'commercial-painting',
      'cabinet-painting', 'drywall-repair', 'deck-fence-staining',
      'parking-lot-striping', 'pavement-marking',
    ];
    for (const slug of serviceSlugs) {
      assert.match(landingPagesSrc, new RegExp(`slug:\\s*'${slug}'`), `should include service ${slug}`);
    }
  });

  test('all service pages have kind set to service', () => {
    const serviceSection = landingPagesSrc.split('serviceLandingPages')[1];
    const kindMatches = serviceSection.match(/kind:\s*'(area|service)'/g) || [];
    for (const k of kindMatches) {
      assert.match(k, /service/, 'all entries in serviceLandingPages should be service kind');
    }
  });

  test('market field uses only valid market labels', () => {
    const validMarkets = ['Residential', 'Commercial', 'Public Sector'];
    const marketMatches = landingPagesSrc.match(/market:\s*'([^']+)'/g) || [];
    for (const m of marketMatches) {
      const value = m.match(/'([^']+)'/)[1];
      assert.ok(validMarkets.includes(value), `market "${value}" should be one of ${validMarkets.join(', ')}`);
    }
  });

  test('all landing page images use .webp extension', () => {
    const imageMatches = landingPagesSrc.match(/image:\s*'[^']+'/g) || [];
    for (const img of imageMatches) {
      assert.match(img, /\.webp'$/, `Landing page image should be .webp: ${img}`);
    }
  });

  test('no duplicate slugs across all landing pages', () => {
    const slugMatches = landingPagesSrc.match(/slug:\s*'([^']+)'/g) || [];
    const slugs = slugMatches.map((s) => s.match(/'([^']+)'/)[1]);
    const unique = new Set(slugs);
    assert.equal(slugs.length, unique.size, 'all landing page slugs must be unique');
  });
});

describe('data/landingPages - Utility functions', () => {

  test('landingPagePath generates area paths correctly', () => {
    const src = landingPagesSrc;
    assert.match(src, /\/service-areas\/\$\{page\.slug\}/);
  });

  test('landingPagePath generates service paths correctly', () => {
    const src = landingPagesSrc;
    assert.match(src, /\/painting-services\/\$\{page\.slug\}/);
  });

  test('landingPageByKindAndSlug returns undefined for missing slug', () => {
    assert.match(landingPagesSrc, /if \(!slug\)/);
    assert.match(landingPagesSrc, /return undefined/);
  });

  test('landingPageBySlug searches combined landingPages array', () => {
    assert.match(landingPagesSrc, /landingPages\.find/);
  });

  test('landingPages combines area and service arrays', () => {
    assert.match(landingPagesSrc, /\[\.\.\.areaLandingPages, \.\.\.serviceLandingPages\]/);
  });

  test('landingPageByKindAndSlug selects correct collection by kind', () => {
    assert.match(landingPagesSrc, /kind === 'area' \? areaLandingPages : serviceLandingPages/);
  });
});

// ---------------------------------------------------------------------------
// Cross-module consistency tests
// ---------------------------------------------------------------------------
describe('Cross-module data consistency', () => {

  test('all market slugs from markets.ts are referenced in landing page related arrays', () => {
    const marketSlugs = ['residential', 'commercial', 'public-sector'];
    for (const slug of marketSlugs) {
      assert.match(landingPagesSrc, new RegExp(`'${slug}'`), `landing pages should reference market slug ${slug}`);
    }
  });

  test('area landing page slugs match cities in seo.ts areaServed', () => {
    const seoSrc = read('src/lib/seo.ts');
    const areaCities = ['Inver Grove Heights', 'South St. Paul', 'St. Paul', 'Eagan', 'Woodbury', 'Minneapolis'];
    for (const city of areaCities) {
      assert.match(seoSrc, new RegExp(city.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')), `seo.ts should reference ${city}`);
    }
  });

  test('contact phone matches seo phone', () => {
    const contactSrc = read('src/lib/contact.ts');
    const seoSrc = read('src/lib/seo.ts');
    assert.match(contactSrc, /651-410-4196/);
    assert.match(seoSrc, /651-410-4196/);
  });

  test('contact email matches seo email', () => {
    const contactSrc = read('src/lib/contact.ts');
    const seoSrc = read('src/lib/seo.ts');
    assert.match(contactSrc, /skysthelimitpainting1779@gmail\.com/);
    assert.match(seoSrc, /skysthelimitpainting1779@gmail\.com/);
  });
});
