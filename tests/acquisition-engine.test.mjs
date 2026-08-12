import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  LEAD_STATUS_TRANSITIONS,
  buildCompanyRequestKey,
  buildLeadDedupeKey,
  compactCommandValue,
  requireRunCompletionEvidence,
  isLeadTransitionAllowed,
  scoreLead,
} from '../convex/acquisition.ts';

const schemaSource = readFileSync('convex/schema.ts', 'utf8');
const acquisitionSource = readFileSync('convex/acquisition.ts', 'utf8');

test('acquisition schema persists the full repeatable loop with indexed reads', () => {
  for (const table of [
    'acquisitionSignals',
    'acquisitionLeadIdentities',
    'acquisitionTouches',
    'acquisitionRuns',
    'contentQueue',
    'acquisitionSuppressions',
  ]) {
    assert.match(schemaSource, new RegExp(`${table}: defineTable`));
  }

  assert.match(schemaSource, /dedupeKey: v\.optional\(v\.string\(\)\)/);
  assert.match(schemaSource, /lane: v\.optional\(acquisitionLane\)/);
  assert.match(schemaSource, /score: v\.optional\(v\.number\(\)\)/);
  assert.match(schemaSource, /nextActionAt: v\.optional\(v\.number\(\)\)/);
  assert.match(schemaSource, /stopReason: v\.optional\(v\.string\(\)\)/);
  assert.match(
    schemaSource,
    /\.index\('by_company_dedupeKey', \['companyId', 'dedupeKey'\]\)/
  );
  assert.match(
    schemaSource,
    /\.index\('by_company_status_and_nextActionAt', \['companyId', 'status', 'nextActionAt'\]\)/
  );
  assert.match(
    schemaSource,
    /\.index\('by_lead_occurredAt', \['leadId', 'occurredAt'\]\)/
  );
  assert.match(
    schemaSource,
    /\.index\('by_company_runKey', \['companyId', 'runKey'\]\)/
  );
});

test('lead scoring reproduces the operating model and blocks unsafe action', () => {
  assert.deepEqual(
    scoreLead({
      serviceFit: 30,
      urgency: 20,
      geography: 15,
      contactQuality: 15,
      proofMatch: 10,
      operationalFit: 10,
      blockers: [],
    }),
    { total: 100, disposition: 'work_now', actionable: true }
  );

  assert.deepEqual(
    scoreLead({
      serviceFit: 30,
      urgency: 20,
      geography: 15,
      contactQuality: 15,
      proofMatch: 10,
      operationalFit: 10,
      blockers: ['unverified traffic-control responsibility'],
    }),
    { total: 100, disposition: 'blocked', actionable: false }
  );

  assert.deepEqual(
    scoreLead({
      serviceFit: 22,
      urgency: 8,
      geography: 15,
      contactQuality: 8,
      proofMatch: 7,
      operationalFit: 5,
      blockers: [],
    }),
    { total: 65, disposition: 'monitor', actionable: false }
  );
});

test('lead identity prefers verified public email and otherwise uses company plus city', () => {
  assert.equal(
    buildLeadDedupeKey({
      companyName: '  Advantage Signs & Graphics, Inc. ',
      city: 'St. Paul',
      publicEmail: ' Signs@AdvanSign.com ',
    }),
    'email:signs@advansign.com'
  );
  assert.equal(
    buildLeadDedupeKey({
      companyName: 'North Path Property Management',
      city: 'Wayzata',
    }),
    'business:north-path-property-management|wayzata'
  );
});

test('idempotency command payloads recursively omit optional undefined values', () => {
  assert.deepEqual(
    compactCommandValue({
      required: 'value',
      optional: undefined,
      nested: { keep: 1, omit: undefined },
      array: ['keep', undefined, { keep: true, omit: undefined }],
    }),
    {
      required: 'value',
      nested: { keep: 1 },
      array: ['keep', { keep: true }],
    }
  );
});

test('idempotency requests are isolated by company', () => {
  assert.equal(buildCompanyRequestKey('company-a', 'same-request'), 'company-a:same-request');
  assert.notEqual(
    buildCompanyRequestKey('company-a', 'same-request'),
    buildCompanyRequestKey('company-b', 'same-request')
  );
});

test('successful or partial runs require a durable execution receipt', () => {
  assert.throws(
    () => requireRunCompletionEvidence('succeeded', undefined, undefined),
    /receipt/i
  );
  assert.throws(
    () => requireRunCompletionEvidence('succeeded', null, undefined),
    /receipt/i
  );
  assert.throws(
    () => requireRunCompletionEvidence('failed', undefined, undefined),
    /error/i
  );
  assert.doesNotThrow(() =>
    requireRunCompletionEvidence('succeeded', { providerId: 'receipt-1' }, undefined)
  );
});

test('lead lifecycle is explicit and terminal states stay closed', () => {
  assert.deepEqual(LEAD_STATUS_TRANSITIONS, {
    discovered: ['verified', 'suppressed'],
    verified: ['qualified', 'suppressed'],
    qualified: ['contacted', 'suppressed'],
    contacted: ['replied', 'lost', 'suppressed'],
    replied: ['estimate_requested', 'lost', 'suppressed'],
    estimate_requested: ['won', 'lost'],
    won: [],
    lost: [],
    suppressed: [],
  });
  assert.equal(isLeadTransitionAllowed('verified', 'qualified'), true);
  assert.equal(isLeadTransitionAllowed('won', 'contacted'), false);
  assert.equal(isLeadTransitionAllowed('contacted', 'contacted'), false);
});

test('Convex functions expose bounded queues, idempotent writes, and stop controls', () => {
  assert.match(acquisitionSource, /export const upsertLead = mutation\(/);
  assert.match(acquisitionSource, /export const transitionLead = mutation\(/);
  assert.match(acquisitionSource, /export const recordTouch = mutation\(/);
  assert.match(acquisitionSource, /export const recordSignal = mutation\(/);
  assert.match(acquisitionSource, /export const startRun = mutation\(/);
  assert.match(acquisitionSource, /export const completeRun = mutation\(/);
  assert.match(acquisitionSource, /export const queueContent = mutation\(/);
  assert.match(acquisitionSource, /export const recordContentResult = mutation\(/);
  assert.match(acquisitionSource, /export const workQueue = query\(/);
  assert.match(acquisitionSource, /args:[\s\S]*returns:/);
  assert.match(acquisitionSource, /claimIdempotencyKey/);
  assert.match(acquisitionSource, /completeIdempotencyKey/);
  assert.match(acquisitionSource, /appendDomainEvent/);
  assert.match(acquisitionSource, /appendAuditFact/);
  assert.match(acquisitionSource, /by_company_dedupeKey/);
  assert.match(acquisitionSource, /by_company_status_and_nextActionAt/);
  assert.doesNotMatch(acquisitionSource, /\.filter\(/);
  assert.doesNotMatch(acquisitionSource, /\.collect\(/);
});
