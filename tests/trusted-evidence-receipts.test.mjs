import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createEvidenceReceipt,
  validateEvidenceReceipt,
} from '../scripts/lib/trusted-evidence-receipts.mjs';

const HEAD = '82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a';
const TREE = 'c6874a222623efc831058534a0581a3e12c93286';

test('creates a deterministic trusted local runner receipt bound to command and git state', () => {
  const first = createEvidenceReceipt({
    issuer: 'trusted-local-runner',
    kind: 'focused_test',
    command: 'npx tsx --test tests/active-state-reconciliation.test.mjs',
    exitCode: 0,
    headSha: HEAD,
    treeSha: TREE,
    output: 'pass 10\n',
    observedAt: '2026-07-29T20:55:00Z',
  });
  const second = createEvidenceReceipt({
    issuer: 'trusted-local-runner',
    kind: 'focused_test',
    command: 'npx tsx --test tests/active-state-reconciliation.test.mjs',
    exitCode: 0,
    headSha: HEAD,
    treeSha: TREE,
    output: 'pass 10\n',
    observedAt: '2026-07-29T20:55:00Z',
  });

  assert.equal(first.receiptSha256, second.receiptSha256);
  assert.equal(first.headSha, HEAD);
  assert.equal(first.treeSha, TREE);
  assert.equal(first.outputSha256.length, 64);
  assert.deepEqual(validateEvidenceReceipt(first), { ok: true, errors: [] });
});

test('rejects advisory agent statements as trusted evidence', () => {
  const receipt = createEvidenceReceipt({
    issuer: 'agent:writer',
    kind: 'focused_test',
    command: 'npm test',
    exitCode: 0,
    headSha: HEAD,
    treeSha: TREE,
    output: 'claimed pass',
    observedAt: '2026-07-29T20:55:00Z',
  });

  const result = validateEvidenceReceipt(receipt);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /issuer/i);
});

test('rejects local evidence for nonzero command exit', () => {
  const receipt = createEvidenceReceipt({
    issuer: 'trusted-local-runner',
    kind: 'focused_test',
    command: 'npm test',
    exitCode: 1,
    headSha: HEAD,
    treeSha: TREE,
    output: 'fail',
    observedAt: '2026-07-29T20:55:00Z',
  });

  assert.equal(validateEvidenceReceipt(receipt).ok, false);
});

test('rejects receipts rebound to a different commit after test execution', () => {
  const receipt = createEvidenceReceipt({
    issuer: 'trusted-local-runner',
    kind: 'focused_test',
    command: 'npm test',
    exitCode: 0,
    headSha: HEAD,
    treeSha: TREE,
    output: 'pass',
    observedAt: '2026-07-29T20:55:00Z',
  });

  const tampered = { ...receipt, headSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
  const result = validateEvidenceReceipt(tampered);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /integrity/i);
});

test('accepts provider receipts only with immutable provider evidence id and exact SHA', () => {
  const receipt = createEvidenceReceipt({
    issuer: 'github-actions',
    kind: 'github_check',
    providerId: 'github',
    providerEvidenceId: 'run-30410454021',
    status: 'passed',
    conclusion: 'success',
    headSha: HEAD,
    output: '{"name":"Quality Gate","head_sha":"82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a"}',
    observedAt: '2026-07-29T20:55:00Z',
  });

  assert.deepEqual(validateEvidenceReceipt(receipt), { ok: true, errors: [] });
});
