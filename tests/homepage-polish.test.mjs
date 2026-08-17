import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('homepage hero keeps the approved positioning and three clear conversion paths', () => {
  const home = read('src/app/HomeClient.tsx');

  assert.match(home, /Residential detail\. Commercial discipline\.\s*<span[^>]*>Preps<\/span>\s*first\./i);
  assert.match(home, /Get My Free Price Range/);
  assert.match(home, /href="tel:\+16514104196"/);
  assert.match(home, /href="\/projects"/);
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
  assert.match(prep, /aria-live="polite"/);
  assert.doesNotMatch(prep, /grayscale/);
});

test('shared conversion surfaces use the same price-range language and print safely', () => {
  const footer = read('src/components/ConversionFooterCta.tsx');
  const header = read('src/components/ConversionHeader.tsx');

  assert.match(footer, /Get My Free Price Range/);
  assert.doesNotMatch(footer, /IconFeatureCard/);
  assert.match(header, /top-\[120px\]/);
  assert.match(header, /print:hidden/);
  assert.match(header, /#main-content/);
  assert.match(header, /padding-top: 0 !important/);
  assert.match(header, /mobile_sticky/);
});
