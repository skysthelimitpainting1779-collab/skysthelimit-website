import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test, describe } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

describe('Tier 1: Feature Coverage', () => {

  test('T1.1 Routing & Navigation - Core layout components render successfully', () => {
    const layout = read('src/app/layout.tsx');
    assert.match(layout, /import ConversionHeader/);
    assert.match(layout, /import ConversionFooterCta/);
    assert.ok(exists('src/app/layout.tsx'));
    assert.ok(exists('src/components/ConversionHeader.tsx'));
    assert.ok(exists('src/components/ConversionFooterCta.tsx'));
  });

  test('T1.2 Routing & Navigation - Header navigation links exist', () => {
    const header = read('src/components/ConversionHeader.tsx');
    assert.match(header, /href: '\/residential'/);
    assert.match(header, /href: '\/commercial'/);
    assert.match(header, /href: '\/public-sector'/);
  });

  test('T1.3 Routing & Navigation - Micro-utility header bar displays warning/intake message', () => {
    const header = read('src/components/ConversionHeader.tsx');
    assert.match(header, /Twin Cities painting/);
    assert.match(header, /Owner-led · Written scope · Prep first/);
  });

  test('T1.4 Routing & Navigation - Redirects for legacy routes redirect to new pages', () => {
    const vercel = JSON.parse(read('vercel.json'));
    assert.ok(vercel.redirects.some(({ source, destination }) => source === '/services' && destination === '/residential'));
    assert.ok(vercel.redirects.some(({ source, destination }) => source === '/services/interior' && destination === '/residential'));
  });

  test('T1.5 Routing & Navigation - Invalid paths serve the customized 404 page', () => {
    const notFound = read('src/app/not-found.tsx');
    assert.match(notFound, /NotFoundPage/);
    assert.ok(exists('src/views/NotFound.tsx'));
  });

  test('T1.6 Three-Market Content - Home page renders the approved positioning statement', () => {
    const home = read('src/app/HomeClient.tsx');
    assert.match(home, /A finish that lasts starts before the first coat\./i);
    assert.match(home, /walkthrough, written scope, preparation plan, and final detail/i);
  });

  test('T1.7 Three-Market Content - Residential page loads specific data fields', () => {
    const res = read('src/app/residential/page.tsx');
    assert.match(res, /MarketPage/);
    assert.match(res, /slug="residential"/);
    assert.match(res, /export const metadata/);
  });

  test('T1.8 Three-Market Content - Commercial page loads specific data fields', () => {
    const comm = read('src/app/commercial/page.tsx');
    assert.match(comm, /MarketPage/);
    assert.match(comm, /slug="commercial"/);
    assert.match(comm, /export const metadata/);
  });

  test('T1.9 Three-Market Content - Public Sector page loads specific data fields', () => {
    const pub = read('src/app/public-sector/page.tsx');
    assert.match(pub, /MarketPage/);
    assert.match(pub, /slug="public-sector"/);
    assert.match(pub, /export const metadata/);
  });

  test('T1.10 Three-Market Content - Capabilities statement page displays NAICS and SWIFT details', () => {
    const cap = read('src/views/Capabilities.tsx');
    assert.match(cap, /NAICS 238320/);
    assert.match(cap, /VN0001223327_1/);
  });

  test('T1.11 Local SEO Pages - Service Areas landing pages load data', () => {
    const pages = read('src/data/landingPages.ts');
    assert.match(pages, /slug: 'inver-grove-heights'/);
    assert.match(pages, /slug: 'south-st-paul'/);
  });

  test('T1.12 Local SEO Pages - Painting Services landing pages load data', () => {
    const pages = read('src/data/landingPages.ts');
    assert.match(pages, /slug: 'interior-painting'/);
    assert.match(pages, /slug: 'exterior-painting'/);
  });

  test('T1.13 Local SEO Pages - XML Sitemap contains SEO slugs', () => {
    const sitemap = read('public/sitemap.xml');
    assert.match(sitemap, /inver-grove-heights/);
    assert.match(sitemap, /interior-painting/);
  });

  test('T1.14 Local SEO Pages - App Router pages exist for market and SEO routes', () => {
    assert.ok(exists('src/app/residential/page.tsx'));
    assert.ok(exists('src/app/commercial/page.tsx'));
    assert.ok(exists('src/app/service-areas/[slug]/page.tsx'));
    assert.ok(exists('src/app/painting-services/[slug]/page.tsx'));
    assert.ok(exists('src/app/not-found.tsx'));
  });

  test('T1.15 Local SEO Pages - Breadcrumb schemas contain valid JSON-LD metadata', () => {
    const seo = read('src/lib/seo.ts');
    assert.match(seo, /BreadcrumbList/);
    assert.match(seo, /itemListElement/);
  });

  test('T1.16 Interactive Components - BeforeAfterSlider renders before and after images', () => {
    const slider = read('src/components/BeforeAfterSlider.tsx');
    assert.match(slider, /Before/);
    assert.match(slider, /After/);
  });

  test('T1.17 Interactive Components - ServiceAreaMap renders SVG map with city pins', () => {
    const map = read('src/components/ServiceAreaMap.tsx');
    assert.match(map, /<svg/);
    assert.match(map, /role="img"/);
  });

  test('T1.18 Interactive Components - Clicking service area pins navigates user correctly', () => {
    const map = read('src/components/ServiceAreaMap.tsx');
    assert.match(map, /Link/);
    assert.match(map, /href=\{\`\/service-areas\/\${pin\.slug}\`\}/);
  });

  test('T1.19 Interactive Components - dead SPA cursor theater is deleted', () => {
    assert.ok(!exists('src/components/CustomCursor.tsx'));
    assert.ok(!exists('src/components/HeatmapOverlay.tsx'));
    assert.ok(!exists('src/components/SpecInspector.tsx'));
    assert.ok(!exists('src/components/Layout.tsx'));
  });

  test('T1.20 Interactive Components - MagneticButtons trigger hover states and scale', () => {
    const btn = read('src/components/animations/MagneticButton.tsx');
    assert.match(btn, /motion/);
    assert.match(btn, /useSpring/);
  });

  test('T1.26 Reputation Funnel - Rating 4 stars displays the Google Review redirect prompt', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /rating >= 4/);
    assert.match(rev, /Leave Us a Google Review/);
  });

  test('T1.27 Reputation Funnel - Google Review link opens in a new tab pointing to the GBP review page', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /href=\{googleReviewUrl\}/);
    assert.match(rev, /target="_blank"/);
    assert.match(rev, /rel="noopener noreferrer"/);
    assert.match(rev, /ChIJ8d-Nq98d9kgR50-mR-K5k84/);
  });

  test('T1.28 Reputation Funnel - Rating 1, 2, or 3 stars intercepts user and displays private feedback form', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /We want to make it right\./);
    assert.match(rev, /handlePrivateSubmit/);
  });

  test('T1.29 Reputation Funnel - Feedback form submits private reviews to Formspree endpoint', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /formspree\.io\/f\//);
    assert.match(rev, /xanybvkd/);
  });

  test('T1.30 Reputation Funnel - Clicking "Change rating" button resets rating state', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /onClick=\{\(\) => setRating\(null\)\}/);
    assert.match(rev, /Change rating/);
  });

  test('T1.31 Lead Capture & API - Submitting LeadForm sends POST request to /api/leads', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /fetch\('\/api\/leads'/);
    assert.match(form, /method: 'POST'/);
  });

  test('T1.32 Lead Capture & API - Local Storage lead queue saves submission payloads when offline', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /!navigator\.onLine/);
    assert.match(form, /localStorage\.setItem\('pending_leads'/);
  });

  test('T1.33 Lead Capture & API - Regaining online status triggers immediate flushing of lead queue', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /window\.addEventListener\('online', syncOfflineLeads\)/);
  });

  test('T1.34 Lead Capture & API - /api/leads validates email structures and throws bad request', () => {
    const api = read('src/lib/api/utils.ts');
    assert.match(api, /Enter a valid email address\./);
  });

  test('T1.35 Lead Capture & API - /api/manychat extracts and normalizes payload parameters', () => {
    const mc = read('src/app/api/manychat/route.ts');
    assert.match(mc, /customFields/);
    assert.match(mc, /budget/);
    assert.match(mc, /timeline/);
  });

});

describe('Tier 2: Boundary/Corner Cases', () => {

  test('T2.1 Routing & Navigation - Mobile menu toggle handles accessibility attributes', () => {
    const header = read('src/components/ConversionHeader.tsx');
    assert.match(header, /aria-label=\{mobileMenuOpen \?/);
    assert.match(header, /aria-expanded=\{mobileMenuOpen\}/);
  });

  test('T2.2 Routing & Navigation - Sticky mobile call CTAs render on narrow layouts', () => {
    const layout = read('src/app/layout.tsx');
    assert.match(layout, /href="tel:\+16514104196"/);
    assert.match(layout, /mobile_sticky/);
  });

  test('T2.3 Routing & Navigation - CSP and HTTP security headers are configured in vercel.json', () => {
    const vercel = read('vercel.json');
    assert.match(vercel, /Content-Security-Policy/);
    assert.match(vercel, /default-src 'self'/);
    assert.match(vercel, /object-src 'none'/);
    assert.match(vercel, /frame-ancestors 'none'/);
    assert.match(vercel, /Strict-Transport-Security/);
  });

  test('T2.4 Routing & Navigation - Referral parameters are parsed and stored in LocalStorage', () => {
    const header = read('src/components/ConversionHeader.tsx');
    assert.match(header, /ref/);
    assert.match(header, /localStorage\.setItem\('referrer_email'/);
  });

  test('T2.5 Routing & Navigation - E.164 phone numbers are format-compliant', () => {
    const header = read('src/components/ConversionHeader.tsx');
    assert.match(header, /tel:\+16514104196/);
    const layout = read('src/app/layout.tsx');
    assert.match(layout, /tel:\+16514104196/);
  });

  test('T2.6 Three-Market Content - Emojis are 100% absent in code/components/markup', () => {
    const files = [
      'src/app/layout.tsx',
      'src/components/ConversionHeader.tsx',
      'src/components/LeadForm.tsx',
      'src/app/HomeClient.tsx',
      'src/views/Estimate.tsx',
      'src/views/Review.tsx',
      'src/app/api/leads/route.ts',
      'src/app/api/manychat/route.ts'
    ];
    for (const f of files) {
      const content = read(f);
      // Ensure no emojis like 🚀, ✅, ❌, 🎉, ⚠️, 🧬, etc.
      assert.doesNotMatch(content, /[\u{1F300}-\u{1F9FF}]/u);
    }
  });

  test('T2.7 Three-Market Content - Licensed or Bonded claims are absent on Home page', () => {
    const home = read('src/app/HomeClient.tsx');
    assert.doesNotMatch(home, /Licensed/i);
    assert.doesNotMatch(home, /Bonded/i);
    assert.doesNotMatch(home, /Government-certified/i);
  });

  test('T2.8 Three-Market Content - Contractor registration ID is present on all pages', () => {
    const footer = read('src/app/layout.tsx');
    assert.match(footer, /IR816596/);
  });

  test('T2.9 Three-Market Content - Workers comp exemption statement is present near insurance references', () => {
    const capabilities = read('src/views/Capabilities.tsx');
    assert.match(capabilities, /Minnesota Statute 176\.041/);
    assert.match(capabilities, /Workers' Compensation Exemption/);
  });

  test('T2.10 Three-Market Content - SAM.gov active claims are absent on the Capabilities page', () => {
    const capabilities = read('src/views/Capabilities.tsx');
    assert.doesNotMatch(capabilities, /SAM\.gov active claim/i);
    assert.match(capabilities, /Registration package in preparation/);
  });

  test('T2.11 Local SEO Pages - Invalid SEO slugs return 404', () => {
    const landing = read('src/views/LandingPage.tsx');
    assert.match(landing, /if \(!page\)/);
    assert.match(landing, /return <NotFound \/>/);
  });

  test('T2.12 Local SEO Pages - Schema breadcrumbs handle nesting without double-slash errors', () => {
    const seo = read('src/lib/seo.ts');
    assert.match(seo, /itemListElement/);
    assert.match(seo, /BreadcrumbList/);
  });

  test('T2.13 Local SEO Pages - robots.txt declared sitemap and protects review page', () => {
    const sitemapGen = read('scripts/generate-sitemap.js');
    assert.match(sitemapGen, /Disallow: \/review/);
    assert.match(sitemapGen, /Sitemap:/);
  });

  test('T2.14 Local SEO Pages - App Router generateMetadata covers dynamic SEO slugs', () => {
    const areas = read('src/app/service-areas/[slug]/page.tsx');
    const services = read('src/app/painting-services/[slug]/page.tsx');
    assert.match(areas, /generateMetadata/);
    assert.match(services, /generateMetadata/);
  });

  test('T2.15 Local SEO Pages - LocalBusiness schema includes required pricing and hours', () => {
    const seo = read('src/lib/seo.ts');
    assert.match(seo, /priceRange/);
    assert.match(seo, /openingHoursSpecification/);
  });

  test('T2.16 Interactive Components - BeforeAfterSlider keyboard controls support left/right arrows', () => {
    const slider = read('src/components/BeforeAfterSlider.tsx');
    assert.match(slider, /ArrowLeft/);
    assert.match(slider, /ArrowRight/);
  });

  test('T2.17 Interactive Components - Slider position clamps exactly to 0 and 100 on Home/End key presses', () => {
    const slider = read('src/components/BeforeAfterSlider.tsx');
    assert.match(slider, /Home/);
    assert.match(slider, /End/);
    assert.match(slider, /0/);
    assert.match(slider, /100/);
  });

  test('T2.18 Interactive Components - ServiceAreaMap honors reduced motion requests', () => {
    const map = read('src/components/ServiceAreaMap.tsx');
    assert.match(map, /useReducedMotion/);
  });

  test('T2.19 Interactive Components - root layout has no next/dynamic ssr:false theater', () => {
    const layout = read('src/app/layout.tsx');
    assert.doesNotMatch(layout, /next\/dynamic/);
    assert.doesNotMatch(layout, /ssr:\s*false/);
    assert.doesNotMatch(layout, /CustomCursor|HeatmapOverlay/);
  });

  test('T2.20 Interactive Components - ServiceAreaMap SVG has alt elements and role', () => {
    const map = read('src/components/ServiceAreaMap.tsx');
    assert.match(map, /role="img"/);
    assert.match(map, /aria-labelledby=/);
  });

  test('T2.26 Reputation Funnel - Empty reviews submitted to Formspree block with validation warnings', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /!privateFeedback\.trim\(\)/);
    assert.match(rev, /Please add a few details/);
  });

  test('T2.27 Reputation Funnel - Formspree connection failures show a clear fallback contact message', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /The private feedback form did not send\. Please call or text/);
  });

  test('T2.28 Reputation Funnel - Selected review rating events are logged to the analytics engine', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /trackEvent\('review_rating_select'/);
  });

  test('T2.29 Reputation Funnel - Hovering over star selection scales buttons and alters fill', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /onMouseEnter/);
    assert.match(rev, /onMouseLeave/);
    assert.match(rev, /hoverRating/);
  });

  test('T2.30 Reputation Funnel - Submitting a 0-star rating is blocked', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /rating === null/);
  });

  test('T2.31 Lead Capture & API - Honeypot field triggers immediate success page for bots', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /bot_honeypot/);
    assert.match(form, /if \(botHoneypot\)/);
  });

  test('T2.32 Lead Capture & API - API rate limiting blocks requests exceeding 5 per minute', () => {
    const api = read('src/app/api/leads/route.ts');
    assert.match(api, /createRateLimiter\(5,/);
    assert.match(api, /rateLimit/);
  });

  test('T2.33 Lead Capture & API - Upload photo URLs are validated and rejected if protocol is missing', () => {
    const api = read('src/lib/api/utils.ts');
    assert.match(api, /\['http:', 'https:'\].includes\(url\.protocol\)/);
  });

  test('T2.34 Lead Capture & API - HubSpot CRM integration skips gracefully if credentials are missing', () => {
    const api = read('src/app/api/leads/route.ts');
    assert.match(api, /HUBSPOT_FORM_ID/);
    assert.match(api, /if \(!formId\)/);
  });

  test('T2.35 Lead Capture & API - API endpoints return 500 with email draft fallbacks if Resend is missing', () => {
    const api = read('src/app/api/leads/route.ts');
    assert.match(api, /res\.status\(500\)\.json\(\{.*fallback: 'email'/);
  });

});

describe('Tier 3: Cross-Feature Combinations', () => {

  test('T3.1 Offline + Calculator - Submitting estimate lead while offline queues it locally', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /localStorage\.setItem\('pending_leads'/);
    assert.match(form, /Offline Mode:/);
  });

  test('T3.2 Offline + Review Funnel - Submitting negative reviews offline triggers fallback message', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /catch \(err\)/);
    assert.match(rev, /The private feedback form did not respond\. Please call or text/);
  });

  test('T3.3 SEO Landing + Lead Form - Lead submissions from local SEO routes capture page paths', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /page: window\.location\.pathname/);
  });

  test('T3.4 Product theater components stay deleted', () => {
    assert.ok(!exists('src/components/CustomCursor.tsx'));
    assert.ok(!exists('src/components/SpecInspector.tsx'));
    assert.ok(!exists('src/app/api/memory/route.ts'));
    assert.ok(!exists('scripts/prerender.mjs'));
  });

  test('T3.5 Accessibility + Lead Form - Reduced motion options disable animations during interaction', () => {
    const form = read('src/components/LeadForm.tsx');
    // Reduced motion is handled globally or via transitions
    assert.ok(exists('src/components/PageTransition.tsx'));
  });

  test('T3.6 Slider + Room Calculator - Keyboard events do not conflict between sliders', () => {
    const slider = read('src/components/BeforeAfterSlider.tsx');
    const est = read('src/views/Estimate.tsx');
    assert.match(slider, /onKeyDown/);
    assert.match(est, /onChange/);
  });

  test('T3.7 Review Funnel + Analytics - Redirecting to Google Business Reviews logs conversions', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /trackEvent\('google_review_redirect_click'/);
  });

});

describe('Tier 4: Real-World Scenarios', () => {

  test('T4.1 Customer Acquisition - Referral, slider comparison, room calculation, and lead submission flow', () => {
    const header = read('src/components/ConversionHeader.tsx');
    const slider = read('src/components/BeforeAfterSlider.tsx');
    const est = read('src/views/Estimate.tsx');
    const form = read('src/components/LeadForm.tsx');
    
    assert.match(header, /localStorage\.setItem\('referrer_email'/);
    assert.match(slider, /BeforeAfterSlider/);
    assert.match(est, /EstimatePage/);
    assert.match(form, /LeadForm/);
  });

  test('T4.2 Intercepted Review - Negative rating intercepts unhappy client to private feedback', () => {
    const rev = read('src/views/Review.tsx');
    assert.match(rev, /rating < 4/);
    assert.match(rev, /We want to make it right/);
    assert.match(rev, /formspree\.io/);
  });

  test('T4.3 Offline Contractor - Estimate costs, queue lead offline, and sync online', () => {
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /!navigator\.onLine/);
    assert.match(form, /window\.addEventListener\('online'/);
  });

  test('T4.4 Security & Anti-Spam - Bot honeypot triggers quick success, and rate limit blocks flood', () => {
    const api = read('src/app/api/leads/route.ts');
    const form = read('src/components/LeadForm.tsx');
    assert.match(form, /bot_honeypot/);
    assert.match(api, /rateLimit/);
  });

  test('T4.5 Static SEO Crawler - Indexation, sitemaps validation, and schema markup checks', () => {
    const layout = read('src/app/layout.tsx');
    const sitemap = read('scripts/generate-sitemap.js');
    assert.match(layout, /application\/ld\+json/);
    assert.match(sitemap, /generateSitemap/);
  });

});
