import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('homepage hero keeps the Owner\'s Finish Ledger positioning and direct conversion paths', () => {
  const home = read('src/app/HomeClient.tsx');

  assert.match(home, /A finish that lasts starts before the first coat\./i);
  assert.match(home, /Book a free walkthrough/i);
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
  assert.doesNotMatch(prep, /grayscale/);
});

test('shared conversion surfaces avoid duplicate homepage asks and keep mobile navigation accessible', () => {
  const footer = read('src/components/ConversionFooterCta.tsx');
  const header = read('src/components/ConversionHeader.tsx');

  assert.match(footer, /if \(pathname === '\/'\) return null/);
  assert.match(header, /aria-expanded=\{mobileMenuOpen\}/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(header, /aria-label="Mobile navigation"/);
  assert.match(header, /Book a free walkthrough/);
});
