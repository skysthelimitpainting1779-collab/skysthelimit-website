import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('homepage hero keeps the Owner\'s Finish Ledger positioning and direct conversion paths', () => {
  const home = read('src/app/HomeClient.tsx');

  assert.match(home, /A finish that lasts starts before the first coat\./i);
  assert.match(home, /Start the Written Scope/i);
  assert.match(home, /href="tel:\+16514104196"/);
  assert.match(home, /href="#walkthrough"/);
  assert.match(home, /homepage_owner_finish_ledger/);
  assert.match(home, /marketing-hero-exterior-painting\.webp/);
});

test('homepage copy removes terminal-style marketing scaffolding', () => {
  const home = read('src/app/HomeClient.tsx');
  const prep = read('src/components/PrepProtocolStage.tsx');

  assert.doesNotMatch(home, /Scope ledger/i);
  assert.doesNotMatch(home, /Operational controls/i);
  assert.doesNotMatch(home, /Request a written scope/i);
  assert.doesNotMatch(prep, /Select a work control/i);
  assert.doesNotMatch(prep, /Field viewer/i);
  assert.doesNotMatch(prep, /\bLOAD\b|\bACTIVE\b/);
});

test('prep interaction favors real work imagery and explicit touch targets', () => {
  const prep = read('src/components/PrepProtocolStage.tsx');

  assert.match(prep, /min-h-20/);
  assert.match(prep, /aria-pressed=\{selected\}/);
  assert.match(prep, /role="group"/);
  assert.match(prep, /Preparation record \/ \{active\.id\}/);
  assert.match(prep, /shadow-\[inset_4px_0_0_#0254C3\]/);
  assert.match(prep, /text-brand/);
  assert.doesNotMatch(prep, /grayscale/);
});

test('shared conversion surfaces avoid duplicate homepage asks and keep mobile navigation measurable', () => {
  const footer = read('src/components/ConversionFooterCta.tsx');
  const header = read('src/components/ConversionHeader.tsx');

  assert.match(footer, /if \(pathname === '\/'\) return null/);
  assert.match(footer, /Get a Free Price Range/);
  assert.match(footer, /PublicFeatureGrid/);
  assert.match(header, /open=\{mobileMenuOpen\}/);
  assert.match(header, /onOpenChange=\{setMobileMenuOpen\}/);
  assert.match(header, /mobileMenuOpen \? 'Close navigation menu' : 'Open navigation menu'/);
  assert.match(header, /aria-label="Mobile navigation"/);
  assert.match(header, /source: 'mobile_header'/);
  assert.match(header, /print:static/);
  assert.match(header, /Get a Free Price Range/);
});

test('ledger success state, print behavior, and tape motion retain their contracts', () => {
  const css = read('src/index.css');
  const layout = read('src/app/layout.tsx');
  const rail = read('src/components/public/MobileConversionRail.tsx');

  assert.match(css, /\[data-lead-theme="ledger"\]\[data-lead-panel\]/);
  assert.match(css, /@keyframes ledger-tape-set[\s\S]*transform: scaleY\(0\)[\s\S]*transform: scaleY\(1\)/);
  assert.match(css, /\.mobile-conversion-rail[\s\S]*display: none !important/);
  assert.doesNotMatch(css, /\.noise-overlay/);
  assert.match(layout, /MobileConversionRail/);
  assert.match(rail, /mobile-conversion-rail/);
  assert.match(rail, /Get a Free Price Range/);
  assert.doesNotMatch(layout, /directionContract|dangerouslySetInnerHTML=\{\{ __html: `<!--/);
});

test('public routes compose the modular shadcn design system', () => {
  const system = read('src/components/public/PublicSystem.tsx');
  const estimate = read('src/views/Estimate.tsx');
  const leadForm = read('src/components/LeadForm.tsx');
  const css = read('src/index.css');

  assert.match(system, /from '@\/components\/ui\/button'/);
  assert.match(system, /from '@\/components\/ui\/card'/);
  assert.match(system, /PublicHero/);
  assert.match(system, /PublicSection/);
  assert.match(estimate, /<ToggleGroup/);
  assert.match(estimate, /<Progress/);
  assert.match(estimate, /<FieldLabel htmlFor="estimate-name"/);
  assert.match(leadForm, /<FieldLabel htmlFor="name-input"/);
  assert.match(css, /Layer 1: primitive values/);
  assert.match(css, /Layer 2: public semantic tokens/);
  assert.match(css, /Layer 3: component and composition tokens/);
});

test('release documentation and local Graphify configuration remain portable', () => {
  const agentConfig = read('.agents/mcp_config.json');
  const codexConfig = read('.codex/config.toml');
  const design = read('DESIGN.md');

  assert.match(agentConfig, /graphify-out\/graph\.json/);
  assert.match(codexConfig, /graphify-out\/graph\.json/);
  assert.doesNotMatch(`${agentConfig}\n${codexConfig}`, /C:\/Users\//i);
  assert.doesNotMatch(design, /\.impeccable\//);
});

test('reviewed public-system primitives preserve interaction and accessibility contracts', () => {
  const slider = read('src/components/ui/slider.tsx');
  const toggleGroup = read('src/components/ui/toggle-group.tsx');
  const field = read('src/components/ui/field.tsx');
  const progress = read('src/components/ui/progress.tsx');
  const rail = read('src/components/public/MobileConversionRail.tsx');

  assert.match(slider, /value !== undefined[\s\S]*\? \[value\]/);
  assert.match(slider, /index=\{index\}/);
  assert.doesNotMatch(slider, /\[min, max\]/);
  assert.match(toggleGroup, /data-\[orientation=vertical\]/);
  assert.match(toggleGroup, /group-data-\[orientation=horizontal\]/);
  assert.match(field, /function FieldTitle[\s\S]*data-slot="field-title"/);
  assert.match(progress, /data-lead-progress/);
  assert.match(rail, /\['\/admin', '\/manage', '\/portal'\]/);
});

test('public analytics and legal destinations are wired to working components', () => {
  const layout = read('src/app/layout.tsx');
  const delegator = read('src/components/AnalyticsDelegator.tsx');
  const privacy = read('src/app/privacy/page.tsx');
  const terms = read('src/app/terms/page.tsx');

  assert.match(layout, /<AnalyticsDelegator \/>/);
  assert.match(delegator, /closest<HTMLElement>\('\[data-track\]'\)/);
  assert.match(delegator, /trackEvent\(eventName/);
  assert.match(privacy, /Privacy policy\./);
  assert.match(terms, /Website terms\./);
});

test('project claims, landing metadata, and smoke markers remain evidence-safe', () => {
  const projects = read('src/views/Projects.tsx');
  const landing = read('src/views/LandingPage.tsx');
  const refer = read('src/views/Refer.tsx');
  const smoke = read('scripts/smoke-site.mjs');

  assert.doesNotMatch(projects, /Verified project scope|Real project imagery/);
  assert.match(projects, /Surface reference imagery/);
  assert.doesNotMatch(landing, /<JsonLd/);
  assert.match(landing, /related\.kind === 'area'/);
  assert.doesNotMatch(refer, /<form onSubmit=\{handleGenerate\} noValidate>/);
  assert.match(smoke, /Real surfaces\. Real finish\./);
});

test('visual capture skill keeps local-only and complete-page safety checks in every host copy', () => {
  const agentCapture = read('.agents/skills/capture-public-site-visuals/scripts/capture.mjs');
  const githubCapture = read('.github/skills/capture-public-site-visuals/scripts/capture.mjs');

  assert.equal(agentCapture, githubCapture);
  assert.match(agentCapture, /'\[::1\]'/);
  assert.match(agentCapture, /resolvedUrl\.origin !== baseUrl\.origin/);
  assert.match(agentCapture, /Capture route.*returned HTTP/);
  assert.match(agentCapture, /waitForBrowserPort/);
  assert.match(agentCapture, /image\.loading = 'eager'/);
  assert.match(agentCapture, /if \(fullPage\)[\s\S]*window\.scrollTo/);
});
