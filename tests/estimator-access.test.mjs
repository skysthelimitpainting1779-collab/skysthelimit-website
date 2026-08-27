import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isEstimatorAdmin } from '../src/lib/auth/estimator.ts';

test('estimator access defaults to the company mailbox', () => {
  const prior = process.env.ESTIMATOR_ADMIN_EMAILS;
  delete process.env.ESTIMATOR_ADMIN_EMAILS;
  assert.equal(isEstimatorAdmin('skysthelimitpainting1779@gmail.com'), true);
  assert.equal(isEstimatorAdmin('another@example.com'), false);
  if (prior !== undefined) process.env.ESTIMATOR_ADMIN_EMAILS = prior;
});

test('estimator access honors a configured comma-separated admin allowlist', () => {
  const prior = process.env.ESTIMATOR_ADMIN_EMAILS;
  process.env.ESTIMATOR_ADMIN_EMAILS = 'owner@example.com, estimator@example.com';
  assert.equal(isEstimatorAdmin('ESTIMATOR@example.com'), true);
  assert.equal(isEstimatorAdmin('client@example.com'), false);
  if (prior === undefined) delete process.env.ESTIMATOR_ADMIN_EMAILS;
  else process.env.ESTIMATOR_ADMIN_EMAILS = prior;
});
