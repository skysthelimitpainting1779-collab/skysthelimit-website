import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { findWorkflowContractErrors } from '../scripts/ci-contract.mjs';

function makeFixture({ packageScripts = {}, workflow = '', files = [] } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'ci-contract-'));
  mkdirSync(join(root, '.github', 'workflows'), { recursive: true });
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ scripts: packageScripts }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(root, '.github', 'workflows', 'ci.yml'), workflow, 'utf8');
  for (const file of files) {
    const absolute = join(root, file);
    mkdirSync(join(absolute, '..'), { recursive: true });
    writeFileSync(absolute, '', 'utf8');
  }
  return root;
}

test('reports missing npm scripts and missing local command files', () => {
  const root = makeFixture({
    workflow: `jobs:\n  test:\n    steps:\n      - run: npm run lint:ci\n      - run: bash .github/scripts/missing.sh\n`,
  });

  try {
    assert.deepEqual(findWorkflowContractErrors({ root }), [
      '.github/workflows/ci.yml: missing local file .github/scripts/missing.sh',
      '.github/workflows/ci.yml: npm script "lint:ci" is not defined in package.json',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports inconsistent refs for actions from the same repository', () => {
  const root = makeFixture({
    workflow: `jobs:\n  analyze:\n    steps:\n      - uses: github/codeql-action/init@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n      - uses: github/codeql-action/analyze@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n`,
  });

  try {
    assert.deepEqual(findWorkflowContractErrors({ root }), [
      '.github/workflows/ci.yml: github/codeql-action actions use inconsistent refs: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa, bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejects mutable action refs', () => {
  const root = makeFixture({
    workflow: `jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n`,
  });

  try {
    assert.deepEqual(findWorkflowContractErrors({ root }), [
      '.github/workflows/ci.yml: action must be pinned to a 40-character commit SHA: actions/checkout@v4',
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('accepts valid npm scripts, npm test, local files, and local reusable workflows', () => {
  const root = makeFixture({
    packageScripts: { 'lint:ci': 'node scripts/lint.mjs', test: 'node --test' },
    workflow: `jobs:\n  test:\n    uses: ./.github/workflows/quality.yml\n  lint:\n    steps:\n      - run: npm run lint:ci\n      - run: npm test\n      - run: node scripts/check.mjs\n      - uses: github/codeql-action/init@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n      - uses: github/codeql-action/analyze@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n`,
    files: [
      '.github/workflows/quality.yml',
      'scripts/check.mjs',
    ],
  });

  try {
    assert.deepEqual(findWorkflowContractErrors({ root }), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('repository workflows satisfy package and local-file contracts', () => {
  assert.deepEqual(findWorkflowContractErrors({ root: process.cwd() }), []);
});
