import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthorizationError,
  requireActiveUser,
  requireCompanyMembership,
  requireProjectGrant,
} from '../convex/lib/authz.ts';
import {
  appendDomainEvent,
  claimIdempotencyKey,
  claimWebhookProcessing,
  completeIdempotencyKey,
  completeWebhookProcessing,
  EventIntegrityError,
  recordWebhookReceipt,
} from '../convex/lib/events.ts';
import { appendAuditFact } from '../convex/lib/audit.ts';

function createContext({ identity = null, tables = {} } = {}) {
  const rows = new Map(Object.entries(tables).map(([name, value]) => [name, [...value]]));
  let nextId = 0;

  return {
    auth: { async getUserIdentity() { return identity; } },
    db: {
      query(table) {
        return {
          withIndex(_name, build) {
            const predicates = [];
            build({
              eq(field, value) {
                predicates.push((row) => row[field] === value);
                return this;
              },
            });
            const matches = () => (rows.get(table) ?? []).filter((row) => predicates.every((predicate) => predicate(row)));
            return {
              async unique() {
                const found = matches();
                assert.ok(found.length <= 1, `expected ${table} index to be unique`);
                return found[0] ?? null;
              },
            };
          },
        };
      },
      async get(id) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (row) return row;
        }
        return null;
      },
      async insert(table, value) {
        const record = { _id: `${table}:${++nextId}`, ...value };
        const tableRows = rows.get(table) ?? [];
        tableRows.push(record);
        rows.set(table, tableRows);
        return record._id;
      },
      async patch(id, value) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (row) {
            for (const [key, patchValue] of Object.entries(value)) {
              if (patchValue === undefined) delete row[key];
              else row[key] = patchValue;
            }
            return;
          }
        }
        throw new Error(`unknown record ${id}`);
      },
    },
    rows,
  };
}

const activeUser = { _id: 'users:alex', clerkSubject: 'user_clerk_alex', status: 'active' };
const activeCompany = { _id: 'companies:a', status: 'active' };
const staffMembership = { _id: 'membership:one', userId: activeUser._id, companyId: activeCompany._id, role: 'staff', status: 'active' };
const staffSession = { subject: activeUser.clerkSubject, fva: [1, 1] };

test('authorization denies anonymous callers and never derives identity from email', async () => {
  await assert.rejects(() => requireActiveUser(createContext()), AuthorizationError);
  await assert.rejects(
    () => requireActiveUser(createContext({ identity: { email: 'alex@example.test' }, tables: { users: [activeUser] } })),
    AuthorizationError,
  );
});

test('authorization denies disabled users and mismatched durable Clerk subjects', async () => {
  await assert.rejects(
    () => requireActiveUser(createContext({ identity: { subject: activeUser.clerkSubject }, tables: { users: [{ ...activeUser, status: 'disabled' }] } })),
    /disabled/i,
  );
  await assert.rejects(
    () => requireActiveUser(createContext({ identity: { subject: 'user_other' }, tables: { users: [activeUser] } })),
    AuthorizationError,
  );
});

test('staff MFA derives from the current Clerk session, not a historical user field', async () => {
  const baseline = { users: [activeUser], companies: [activeCompany], memberships: [staffMembership] };
  const allowed = await requireCompanyMembership(createContext({ identity: staffSession, tables: baseline }), { companyId: activeCompany._id });
  assert.equal(allowed.user._id, activeUser._id);

  await assert.rejects(
    () => requireCompanyMembership(createContext({ identity: { subject: activeUser.clerkSubject, fva: [1, -1] }, tables: baseline }), { companyId: activeCompany._id }),
    /MFA/i,
  );
  await assert.rejects(
    () => requireCompanyMembership(createContext({ identity: { subject: activeUser.clerkSubject, fva: [1, 11] }, tables: baseline }), { companyId: activeCompany._id }),
    /MFA/i,
  );
});

test('company and project access are active, tenant-bound, and explicit-grant-only', async () => {
  const tables = {
    users: [activeUser], companies: [activeCompany],
    memberships: [{ ...staffMembership, role: 'customer' }],
    projects: [{ _id: 'projects:one', companyId: activeCompany._id, status: 'active' }],
    resourceGrants: [{ _id: 'grant:other', userId: activeUser._id, companyId: activeCompany._id, resourceType: 'project', resourceId: 'projects:other', status: 'active', permissions: ['project:read'] }],
  };
  const denied = createContext({ identity: staffSession, tables });
  await assert.rejects(() => requireCompanyMembership(denied, { companyId: 'companies:b' }), AuthorizationError);
  await assert.rejects(() => requireProjectGrant(denied, { projectId: 'projects:one', permission: 'project:read' }), AuthorizationError);

  tables.resourceGrants.push({ _id: 'grant:one', userId: activeUser._id, companyId: activeCompany._id, resourceType: 'project', resourceId: 'projects:one', status: 'active', permissions: ['project:read'] });
  const allowed = await requireProjectGrant(createContext({ identity: staffSession, tables }), { projectId: 'projects:one', permission: 'project:read' });
  assert.equal(allowed.project._id, 'projects:one');

  const wrongPermission = createContext({
    identity: staffSession,
    tables: { ...tables, resourceGrants: [{ ...tables.resourceGrants.at(-1), permissions: ['project:write'] }] },
  });
  await assert.rejects(() => requireProjectGrant(wrongPermission, { projectId: 'projects:one', permission: 'project:read' }), AuthorizationError);

  const crossCompanyGrant = createContext({
    identity: staffSession,
    tables: { ...tables, resourceGrants: [{ ...tables.resourceGrants.at(-1), companyId: 'companies:b' }] },
  });
  await assert.rejects(() => requireProjectGrant(crossCompanyGrant, { projectId: 'projects:one', permission: 'project:read' }), AuthorizationError);

  const archivedCompany = createContext({ identity: staffSession, tables: { ...tables, companies: [{ ...activeCompany, status: 'archived' }] } });
  await assert.rejects(() => requireCompanyMembership(archivedCompany, { companyId: activeCompany._id }), /company/i);
  const completedProject = createContext({ identity: staffSession, tables: { ...tables, projects: [{ _id: 'projects:one', companyId: activeCompany._id, status: 'complete' }] } });
  await assert.rejects(() => requireProjectGrant(completedProject, { projectId: 'projects:one', permission: 'project:read' }), /Project/i);
});

test('events and idempotency keys reject conflicting duplicates and replay completed stable results', async () => {
  const context = createContext();
  const event = { eventId: 'evt_001', companyId: activeCompany._id, type: 'lead.created', aggregateType: 'lead', aggregateId: 'leads:one', payload: { leadId: 'leads:one', source: { campaign: 'summer', medium: 'web' } }, occurredAt: 10 };
  assert.equal((await appendDomainEvent(context, event)).created, true);
  assert.equal((await appendDomainEvent(context, { ...event, payload: { source: { medium: 'web', campaign: 'summer' }, leadId: 'leads:one' } })).created, false);
  await assert.rejects(() => appendDomainEvent(context, { ...event, occurredAt: 11 }), EventIntegrityError);
  await assert.rejects(() => appendDomainEvent(context, { ...event, payload: { leadId: 'leads:two' } }), EventIntegrityError);

  const claim = { scope: 'lead.submit', key: 'request-001', companyId: activeCompany._id, aggregateType: 'lead', aggregateId: 'leads:one', request: { form: { name: 'Alex', market: 'commercial' } }, requestedAt: 20 };
  assert.equal((await claimIdempotencyKey(context, claim)).claimed, true);
  assert.equal((await claimIdempotencyKey(context, { ...claim, request: { form: { market: 'commercial', name: 'Alex' } }, requestedAt: 21 })).claimed, false);
  await assert.rejects(() => claimIdempotencyKey(context, { ...claim, aggregateId: 'leads:two' }), EventIntegrityError);
  await assert.rejects(() => claimIdempotencyKey(context, { ...claim, request: { form: { name: 'Taylor' } } }), EventIntegrityError);

  const completion = await completeIdempotencyKey(context, { ...claim, result: { leadId: 'leads:one' }, completedAt: 22 });
  assert.match(completion.resultHash, /^sha256:[a-f0-9]{64}$/);
  const replay = await claimIdempotencyKey(context, { ...claim, requestedAt: 23 });
  assert.deepEqual(replay.result, { leadId: 'leads:one' });
  assert.equal(replay.resultHash, completion.resultHash);
  assert.equal(context.rows.get('events').length, 1);
  assert.equal(context.rows.get('idempotencyKeys').length, 1);
});

test('webhook receipts lease processing, recover after a crash, retry failures, and reject hash conflicts', async () => {
  const context = createContext();
  const receipt = { provider: 'clerk', eventId: 'clerk_evt_1', payloadHash: 'sha256:one', receivedAt: 30 };
  assert.equal((await recordWebhookReceipt(context, receipt)).received, true);
  const firstLease = await claimWebhookProcessing(context, { ...receipt, leaseToken: 'lease-1', now: 40, leaseDurationMs: 100 });
  assert.equal(firstLease.claimed, true);
  assert.equal((await claimWebhookProcessing(context, { ...receipt, leaseToken: 'lease-2', now: 41, leaseDurationMs: 100 })).claimed, false);
  const recoveredLease = await claimWebhookProcessing(context, { ...receipt, leaseToken: 'lease-2', now: 141, leaseDurationMs: 100 });
  assert.equal(recoveredLease.claimed, true);
  await completeWebhookProcessing(context, { provider: receipt.provider, eventId: receipt.eventId, leaseToken: 'lease-2', now: 142, outcome: 'failed', error: 'temporary upstream error' });
  const retryLease = await claimWebhookProcessing(context, { ...receipt, leaseToken: 'lease-3', now: 143, leaseDurationMs: 100 });
  assert.equal(retryLease.claimed, true);
  await completeWebhookProcessing(context, { provider: receipt.provider, eventId: receipt.eventId, leaseToken: 'lease-3', now: 144, outcome: 'succeeded' });
  assert.equal((await claimWebhookProcessing(context, { ...receipt, leaseToken: 'lease-4', now: 145, leaseDurationMs: 100 })).state, 'succeeded');
  await assert.rejects(() => recordWebhookReceipt(context, { ...receipt, payloadHash: 'sha256:conflict', receivedAt: 146 }), EventIntegrityError);
});

test('audit facts bind actor and company from an authorized access result', async () => {
  const context = createContext({ identity: staffSession, tables: { users: [activeUser], companies: [activeCompany], memberships: [staffMembership] } });
  const access = await requireCompanyMembership(context, { companyId: activeCompany._id });
  const auditId = await appendAuditFact(context, access, { action: 'project.viewed', entityType: 'project', entityId: 'projects:one', occurredAt: 40 });
  const fact = context.rows.get('auditFacts')[0];
  assert.deepEqual(fact, { _id: auditId, companyId: activeCompany._id, actorUserId: activeUser._id, actorClerkSubject: activeUser.clerkSubject, action: 'project.viewed', entityType: 'project', entityId: 'projects:one', occurredAt: 40 });
});
