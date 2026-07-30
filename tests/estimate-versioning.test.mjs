import assert from 'node:assert/strict';
import test from 'node:test';

import {
  approveEstimateVersion,
  estimateDetail,
  saveEstimateDraft,
} from '../convex/estimates.ts';

function createEstimateContext({ identity = null, tables = {} } = {}) {
  const rows = new Map(
    Object.entries(tables).map(([name, value]) => [
      name,
      value.map((row) => ({ ...row })),
    ])
  );
  let nextId = 0;

  function matching(table, predicates) {
    return (rows.get(table) ?? []).filter((row) =>
      predicates.every((predicate) => predicate(row))
    );
  }

  function query(table) {
    const predicates = [];
    const terminal = {
      async collect() {
        return matching(table, predicates);
      },
      async unique() {
        const found = matching(table, predicates);
        assert.ok(found.length <= 1, `expected ${table} index to be unique`);
        return found[0] ?? null;
      },
    };
    return {
      withIndex(_name, build) {
        const index = {
          eq(field, value) {
            predicates.push((row) => row[field] === value);
            return index;
          },
        };
        build(index);
        return terminal;
      },
    };
  }

  return {
    auth: {
      async getUserIdentity() {
        return identity;
      },
    },
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
        const record = {
          _id: `${table}:generated-${++nextId}`,
          _creationTime: 1_000 + nextId,
          ...value,
        };
        const tableRows = rows.get(table) ?? [];
        tableRows.push(record);
        rows.set(table, tableRows);
        return record._id;
      },
      async patch(id, value) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (!row) continue;
          Object.assign(row, value);
          return;
        }
        throw new Error(`unknown record ${id}`);
      },
    },
    rows,
  };
}

const user = {
  _id: 'users:staff',
  clerkSubject: 'user_staff',
  status: 'active',
};
const company = {
  _id: 'companies:alpha',
  name: 'Alpha Painting',
  status: 'active',
};
const membership = {
  _id: 'memberships:staff-alpha',
  userId: user._id,
  companyId: company._id,
  role: 'staff',
  status: 'active',
};
const identity = { subject: user.clerkSubject, fva: [1, 1] };
const opportunity = {
  _id: 'opportunities:alpha-one',
  companyId: company._id,
  name: 'Main office repaint',
  stage: 'qualified',
  createdAt: 100,
  updatedAt: 100,
};

function context(overrides = {}) {
  return createEstimateContext({
    identity,
    tables: {
      users: [user],
      companies: [company],
      memberships: [membership],
      opportunities: [opportunity],
      estimates: [],
      estimateVersions: [],
      idempotencyKeys: [],
      events: [],
      auditFacts: [],
      ...overrides,
    },
  });
}

function draftInput(overrides = {}) {
  return {
    companyId: company._id,
    opportunityId: opportunity._id,
    title: 'Interior repaint',
    lineItems: [
      { description: 'Surface preparation', quantity: 2, unitPriceCents: 12_500 },
      { description: 'Finish coats', quantity: 1, unitPriceCents: 8_000 },
    ],
    discountCents: 1_000,
    taxCents: 2_000,
    assumptions: ['Customer will provide clear access.'],
    requestId: 'estimate-draft-001',
    ...overrides,
  };
}

test('draft totals are calculated on the server and the write is idempotent', async () => {
  const ctx = context();
  const request = draftInput();

  const created = await saveEstimateDraft._handler(ctx, request);

  assert.deepEqual(created, {
    estimateId: 'estimates:generated-2',
    revision: 1,
    status: 'draft',
    subtotalCents: 33_000,
    totalCents: 34_000,
  });
  assert.equal(ctx.rows.get('estimates').length, 1);
  assert.equal(ctx.rows.get('events').length, 1);
  assert.equal(ctx.rows.get('auditFacts').length, 1);
  assert.equal(ctx.rows.get('idempotencyKeys')[0].status, 'completed');

  assert.deepEqual(await saveEstimateDraft._handler(ctx, request), created);
  assert.equal(ctx.rows.get('estimates').length, 1);
  assert.equal(ctx.rows.get('events').length, 1);

  await assert.rejects(
    () =>
      saveEstimateDraft._handler(ctx, {
        ...request,
        title: 'Conflicting replay',
      }),
    /conflicting request/i
  );
});

test('draft pricing accepts valid two-decimal quantities without floating-point rejection', async () => {
  const ctx = context();
  const result = await saveEstimateDraft._handler(
    ctx,
    draftInput({
      lineItems: [
        {
          description: 'Measured preparation',
          quantity: 0.29,
          unitPriceCents: 100,
        },
      ],
      discountCents: 0,
      taxCents: 0,
      requestId: 'estimate-decimal-quantity',
    })
  );
  assert.equal(result.subtotalCents, 29);
  assert.equal(result.totalCents, 29);
});

test('approved versions remain immutable while later draft revisions advance', async () => {
  const ctx = context();
  const created = await saveEstimateDraft._handler(ctx, draftInput());

  const firstApproval = await approveEstimateVersion._handler(ctx, {
    companyId: company._id,
    estimateId: created.estimateId,
    expectedRevision: 1,
    requestId: 'estimate-approve-001',
  });
  assert.equal(firstApproval.versionNumber, 1);
  assert.equal(firstApproval.totalCents, 34_000);
  const firstVersion = structuredClone(ctx.rows.get('estimateVersions')[0]);

  const revised = await saveEstimateDraft._handler(
    ctx,
    draftInput({
      estimateId: created.estimateId,
      expectedRevision: 1,
      requestId: 'estimate-draft-002',
      lineItems: [
        { description: 'Surface preparation', quantity: 2, unitPriceCents: 12_500 },
        { description: 'Finish coats', quantity: 2, unitPriceCents: 8_000 },
      ],
    })
  );
  assert.equal(revised.revision, 2);
  assert.equal(revised.status, 'draft');
  assert.equal(revised.totalCents, 42_000);
  assert.deepEqual(ctx.rows.get('estimateVersions')[0], firstVersion);

  const secondApproval = await approveEstimateVersion._handler(ctx, {
    companyId: company._id,
    estimateId: created.estimateId,
    expectedRevision: 2,
    requestId: 'estimate-approve-002',
  });
  assert.equal(secondApproval.versionNumber, 2);
  assert.equal(secondApproval.totalCents, 42_000);
  assert.equal(ctx.rows.get('estimateVersions').length, 2);
  assert.deepEqual(ctx.rows.get('estimateVersions')[0], firstVersion);
});

test('draft and approval mutations reject stale, unauthorized, and cross-tenant writes', async () => {
  const ctx = context();
  const created = await saveEstimateDraft._handler(ctx, draftInput());

  await assert.rejects(
    () =>
      saveEstimateDraft._handler(
        ctx,
        draftInput({
          estimateId: created.estimateId,
          expectedRevision: 0,
          requestId: 'stale-draft',
        })
      ),
    /revision changed/i
  );
  await assert.rejects(
    () =>
      approveEstimateVersion._handler(ctx, {
        companyId: company._id,
        estimateId: created.estimateId,
        expectedRevision: 0,
        requestId: 'stale-approval',
      }),
    /revision changed/i
  );

  const anonymous = context();
  anonymous.auth.getUserIdentity = async () => null;
  await assert.rejects(
    () => saveEstimateDraft._handler(anonymous, draftInput()),
    /authentication is required/i
  );

  const otherCompany = { ...company, _id: 'companies:other' };
  const crossTenant = context({
    companies: [company, otherCompany],
    opportunities: [opportunity],
    memberships: [
      membership,
      {
        ...membership,
        _id: 'memberships:staff-other',
        companyId: otherCompany._id,
      },
    ],
  });
  await assert.rejects(
    () =>
      saveEstimateDraft._handler(
        crossTenant,
        draftInput({
          companyId: otherCompany._id,
          requestId: 'cross-tenant',
        })
      ),
    /opportunity access is denied/i
  );
});

test('estimate detail returns tenant-scoped approved versions in descending order', async () => {
  const ctx = context({
    estimates: [
      {
        _id: 'estimates:one',
        companyId: company._id,
        opportunityId: opportunity._id,
        title: 'Interior repaint',
        status: 'approved',
        revision: 2,
        nextVersionNumber: 3,
        lineItems: [],
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
        assumptions: [],
        createdAt: 100,
        updatedAt: 200,
      },
    ],
    estimateVersions: [
      {
        _id: 'estimateVersions:one',
        companyId: company._id,
        estimateId: 'estimates:one',
        versionNumber: 1,
        status: 'approved',
        title: 'Interior repaint',
        lineItems: [],
        subtotalCents: 10_000,
        discountCents: 0,
        taxCents: 0,
        totalCents: 10_000,
        assumptions: [],
        contentHash: 'sha256:version-one',
        approvedByUserId: user._id,
        approvedAt: 150,
        requestId: 'approve-one',
      },
      {
        _id: 'estimateVersions:two',
        companyId: company._id,
        estimateId: 'estimates:one',
        versionNumber: 2,
        status: 'approved',
        title: 'Interior repaint',
        lineItems: [],
        subtotalCents: 12_000,
        discountCents: 0,
        taxCents: 0,
        totalCents: 12_000,
        assumptions: [],
        contentHash: 'sha256:version-two',
        approvedByUserId: user._id,
        approvedAt: 200,
        requestId: 'approve-two',
      },
    ],
  });

  const detail = await estimateDetail._handler(ctx, {
    estimateId: 'estimates:one',
  });
  assert.deepEqual(
    detail.versions.map((version) => version.versionNumber),
    [2, 1]
  );
  assert.equal(detail.estimate.companyId, company._id);
});

test('estimate detail does not disclose record existence before access is authorized', async () => {
  const anonymous = context({
    estimates: [
      {
        _id: 'estimates:one',
        companyId: company._id,
        opportunityId: opportunity._id,
        title: 'Interior repaint',
        status: 'draft',
        revision: 1,
        nextVersionNumber: 1,
        lineItems: [],
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
        assumptions: [],
        createdAt: 100,
        updatedAt: 100,
      },
    ],
  });
  anonymous.auth.getUserIdentity = async () => null;
  for (const estimateId of ['estimates:one', 'estimates:missing']) {
    await assert.rejects(
      () => estimateDetail._handler(anonymous, { estimateId }),
      /authentication is required/i
    );
  }

  const otherCompany = { ...company, _id: 'companies:other' };
  const crossTenant = context({
    companies: [company, otherCompany],
    estimates: [
      {
        _id: 'estimates:other',
        companyId: otherCompany._id,
        opportunityId: 'opportunities:other',
        title: 'Other estimate',
        status: 'draft',
        revision: 1,
        nextVersionNumber: 1,
        lineItems: [],
        subtotalCents: 0,
        discountCents: 0,
        taxCents: 0,
        totalCents: 0,
        assumptions: [],
        createdAt: 100,
        updatedAt: 100,
      },
    ],
  });
  for (const estimateId of ['estimates:other', 'estimates:missing']) {
    await assert.rejects(
      () => estimateDetail._handler(crossTenant, { estimateId }),
      /estimate access is denied/i
    );
  }
});
