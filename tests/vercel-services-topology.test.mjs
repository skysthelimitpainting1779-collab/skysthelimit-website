import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const integrationSource = readFileSync(new URL('../services/integrations/src/index.ts', import.meta.url), 'utf8');
const decisions = readFileSync(new URL('../.agents/CURRENT_DECISIONS.md', import.meta.url), 'utf8');

test('keeps the production-linked website project on the proven single-service Next.js topology before G70', () => {
  assert.equal(config.framework, 'nextjs');
  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.buildCommand, 'npm run build:vercel');
  assert.equal(Object.hasOwn(config, 'services'), false);
  assert.equal((config.rewrites ?? []).some((rewrite) => typeof rewrite.destination === 'object' && rewrite.destination?.service), false);
});

test('records Vercel Services as a gated target instead of an active production-linked deployment', () => {
  assert.match(decisions, /target topology/i);
  assert.match(decisions, /dedicated non-production Services project/i);
  assert.match(decisions, /G70/i);
});

test('retains the dormant integrations service implementation for the future isolated Services project', () => {
  assert.match(integrationSource, /new Hono\(\)/);
  assert.match(integrationSource, /app\.get\(['"]\/health['"]/);
  assert.match(integrationSource, /export default app/);
  assert.doesNotMatch(integrationSource, /process\.env|console\./);
});
