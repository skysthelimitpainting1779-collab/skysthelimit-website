import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('architecture decision guard rejects stale target-state instructions', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts['arch:decisions'], 'node scripts/verify-architecture-decisions.mjs');

  const result = spawnSync(process.execPath, ['scripts/verify-architecture-decisions.mjs'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /architecture decisions verified/i);
});
