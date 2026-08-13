import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const estimateSource = readFileSync('src/views/Estimate.tsx', 'utf8');
const sliderSource = readFileSync('src/components/RangeSlider.tsx', 'utf8');
const marketingLayoutSource = readFileSync(
  'src/app/(marketing)/layout.tsx',
  'utf8',
);
const stylesSource = readFileSync('src/index.css', 'utf8');

async function estimateModule() {
  return import('../src/lib/estimate.ts');
}

test('estimate rules produce deterministic planning ranges for every project type', async () => {
  const { calculateEstimate } = await estimateModule();

  assert.deepEqual(
    calculateEstimate({
      projectType: 'interior',
      prepLevel: 'standard',
      width: 12,
      length: 14,
      height: 8,
    }),
    {
      currency: 'USD',
      high: 2000,
      low: 1500,
      modelVersion: '2026-07-29',
    },
  );

  assert.deepEqual(
    calculateEstimate({
      projectType: 'exterior',
      prepLevel: 'premium',
      siding: 'Stucco',
      stories: '2 Story',
    }),
    {
      currency: 'USD',
      high: 11200,
      low: 7900,
      modelVersion: '2026-07-29',
    },
  );

  assert.deepEqual(
    calculateEstimate({
      cabinetCount: 20,
      prepLevel: 'premium',
      projectType: 'cabinets',
    }),
    {
      currency: 'USD',
      high: 3500,
      low: 2700,
      modelVersion: '2026-07-29',
    },
  );
});

test('premium preparation is calculated from the selected value, not stale UI state', async () => {
  const { calculateEstimate } = await estimateModule();
  const standard = calculateEstimate({
    projectType: 'interior',
    prepLevel: 'standard',
    width: 12,
    length: 14,
    height: 8,
  });
  const premium = calculateEstimate({
    projectType: 'interior',
    prepLevel: 'premium',
    width: 12,
    length: 14,
    height: 8,
  });

  assert.ok(premium.low > standard.low);
  assert.ok(premium.high > standard.high);
});

test('estimate inputs fail closed when numeric project data is invalid', async () => {
  const { calculateEstimate } = await estimateModule();

  assert.throws(
    () =>
      calculateEstimate({
        projectType: 'interior',
        prepLevel: 'standard',
        width: Number.NaN,
        length: 14,
        height: 8,
      }),
    /width/i,
  );
  assert.throws(
    () =>
      calculateEstimate({
        projectType: 'cabinets',
        prepLevel: 'standard',
        cabinetCount: 0,
      }),
    /cabinet/i,
  );
});

test('estimate inputs fail closed when categorical project data is invalid', async () => {
  const { calculateEstimate } = await estimateModule();

  assert.throws(
    () =>
      calculateEstimate({
        projectType: 'exterior',
        prepLevel: 'standard',
        siding: 'Stucco',
        stories: 'Penthouse',
      }),
    /stories/i,
  );
  assert.throws(
    () =>
      calculateEstimate({
        projectType: 'exterior',
        prepLevel: 'standard',
        siding: 'Unknown',
        stories: '2 Story',
      }),
    /siding/i,
  );
  assert.throws(
    () =>
      calculateEstimate({
        projectType: 'cabinets',
        prepLevel: 'rush',
        cabinetCount: 20,
      }),
    /prep level/i,
  );
});

test('idempotency keys are reused only for byte-identical submissions', async () => {
  const { selectEstimateIdempotency } = await estimateModule();
  let sequence = 0;
  const createKey = () => `key-${++sequence}`;
  const first = selectEstimateIdempotency(null, 'payload-a', createKey);
  const retry = selectEstimateIdempotency(first, 'payload-a', createKey);
  const changed = selectEstimateIdempotency(retry, 'payload-b', createKey);

  assert.equal(retry.key, first.key);
  assert.notEqual(changed.key, first.key);
  assert.equal(sequence, 2);
});

test('lead fields preserve the displayed range and model provenance', async () => {
  const { buildEstimateLeadFields, calculateEstimate } = await estimateModule();
  const input = {
    projectType: 'exterior',
    prepLevel: 'premium',
    siding: 'Stucco',
    stories: '2 Story',
  };
  const range = calculateEstimate(input);
  const fields = buildEstimateLeadFields(input, range);

  assert.equal(fields.budget, '$7,900 - $11,200');
  assert.match(fields.notes, /Model: 2026-07-29/);
  assert.match(fields.notes, /Project: exterior/);
  assert.match(fields.notes, /Prep: premium/);
});

test('the funnel exposes status, labels, reduced motion, and deterministic estimate provenance', () => {
  assert.match(estimateSource, /useReducedMotion/);
  assert.match(estimateSource, /aria-live="polite"/);
  assert.match(estimateSource, /htmlFor="estimate-name"/);
  assert.match(estimateSource, /autoComplete="name"/);
  assert.match(estimateSource, /calculateEstimate\(/);
  assert.match(estimateSource, /buildEstimateLeadFields\(/);
  assert.match(estimateSource, /selectEstimateIdempotency\(/);
  assert.match(estimateSource, /querySelector<HTMLElement>/);
  assert.match(estimateSource, /\.focus\(\)/);
  assert.doesNotMatch(estimateSource, /const calculateFinal =/);
  assert.doesNotMatch(estimateSource, /Math\.random\(\)\.toString/);
});

test('range controls have an explicit accessible name and numeric value contract', () => {
  assert.match(sliderSource, /htmlFor=\{id\}/);
  assert.match(sliderSource, /aria-valuetext=\{displayValue\}/);
  assert.match(sliderSource, /aria-describedby=\{`\$\{id\}-bounds`\}/);
});

test('the mobile site CTA does not cover the estimate tool', () => {
  assert.match(estimateSource, /data-estimate-planner/);
  assert.match(marketingLayoutSource, /mobile-estimate-cta/);
  assert.match(
    stylesSource,
    /body:has\(\[data-estimate-planner\]\) \.mobile-estimate-cta/,
  );
});
