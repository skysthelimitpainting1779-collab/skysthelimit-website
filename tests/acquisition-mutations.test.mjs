import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeRun,
  queueContent,
  recordContentResult,
  recordSignal,
  recordTouch,
  transitionLead,
  upsertLead,
} from '../convex/acquisition.ts';

const user = { _id: 'users:staff', clerkSubject: 'user_staff', status: 'active' };
const company = { _id: 'companies:sky', name: 'Sky', status: 'active' };
const membership = {
  _id: 'memberships:staff-sky', userId: user._id, companyId: company._id,
  role: 'staff', status: 'active',
};

function acquisitionContext(extra = {}) {
  const rows = new Map(Object.entries({
    users: [user], companies: [company], memberships: [membership], leads: [],
    acquisitionSignals: [], acquisitionLeadIdentities: [], acquisitionTouches: [], acquisitionRuns: [], contentQueue: [],
    acquisitionSuppressions: [], idempotencyKeys: [], events: [], auditFacts: [], ...extra,
  }).map(([table, values]) => [table, values.map((value) => ({ ...value }))]));
  let nextId = 0;
  const matching = (table, predicates) => (rows.get(table) ?? [])
    .filter((row) => predicates.every((predicate) => predicate(row)));
  const query = (table) => {
    const predicates = [];
    let descending = false;
    const result = () => {
      const found = matching(table, predicates);
      return descending ? found.sort((a, b) => (b.occurredAt ?? 0) - (a.occurredAt ?? 0)) : found;
    };
    const terminal = {
      order(direction) { descending = direction === 'desc'; return terminal; },
      async first() { return result()[0] ?? null; },
      async take(limit) { return result().slice(0, limit); },
      async unique() {
        const found = result();
        assert.ok(found.length <= 1, `expected unique ${table} lookup`);
        return found[0] ?? null;
      },
    };
    return {
      withIndex(_name, build) {
        const index = {
          eq(field, value) { predicates.push((row) => row[field] === value); return index; },
          lte(field, value) { predicates.push((row) => row[field] <= value); return index; },
        };
        build(index);
        return terminal;
      },
    };
  };
  return {
    auth: { async getUserIdentity() { return { subject: user.clerkSubject, fva: [1, 1] }; } },
    db: {
      query,
      async get(id) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (row) return row;
        }
        return null;
      },
      async insert(table, value) {
        const row = { _id: `${table}:generated-${++nextId}`, _creationTime: nextId, ...value };
        const tableRows = rows.get(table) ?? [];
        tableRows.push(row);
        rows.set(table, tableRows);
        return row._id;
      },
      async patch(id, value) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (row) { Object.assign(row, value); return; }
        }
        throw new Error(`unknown record ${id}`);
      },
    },
    rows,
  };
}

const scoreInput = {
  serviceFit: 30, urgency: 10, geography: 15, contactQuality: 10,
  proofMatch: 8, operationalFit: 7,
};

test('signal writes accept omitted optionals and complete idempotently', async () => {
  const ctx = acquisitionContext();
  const args = {
    companyId: company._id, requestId: 'signal-1', signalKey: 'permit:1',
    type: 'permit', title: 'Commercial alteration', sourceUrl: 'https://example.test/permit',
    detectedAt: 1_000,
  };
  const first = await recordSignal._handler(ctx, args);
  const replay = await recordSignal._handler(ctx, args);
  assert.deepEqual(replay, first);
  assert.equal(ctx.rows.get('acquisitionSignals').length, 1);
});

test('email enrichment reuses the business lead and manual suppression blocks outbound', async () => {
  const ctx = acquisitionContext();
  const base = {
    companyId: company._id, source: 'directory', companyName: 'North Path PM', city: 'Wayzata',
    lane: 'property_facility', verified: true, scoreInput, blockers: [],
  };
  const discovered = await upsertLead._handler(ctx, { ...base, requestId: 'lead-1' });
  await assert.rejects(() => upsertLead._handler(ctx, {
    ...base, requestId: 'lead-1', sourceUrl: 'https://example.test/changed-source',
  }), /idempotency|different request|conflict/i);
  const enriched = await upsertLead._handler(ctx, {
    ...base, requestId: 'lead-2', publicEmail: 'hello@northpath.example',
  });
  assert.equal(enriched.leadId, discovered.leadId);
  const emailOnlyRefresh = await upsertLead._handler(ctx, {
    companyId: company._id, source: 'directory', requestId: 'lead-3',
    publicEmail: 'hello@northpath.example', lane: 'property_facility',
    verified: true, scoreInput, blockers: [],
  });
  assert.equal(emailOnlyRefresh.leadId, discovered.leadId);
  assert.equal(ctx.rows.get('leads')[0].companyName, 'North Path PM');
  assert.equal(ctx.rows.get('leads')[0].city, 'Wayzata');
  const observedAgain = await upsertLead._handler(ctx, { ...base, requestId: 'lead-4' });
  assert.equal(observedAgain.leadId, discovered.leadId);
  assert.equal(ctx.rows.get('leads').length, 1);

  await transitionLead._handler(ctx, {
    companyId: company._id, leadId: discovered.leadId, expectedStatus: 'verified',
    nextStatus: 'suppressed', requestId: 'suppress-1', stopReason: 'Do not contact',
  });
  assert.equal(ctx.rows.get('acquisitionSuppressions').length, 2);
  const replayAfterSuppression = await upsertLead._handler(ctx, { ...base, requestId: 'lead-1' });
  assert.deepEqual(replayAfterSuppression, discovered);
  assert.equal(ctx.rows.get('leads').length, 1);
  await assert.rejects(() => recordTouch._handler(ctx, {
    companyId: company._id, leadId: discovered.leadId, requestId: 'touch-blocked',
    channel: 'email', direction: 'outbound', status: 'sent', summary: 'Follow-up',
    occurredAt: 2_000, followUpAt: 864_002_000,
  }), /blocked|suppress/i);
});

test('a prior outbound touch enforces the five-business-day cooldown', async () => {
  const lead = {
    _id: 'leads:qualified', _creationTime: 1, companyId: company._id,
    companyName: 'Facility', city: 'St Paul', dedupeKey: 'business:facility|st-paul',
    source: 'directory', status: 'qualified', submittedAt: 1, updatedAt: 1,
  };
  const ctx = acquisitionContext({ leads: [lead] });
  const firstAt = Date.UTC(2026, 7, 3, 15);
  const first = await recordTouch._handler(ctx, {
    companyId: company._id, leadId: lead._id, requestId: 'touch-1', channel: 'email',
    direction: 'outbound', status: 'sent', summary: 'Initial note', occurredAt: firstAt,
    followUpAt: Date.UTC(2026, 7, 10, 15),
  });
  const replay = await recordTouch._handler(ctx, {
    companyId: company._id, leadId: lead._id, requestId: 'touch-1', channel: 'email',
    direction: 'outbound', status: 'sent', summary: 'Initial note', occurredAt: firstAt,
    followUpAt: Date.UTC(2026, 7, 10, 15),
  });
  assert.deepEqual(replay, first);
  assert.equal(ctx.rows.get('acquisitionTouches').length, 1);
  for (let index = 0; index < 25; index += 1) {
    ctx.rows.get('acquisitionTouches').push({
      _id: `acquisitionTouches:noise-${index}`, _creationTime: index + 10,
      companyId: company._id, leadId: lead._id, channel: 'email',
      direction: 'inbound', status: 'planned', isDeliveredOutbound: false,
      summary: 'Inbound noise', idempotencyKey: `noise-${index}`,
      occurredAt: firstAt + ((index + 1) * 60_000),
    });
  }
  await assert.rejects(() => recordTouch._handler(ctx, {
    companyId: company._id, leadId: lead._id, requestId: 'touch-2', channel: 'email',
    direction: 'outbound', status: 'sent', summary: 'Too soon',
    occurredAt: Date.UTC(2026, 7, 4, 15), followUpAt: Date.UTC(2026, 7, 11, 15),
  }), /cooldown/i);
});

test('run success and content publication require durable receipts', async () => {
  const run = {
    _id: 'acquisitionRuns:one', _creationTime: 1, companyId: company._id,
    runKey: 'daily:1', kind: 'lead_engine', status: 'started', startedAt: 1,
  };
  const ctx = acquisitionContext({ acquisitionRuns: [run] });
  await assert.rejects(() => completeRun._handler(ctx, {
    companyId: company._id, requestId: 'run-1', runId: run._id,
    status: 'succeeded', completedAt: 2,
  }), /receipt/i);
  await completeRun._handler(ctx, {
    companyId: company._id, requestId: 'run-2', runId: run._id,
    status: 'succeeded', completedAt: 2, receipt: { processed: 4 },
  });

  const queued = await queueContent._handler(ctx, {
    companyId: company._id, requestId: 'content-1', channel: 'facebook',
    contentHash: 'sha256:content', message: 'Prep-first painting proof.', scheduledAt: 3,
  });
  const publication = await recordContentResult._handler(ctx, {
    companyId: company._id, requestId: 'content-result-1', contentId: queued.contentId,
    status: 'published', occurredAt: 4, externalId: 'facebook-post-123',
  });
  const publicationReplay = await recordContentResult._handler(ctx, {
    companyId: company._id, requestId: 'content-result-1', contentId: queued.contentId,
    status: 'published', occurredAt: 4, externalId: 'facebook-post-123',
  });
  assert.deepEqual(publicationReplay, publication);
  const content = ctx.rows.get('contentQueue')[0];
  assert.equal(content.status, 'published');
  assert.equal(content.externalId, 'facebook-post-123');
  assert.equal(content.publishedAt, 4);
});
