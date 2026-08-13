import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  OPPORTUNITY_STAGE_TRANSITIONS,
  isOpportunityTransitionAllowed,
  opportunityPipeline,
  updateOpportunityStage,
} from '../convex/crm.ts';

const crmSource = readFileSync('convex/crm.ts', 'utf8');
const managePageSource = readFileSync(
  'src/app/(protected)/manage/page.tsx',
  'utf8'
);
const operatorPath = 'src/components/manage/crm-operator.tsx';
const stages = ['new', 'qualified', 'proposal', 'won', 'lost'];

function createCrmContext({ identity = null, tables = {} } = {}) {
  const rows = new Map(
    Object.entries(tables).map(([name, value]) => [
      name,
      value.map((row) => ({ ...row })),
    ])
  );
  let nextId = 0;

  function matches(table, predicates) {
    return (rows.get(table) ?? []).filter((row) =>
      predicates.every((predicate) => predicate(row))
    );
  }

  function query(table) {
    const predicates = [];
    const terminal = {
      async collect() {
        return matches(table, predicates);
      },
      async take(limit) {
        return matches(table, predicates).slice(0, limit);
      },
      async unique() {
        const found = matches(table, predicates);
        assert.ok(found.length <= 1, `expected ${table} index to be unique`);
        return found[0] ?? null;
      },
    };
    const queryBuilder = {
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
      filter(build) {
        const resolve = (value, row) =>
          typeof value === 'function' ? value(row) : value;
        const expression = {
          field(field) {
            return (row) => row[field];
          },
          eq(left, right) {
            return (row) => resolve(left, row) === resolve(right, row);
          },
          and(...parts) {
            return (row) => parts.every((part) => part(row));
          },
        };
        predicates.push(build(expression));
        return terminal;
      },
    };
    return queryBuilder;
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

const activeUser = {
  _id: 'users:staff',
  clerkSubject: 'user_staff',
  status: 'active',
};
const activeCompany = {
  _id: 'companies:alpha',
  name: 'Alpha Painting',
  status: 'active',
};
const staffMembership = {
  _id: 'memberships:staff-alpha',
  userId: activeUser._id,
  companyId: activeCompany._id,
  role: 'staff',
  status: 'active',
};
const staffIdentity = {
  subject: activeUser.clerkSubject,
  fva: [1, 1],
};

function mutationContext(overrides = {}) {
  const opportunity = {
    _id: 'opportunities:alpha-one',
    _creationTime: 100,
    companyId: activeCompany._id,
    name: 'Main office repaint',
    stage: 'new',
    value: 15_000,
    createdAt: 100,
    updatedAt: 100,
  };
  return createCrmContext({
    identity: staffIdentity,
    tables: {
      users: [activeUser],
      companies: [activeCompany],
      memberships: [staffMembership],
      opportunities: [opportunity],
      idempotencyKeys: [],
      events: [],
      auditFacts: [],
      ...overrides,
    },
  });
}

test('staff CRM pipeline enforces transitions and exposes an audited operator drawer', () => {
  assert.match(crmSource, /OPPORTUNITY_STAGE_TRANSITIONS/);
  assert.match(
    crmSource,
    /new:\s*\['qualified',\s*'lost'\][\s\S]*qualified:\s*\['proposal',\s*'lost'\][\s\S]*proposal:\s*\['won',\s*'lost'\][\s\S]*won:\s*\[\][\s\S]*lost:\s*\[\]/
  );
  assert.match(crmSource, /expectedStage:\s*opportunityStage/);
  assert.match(crmSource, /nextStage:\s*opportunityStage/);
  assert.match(crmSource, /requestId:\s*v\.string\(\)/);
  assert.match(crmSource, /opportunity\.stage\s*!==\s*args\.expectedStage/);
  assert.match(crmSource, /isOpportunityTransitionAllowed/);
  assert.match(crmSource, /args\.expectedStage\s*===\s*args\.nextStage/);
  assert.match(crmSource, /Terminal opportunity stages cannot transition/);
  assert.match(crmSource, /claimIdempotencyKey/);
  assert.match(crmSource, /completeIdempotencyKey/);
  assert.match(crmSource, /appendDomainEvent/);
  assert.match(crmSource, /appendAuditFact/);
  assert.match(crmSource, /expectedStage:\s*args\.expectedStage/);
  assert.match(crmSource, /nextStage:\s*args\.nextStage/);
  assert.match(crmSource, /won:\s*null/);
  assert.match(crmSource, /lost:\s*null/);

  assert.match(crmSource, /export const opportunityPipeline = query/);
  assert.match(crmSource, /roles:\s*\['staff',\s*'admin'\]/);
  assert.match(
    crmSource,
    /\.withIndex\('by_company_stage',[\s\S]*q\.eq\('companyId', args\.companyId\)/
  );
  assert.match(crmSource, /\.query\('events'\)/);
  assert.match(crmSource, /\.query\('auditFacts'\)/);
  assert.match(crmSource, /nextActionForStage/);
  assert.match(crmSource, /actorUserId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(crmSource, /requestId:\s*v\.optional\(v\.string\(\)\)/);
  assert.match(
    crmSource,
    /left\.occurredAt - right\.occurredAt[\s\S]*left\.id\.localeCompare\(right\.id\)/
  );
  assert.match(crmSource, /timeline/);

  const staleCheck = crmSource.indexOf(
    'opportunity.stage !== args.expectedStage'
  );
  const noOpCheck = crmSource.indexOf('args.expectedStage === args.nextStage');
  const terminalCheck = crmSource.indexOf(
    'OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage].length === 0'
  );
  const transitionCheck = crmSource.lastIndexOf(
    '!isOpportunityTransitionAllowed'
  );
  const firstWrite = crmSource.indexOf(
    'const claim = await claimIdempotencyKey'
  );
  const opportunityWrite = crmSource.indexOf(
    'await ctx.db.patch(args.opportunityId'
  );
  const domainEventWrite = crmSource.indexOf(
    'await appendDomainEvent(eventContext'
  );
  const auditWrite = crmSource.indexOf('await appendAuditFact(ctx');
  const completionWrite = crmSource.indexOf(
    'await completeIdempotencyKey(eventContext'
  );
  assert.ok(
    staleCheck < noOpCheck &&
      noOpCheck < terminalCheck &&
      terminalCheck < transitionCheck &&
      transitionCheck < firstWrite &&
      firstWrite < opportunityWrite &&
      opportunityWrite < domainEventWrite &&
      domainEventWrite < auditWrite &&
      auditWrite < completionWrite
  );

  assert.match(
    managePageSource,
    /import CrmOperator from ['"]\.\.\/\.\.\/\.\.\/components\/manage\/crm-operator['"]/
  );
  assert.match(managePageSource, /<CrmOperator/);
  assert.equal(existsSync(operatorPath), true);

  const operatorSource = readFileSync(operatorPath, 'utf8');
  assert.match(operatorSource, /useQuery\(\s*api\.crm\.opportunityPipeline/);
  assert.match(
    operatorSource,
    /useMutation\(\s*api\.crm\.updateOpportunityStage/
  );
  assert.match(operatorSource, /MotionConfig reducedMotion="user"/);
  assert.match(operatorSource, /Next action/i);
  assert.match(operatorSource, /No next action/);
  assert.match(operatorSource, /Timeline/i);
  assert.match(operatorSource, /Actor \{entry\.actorUserId\}/);
  assert.match(operatorSource, /Request \{entry\.requestId\}/);
  assert.match(operatorSource, /role="status"/);
  assert.match(operatorSource, /role="alert"/);
  assert.match(operatorSource, /\.showModal\(\)/);
  assert.match(operatorSource, /onCancel=/);
  assert.match(operatorSource, /triggerRefs/);
  assert.match(operatorSource, /pipelineTitleRef/);
  assert.match(operatorSource, /aria-busy=/);
  assert.match(operatorSource, /aria-live="polite"/);
  assert.match(operatorSource, /aria-label="Close opportunity details"/);
  assert.match(managePageSource, /CRM temporarily unavailable/);
  assert.match(managePageSource, /CRM access denied/);
  assert.match(
    managePageSource,
    /An active staff or admin membership is required\./
  );
  assert.match(managePageSource, /\bRetry\b/);
});

test('opportunity transition table is exhaustive and terminal stages stay closed', () => {
  const expected = {
    new: ['qualified', 'lost'],
    qualified: ['proposal', 'lost'],
    proposal: ['won', 'lost'],
    won: [],
    lost: [],
  };
  assert.deepEqual(OPPORTUNITY_STAGE_TRANSITIONS, expected);
  for (const from of stages) {
    for (const to of stages) {
      assert.equal(
        isOpportunityTransitionAllowed(from, to),
        expected[from].includes(to),
        `${from} -> ${to}`
      );
    }
  }
});

test('stage mutation is authorized, stale-safe, idempotent, and audit-bound', async () => {
  const context = mutationContext();
  const request = {
    companyId: activeCompany._id,
    opportunityId: 'opportunities:alpha-one',
    expectedStage: 'new',
    nextStage: 'qualified',
    requestId: 'request-stage-001',
  };

  await updateOpportunityStage._handler(context, request);
  assert.equal(context.rows.get('opportunities')[0].stage, 'qualified');
  assert.equal(context.rows.get('events').length, 1);
  assert.equal(context.rows.get('auditFacts').length, 1);
  assert.equal(context.rows.get('idempotencyKeys').length, 1);
  assert.equal(context.rows.get('idempotencyKeys')[0].status, 'completed');
  assert.deepEqual(
    context.rows.get('events')[0].payload,
    {
      actorUserId: activeUser._id,
      requestId: request.requestId,
      expectedStage: 'new',
      nextStage: 'qualified',
    }
  );
  assert.deepEqual(
    {
      companyId: context.rows.get('auditFacts')[0].companyId,
      actorUserId: context.rows.get('auditFacts')[0].actorUserId,
      actorClerkSubject:
        context.rows.get('auditFacts')[0].actorClerkSubject,
      requestId: context.rows.get('auditFacts')[0].requestId,
      metadata: context.rows.get('auditFacts')[0].metadata,
    },
    {
      companyId: activeCompany._id,
      actorUserId: activeUser._id,
      actorClerkSubject: activeUser.clerkSubject,
      requestId: request.requestId,
      metadata: { expectedStage: 'new', nextStage: 'qualified' },
    }
  );

  await updateOpportunityStage._handler(context, request);
  assert.equal(context.rows.get('events').length, 1);
  assert.equal(context.rows.get('auditFacts').length, 1);
  assert.equal(context.rows.get('idempotencyKeys').length, 1);

  await assert.rejects(
    () =>
      updateOpportunityStage._handler(context, {
        ...request,
        nextStage: 'lost',
      }),
    /conflicting request/i
  );
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(context, {
        ...request,
        requestId: 'request-stage-002',
      }),
    /stage changed/i
  );
  assert.equal(context.rows.get('idempotencyKeys').length, 1);
});

test('stage mutation rejects invalid, terminal, unauthorized, and cross-tenant writes', async () => {
  const invalid = mutationContext();
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(invalid, {
        companyId: activeCompany._id,
        opportunityId: 'opportunities:alpha-one',
        expectedStage: 'new',
        nextStage: 'won',
        requestId: 'invalid-jump',
      }),
    /cannot move/i
  );
  assert.equal(invalid.rows.get('idempotencyKeys').length, 0);

  const terminal = mutationContext({
    opportunities: [
      {
        _id: 'opportunities:alpha-one',
        _creationTime: 100,
        companyId: activeCompany._id,
        stage: 'won',
        updatedAt: 100,
      },
    ],
  });
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(terminal, {
        companyId: activeCompany._id,
        opportunityId: 'opportunities:alpha-one',
        expectedStage: 'won',
        nextStage: 'lost',
        requestId: 'terminal-jump',
      }),
    /terminal/i
  );

  const anonymous = mutationContext();
  anonymous.auth.getUserIdentity = async () => null;
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(anonymous, {
        companyId: activeCompany._id,
        opportunityId: 'opportunities:alpha-one',
        expectedStage: 'new',
        nextStage: 'qualified',
        requestId: 'anonymous',
      }),
    /authentication/i
  );

  const customer = mutationContext({
    memberships: [{ ...staffMembership, role: 'customer' }],
  });
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(customer, {
        companyId: activeCompany._id,
        opportunityId: 'opportunities:alpha-one',
        expectedStage: 'new',
        nextStage: 'qualified',
        requestId: 'customer',
      }),
    /role/i
  );

  const otherCompany = {
    _id: 'companies:bravo',
    name: 'Bravo Painting',
    status: 'active',
  };
  const crossTenant = mutationContext({
    companies: [activeCompany, otherCompany],
    opportunities: [
      {
        _id: 'opportunities:bravo-one',
        _creationTime: 100,
        companyId: otherCompany._id,
        stage: 'new',
        updatedAt: 100,
      },
    ],
  });
  await assert.rejects(
    () =>
      updateOpportunityStage._handler(crossTenant, {
        companyId: activeCompany._id,
        opportunityId: 'opportunities:bravo-one',
        expectedStage: 'new',
        nextStage: 'qualified',
        requestId: 'cross-tenant',
      }),
    /access is denied/i
  );
});

test('pipeline merges legacy audits with canonical events in stable chronological order', async () => {
  const opportunity = {
    _id: 'opportunities:alpha-one',
    _creationTime: 5,
    companyId: activeCompany._id,
    stage: 'proposal',
    updatedAt: 30,
  };
  const context = createCrmContext({
    identity: staffIdentity,
    tables: {
      users: [activeUser],
      companies: [activeCompany],
      memberships: [staffMembership],
      opportunities: [
        opportunity,
        {
          _id: 'opportunities:bravo-hidden',
          _creationTime: 1,
          companyId: 'companies:bravo',
          stage: 'new',
          updatedAt: 1,
        },
      ],
      events: [
        {
          _id: 'events:proposal',
          eventId: 'evt-proposal',
          companyId: activeCompany._id,
          type: 'opportunity.stage_updated',
          aggregateType: 'opportunity',
          aggregateId: opportunity._id,
          payload: {
            actorUserId: activeUser._id,
            requestId: 'proposal-request',
            expectedStage: 'qualified',
            nextStage: 'proposal',
          },
          requestHash: 'sha256:event',
          occurredAt: 20,
        },
      ],
      auditFacts: [
        {
          _id: 'auditFacts:legacy',
          companyId: activeCompany._id,
          actorUserId: activeUser._id,
          action: 'opportunity.stage_updated',
          entityType: 'opportunity',
          entityId: opportunity._id,
          requestId: 'legacy-request',
          metadata: { stage: 'qualified' },
          occurredAt: 10,
        },
        {
          _id: 'auditFacts:created',
          companyId: activeCompany._id,
          actorUserId: activeUser._id,
          action: 'opportunity.created',
          entityType: 'opportunity',
          entityId: opportunity._id,
          occurredAt: 5,
        },
        {
          _id: 'auditFacts:proposal-duplicate',
          companyId: activeCompany._id,
          actorUserId: activeUser._id,
          action: 'opportunity.stage_updated',
          entityType: 'opportunity',
          entityId: opportunity._id,
          requestId: 'proposal-request',
          metadata: {
            expectedStage: 'qualified',
            nextStage: 'proposal',
          },
          occurredAt: 20,
        },
      ],
    },
  });

  const result = await opportunityPipeline._handler(context, {
    companyId: activeCompany._id,
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, opportunity._id);
  assert.deepEqual(
    result[0].timeline.map((entry) => entry.occurredAt),
    [5, 10, 20]
  );
  assert.equal(
    result[0].timeline.filter(
      (entry) => entry.action === 'opportunity.created'
    ).length,
    1
  );
  assert.equal(
    result[0].timeline.filter(
      (entry) => entry.requestId === 'proposal-request'
    ).length,
    1
  );
  assert.equal(result[0].timeline.at(-1).toStage, 'proposal');
  assert.equal(result[0].timeline.at(-1).actorUserId, activeUser._id);
  assert.equal(result[0].nextAction, 'Record the customer decision');
});
