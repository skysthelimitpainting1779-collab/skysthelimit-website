import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

test('the test runner avoids the tsx CLI IPC server', () => {
  assert.equal(packageJson.scripts.test, 'node --import tsx --test tests/*.mjs');
});
