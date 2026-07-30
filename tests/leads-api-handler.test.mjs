import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { POST } from '../src/app/api/leads/route.ts';
import {
  acknowledgeLead,
  assignLead,
  escalateDueAssignment,
  slaQueue,
} from '../convex/leadAssignments.ts';
import http from 'node:http';

function createLeadAssignmentContext({
  assignments = [],
  identity = { subject: 'user_operator', fva: [1, 1] },
} = {}) {
  const rows = new Map([
    ['users', [
      {
        _id: 'users:operator',
        clerkSubject: 'user_operator',
        status: 'active',
      },
      {
        _id: 'users:staff-b',
        clerkSubject: 'user_staff_b',
        status: 'active',
      },
      {
        _id: 'users:disabled',
        clerkSubject: 'user_disabled',
        status: 'disabled',
      },
    ]],
    ['companies', [
      {
        _id: 'companies:alpha',
        name: 'Alpha Painting',
        status: 'active',
      },
    ]],
    ['memberships', [
      {
        _id: 'memberships:operator',
        userId: 'users:operator',
        companyId: 'companies:alpha',
        role: 'admin',
        status: 'active',
      },
      {
        _id: 'memberships:staff-b',
        userId: 'users:staff-b',
        companyId: 'companies:alpha',
        role: 'staff',
        status: 'active',
      },
      {
        _id: 'memberships:disabled',
        userId: 'users:disabled',
        companyId: 'companies:alpha',
        role: 'staff',
        status: 'active',
      },
    ]],
    ['leads', [
      {
        _id: 'leads:203',
        companyId: 'companies:alpha',
        source: 'website',
        status: 'new',
        submittedAt: 500,
        updatedAt: 500,
      },
    ]],
    ['leadAssignments', assignments.map((row) => ({ ...row }))],
    ['idempotencyKeys', []],
    ['events', []],
    ['auditFacts', []],
  ]);
  const scheduled = [];
  let nextId = 0;

  function query(table) {
    const predicates = [];
    const matches = () =>
      (rows.get(table) ?? []).filter((row) =>
        predicates.every((predicate) => predicate(row))
      );
    const terminal = {
      async unique() {
        const found = matches();
        assert.ok(found.length <= 1, `${table} query must be unique`);
        return found[0] ?? null;
      },
      async collect() {
        return matches();
      },
      async take(limit) {
        return matches().slice(0, limit);
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
        const row = {
          _id: `${table}:generated-${++nextId}`,
          _creationTime: 1_000 + nextId,
          ...value,
        };
        const tableRows = rows.get(table) ?? [];
        tableRows.push(row);
        rows.set(table, tableRows);
        return row._id;
      },
      async patch(id, value) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (!row) continue;
          Object.assign(row, value);
          return;
        }
        throw new Error(`unknown row ${id}`);
      },
    },
    scheduler: {
      async runAfter(delayMs, reference, args) {
        scheduled.push({ delayMs, reference, args });
      },
    },
    rows,
    scheduled,
  };
}

async function withMockWebhookServer(handler) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}/webhook`;
      
      try {
        await handler(url);
        server.close(resolve);
      } catch (err) {
        server.close(() => reject(err));
      }
    });
  });
}

describe('api/leads Route Handler', () => {
  test('fails closed before webhook delivery when canonical persistence is unavailable', async () => {
    await withMockWebhookServer(async (webhookUrl) => {
      process.env.LEAD_WEBHOOK_URL = webhookUrl;
      process.env.RESEND_API_KEY = '';
      process.env.HUBSPOT_ACCESS_TOKEN = '';
      process.env.HUBSPOT_FORM_ID = '';
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      const req = new Request('http://localhost/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test-Challenger-Agent',
          'X-Forwarded-For': '127.0.0.1',
        },
        body: JSON.stringify({
          name: 'Empirical Challenger',
          phone: '651-555-9999',
          email: 'challenger@example.com',
          city: 'Woodbury',
          market: 'Residential',
          projectType: 'Interior',
          timeline: 'ASAP',
          contactMethod: 'Phone',
          notes: 'This is a verification test',
        }),
      });

      const response = await POST(req);
      assert.equal(response.status, 503);
      
      const body = await response.json();
      assert.match(body.error, /could not safely save/i);
    });
  });

  test('returns 400 when missing required fields', async () => {
    process.env.LEAD_WEBHOOK_URL = 'http://localhost/webhook';
    process.env.RESEND_API_KEY = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Missing fields lead',
        email: 'missing@example.com',
      }),
    });

    const response = await POST(req);
    assert.equal(response.status, 400);
    
    const body = await response.json();
    assert.match(body.error, /Missing required fields/);
  });

  test('returns 400 for invalid email', async () => {
    process.env.LEAD_WEBHOOK_URL = 'http://localhost/webhook';
    process.env.RESEND_API_KEY = '';
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email Lead',
        phone: '651-555-1234',
        email: 'not-an-email',
        city: 'Woodbury',
        market: 'Residential',
        projectType: 'Interior',
        timeline: 'ASAP',
        contactMethod: 'Phone',
        notes: 'Testing email validation',
      }),
    });

    const response = await POST(req);
    assert.equal(response.status, 400);
    
    const body = await response.json();
    assert.equal(body.error, 'Enter a valid email address.');
  });
});

describe('governed lead assignment lifecycle', () => {
  test('persists one deterministic assignment and one durable SLA check across retries', async (t) => {
    t.mock.method(Date, 'now', () => 1_000);
    const context = createLeadAssignmentContext();
    const command = {
      companyId: 'companies:alpha',
      leadId: 'leads:203',
      requestId: 'assign:lead-203',
      firstResponseSlaMinutes: 5,
    };

    const created = await assignLead._handler(context, command);
    const replay = await assignLead._handler(context, command);

    assert.deepEqual(replay, created);
    assert.equal(context.rows.get('leadAssignments').length, 1);
    assert.equal(context.rows.get('events').length, 1);
    assert.equal(context.rows.get('auditFacts').length, 1);
    assert.equal(context.scheduled.length, 1);
    assert.equal(created.firstResponseDueAt, 301_000);
    assert.match(created.assigneeUserId, /^users:(operator|staff-b)$/);
    assert.equal(context.scheduled[0].delayMs, 300_000);
    assert.deepEqual(context.scheduled[0].args, {
      assignmentId: created.assignmentId,
      expectedDueAt: 301_000,
    });
  });

  test('escalates exactly once at the SLA boundary and exposes an operator-visible reason', async (t) => {
    t.mock.method(Date, 'now', () => 10_000);
    const context = createLeadAssignmentContext({
      assignments: [
        {
          _id: 'leadAssignments:203',
          companyId: 'companies:alpha',
          leadId: 'leads:203',
          assigneeUserId: 'users:staff-b',
          status: 'assigned',
          escalationStatus: 'none',
          routingVersion: 'stable-hash-v1',
          routingReason: 'Deterministic stable-hash routing.',
          assignedAt: 5_000,
          firstResponseDueAt: 10_000,
          requestId: 'assign:lead-203',
          updatedAt: 5_000,
        },
      ],
    });
    const command = {
      assignmentId: 'leadAssignments:203',
      expectedDueAt: 10_000,
    };

    const first = await escalateDueAssignment._handler(context, command);
    const replay = await escalateDueAssignment._handler(context, command);
    const queue = await slaQueue._handler(context, {
      companyId: 'companies:alpha',
      asOf: 10_000,
    });

    assert.deepEqual(first, {
      status: 'escalated',
      escalated: true,
      escalatedAt: 10_000,
    });
    assert.deepEqual(replay, {
      status: 'escalated',
      escalated: false,
      escalatedAt: 10_000,
    });
    assert.equal(context.rows.get('events').length, 1);
    assert.equal(context.rows.get('auditFacts').length, 1);
    assert.equal(queue.length, 1);
    assert.equal(queue[0].slaStatus, 'escalated');
    assert.equal(
      queue[0].operatorLabel,
      'SLA breached — immediate follow-up required'
    );
  });

  test('acknowledgement is idempotent and prevents a later SLA escalation', async (t) => {
    let clock = 9_000;
    t.mock.method(Date, 'now', () => clock);
    const context = createLeadAssignmentContext({
      assignments: [
        {
          _id: 'leadAssignments:203',
          companyId: 'companies:alpha',
          leadId: 'leads:203',
          assigneeUserId: 'users:staff-b',
          status: 'assigned',
          escalationStatus: 'none',
          routingVersion: 'stable-hash-v1',
          routingReason: 'Deterministic stable-hash routing.',
          assignedAt: 5_000,
          firstResponseDueAt: 10_000,
          requestId: 'assign:lead-203',
          updatedAt: 5_000,
        },
      ],
    });
    const acknowledgement = {
      companyId: 'companies:alpha',
      assignmentId: 'leadAssignments:203',
      requestId: 'ack:lead-203',
    };

    const first = await acknowledgeLead._handler(context, acknowledgement);
    const replay = await acknowledgeLead._handler(context, acknowledgement);
    clock = 10_000;
    const escalation = await escalateDueAssignment._handler(context, {
      assignmentId: 'leadAssignments:203',
      expectedDueAt: 10_000,
    });
    const queue = await slaQueue._handler(context, {
      companyId: 'companies:alpha',
      asOf: clock,
    });

    assert.deepEqual(replay, first);
    assert.deepEqual(first, {
      assignmentId: 'leadAssignments:203',
      status: 'acknowledged',
      firstResponseAt: 9_000,
    });
    assert.deepEqual(escalation, {
      status: 'met',
      escalated: false,
    });
    assert.equal(context.rows.get('events').length, 1);
    assert.equal(context.rows.get('auditFacts').length, 1);
    assert.equal(queue.length, 0);
  });

  test('deadline acknowledgement is race-stable and leaves no active escalation', async (t) => {
    t.mock.method(Date, 'now', () => 10_000);
    const deadlineContext = () =>
      createLeadAssignmentContext({
        assignments: [
          {
            _id: 'leadAssignments:deadline',
            companyId: 'companies:alpha',
            leadId: 'leads:203',
            assigneeUserId: 'users:staff-b',
            status: 'assigned',
            escalationStatus: 'none',
            routingVersion: 'stable-hash-v1',
            routingReason: 'Deterministic stable-hash routing.',
            assignedAt: 5_000,
            firstResponseDueAt: 10_000,
            requestId: 'assign:lead-deadline',
            updatedAt: 5_000,
          },
        ],
      });
    const acknowledgement = {
      companyId: 'companies:alpha',
      assignmentId: 'leadAssignments:deadline',
      requestId: 'ack:lead-deadline',
    };
    const scheduled = {
      assignmentId: 'leadAssignments:deadline',
      expectedDueAt: 10_000,
    };
    const acknowledgementFirst = deadlineContext();
    const schedulerFirst = deadlineContext();

    await acknowledgeLead._handler(acknowledgementFirst, acknowledgement);
    const acknowledgementFirstEscalation =
      await escalateDueAssignment._handler(acknowledgementFirst, scheduled);
    await escalateDueAssignment._handler(schedulerFirst, scheduled);
    await acknowledgeLead._handler(schedulerFirst, acknowledgement);

    for (const context of [acknowledgementFirst, schedulerFirst]) {
      assert.equal(
        context.rows.get('leadAssignments')[0].escalationStatus,
        'resolved'
      );
      assert.deepEqual(
        context.rows.get('events').map((event) => ({
          eventId: event.eventId,
          type: event.type,
          payload: event.payload,
          occurredAt: event.occurredAt,
        })),
        acknowledgementFirst.rows.get('events').map((event) => ({
          eventId: event.eventId,
          type: event.type,
          payload: event.payload,
          occurredAt: event.occurredAt,
        }))
      );
      assert.deepEqual(
        context.rows.get('auditFacts').map((fact) => ({
          action: fact.action,
          requestId: fact.requestId,
          metadata: fact.metadata,
          occurredAt: fact.occurredAt,
        })),
        acknowledgementFirst.rows.get('auditFacts').map((fact) => ({
          action: fact.action,
          requestId: fact.requestId,
          metadata: fact.metadata,
          occurredAt: fact.occurredAt,
        }))
      );
    }
    assert.deepEqual(acknowledgementFirstEscalation, {
      status: 'breached',
      escalated: false,
    });
  });

  test('active SLA queue cannot be crowded out by historical assignments', async () => {
    const context = createLeadAssignmentContext({
      assignments: [
        ...Array.from({ length: 205 }, (_, index) => ({
          _id: `leadAssignments:history-${index}`,
          companyId: 'companies:alpha',
          leadId: 'leads:203',
          assigneeUserId: 'users:staff-b',
          status: 'acknowledged',
          escalationStatus: 'resolved',
          routingVersion: 'stable-hash-v1',
          routingReason: 'Deterministic stable-hash routing.',
          assignedAt: index,
          firstResponseDueAt: index + 1,
          firstResponseAt: index,
          requestId: `assign:history-${index}`,
          updatedAt: index,
        })),
        {
          _id: 'leadAssignments:active',
          companyId: 'companies:alpha',
          leadId: 'leads:203',
          assigneeUserId: 'users:staff-b',
          status: 'assigned',
          escalationStatus: 'escalated',
          routingVersion: 'stable-hash-v1',
          routingReason: 'Deterministic stable-hash routing.',
          assignedAt: 500,
          firstResponseDueAt: 1_000,
          escalatedAt: 1_000,
          requestId: 'assign:active',
          updatedAt: 1_000,
        },
      ],
    });
    const queue = await slaQueue._handler(context, {
      companyId: 'companies:alpha',
      asOf: 2_000,
    });

    assert.equal(queue.length, 1);
    assert.equal(queue[0].assignmentId, 'leadAssignments:active');
    assert.equal(queue[0].slaStatus, 'escalated');
  });
});
