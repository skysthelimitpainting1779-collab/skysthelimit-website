import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('all execution nodes resolve to installed primary and declared supporting skills', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-skill-routing.mjs'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.routes, 66);
});
