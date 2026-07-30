import assert from 'node:assert/strict';
import test from 'node:test';
import { ConvexError } from 'convex/values';

import * as appointmentFunctions from '../convex/appointments.ts';
import { hashCanonicalContent } from '../convex/lib/events.ts';

const companyId = 'companies:1';
const jobId = 'calReconciliationJobs:1';

function registeredFunction(name) {
  const registered = appointmentFunctions[name];
  assert.equal(typeof registered, 'function', `${name} must be registered`);
  assert.equal(
    typeof registered._handler,
    'function',
    `${name} must expose the registered handler boundary`,
  );
  return registered;
}

function calAppointment(overrides = {}) {
  return {
    triggerEvent: 'BOOKING_CREATED',
    providerOccurredAt: 100,
    providerOrganizationId: 'org-1',
    providerBookingUid: 'booking-a',
    providerBookingId: '100',
    providerEventTypeId: '50',
    title: 'Estimate appointment',
    startsAt: 1_000,
    endsAt: 2_000,
    timeZone: 'America/Los_Angeles',
    status: 'scheduled',
    providerSequence: 1,
    participantCount: 1,
    participantTimeZones: ['America/Los_Angeles'],
    ...overrides,
  };
}

function reconciliationJob(overrides = {}) {
  return {
    _id: jobId,
    companyId,
    providerOrganizationId: 'org-1',
    runId: 'run-1',
    bookingStatus: 'upcoming',
    status: 'running',
    cursor: 'cursor-1',
    pageNumber: 1,
    pageFailureCount: 0,
    totalApplied: 0,
    totalStale: 0,
    totalUnchanged: 0,
    totalAppointments: 0,
    totalPages: 0,
    startedAt: 0,
    updatedAt: 0,
    leaseToken: 'lease-old',
    leaseExpiresAt: 100,
    ...overrides,
  };
}

function createTransactionalContext({
  companies = [{ _id: companyId, status: 'active' }],
  appointments = [],
  webhookReceipts = [],
  events = [],
  idempotencyKeys = [],
  calReconciliationJobs = [],
  failInsertTables = [],
} = {}) {
  const rows = new Map([
    ['companies', structuredClone(companies)],
    ['appointments', structuredClone(appointments)],
    ['webhookReceipts', structuredClone(webhookReceipts)],
    ['events', structuredClone(events)],
    ['idempotencyKeys', structuredClone(idempotencyKeys)],
    ['calReconciliationJobs', structuredClone(calReconciliationJobs)],
  ]);
  const scheduled = [];
  const failingInserts = new Set(failInsertTables);
  let nextId = 1_000;

  function snapshotRows() {
    return new Map(
      [...rows].map(([table, tableRows]) => [
        table,
        structuredClone(tableRows),
      ]),
    );
  }

  function restoreRows(snapshot) {
    rows.clear();
    for (const [table, tableRows] of snapshot) {
      rows.set(table, tableRows);
    }
  }

  const context = {
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
            const matches = () =>
              (rows.get(table) ?? []).filter((row) =>
                predicates.every((predicate) => predicate(row)));
            return {
              async unique() {
                const found = matches();
                assert.ok(
                  found.length <= 1,
                  `expected ${table} index result to be unique`,
                );
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
        if (failingInserts.has(table)) {
          throw new Error(`forced ${table} insert failure`);
        }
        const record = { _id: `${table}:${++nextId}`, ...value };
        const tableRows = rows.get(table) ?? [];
        tableRows.push(record);
        rows.set(table, tableRows);
        return record._id;
      },
      async patch(id, value) {
        for (const tableRows of rows.values()) {
          const row = tableRows.find((candidate) => candidate._id === id);
          if (!row) continue;
          for (const [key, patchValue] of Object.entries(value)) {
            if (patchValue === undefined) delete row[key];
            else row[key] = patchValue;
          }
          return;
        }
        throw new Error(`unknown record ${id}`);
      },
    },
    scheduler: {
      async runAfter(delayMs, reference, args) {
        scheduled.push({ delayMs, reference, args });
      },
    },
  };

  return {
    context,
    rows,
    scheduled,
    row(table, id) {
      return rows.get(table)?.find((candidate) => candidate._id === id);
    },
    async invoke(registered, args) {
      const beforeRows = snapshotRows();
      const scheduledLength = scheduled.length;
      try {
        return await registered._handler(context, args);
      } catch (error) {
        restoreRows(beforeRows);
        scheduled.splice(scheduledLength);
        throw error;
      }
    },
  };
}

async function applyWebhook(state, {
  eventId,
  payloadHash = `hash:${eventId}`,
  appointment,
  receivedAt = appointment.providerOccurredAt,
}) {
  return state.invoke(registeredFunction('applyVerifiedCalWebhook'), {
    companyId,
    eventId,
    payloadHash,
    receivedAt,
    appointment,
  });
}

async function expectConflictingWebhookIdentity(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(error instanceof ConvexError, true);
    assert.deepEqual(error.data, {
      code: 'conflicting_webhook_identity',
    });
    return true;
  });
}

test('registered webhook boundary tags integrity conflicts without masking unexpected errors', async () => {
  const conflictState = createTransactionalContext({
    webhookReceipts: [{
      _id: 'webhookReceipts:1',
      provider: 'cal.com',
      eventId: 'event-conflict',
      companyId,
      payloadHash: 'hash:original',
    }],
  });
  await expectConflictingWebhookIdentity(
    applyWebhook(conflictState, {
      eventId: 'event-conflict',
      payloadHash: 'hash:different',
      appointment: calAppointment(),
    }),
  );

  const rollbackState = createTransactionalContext({
    events: [{
      _id: 'events:conflict',
      eventId: 'cal:webhook:companies:1:event-rollback',
      companyId,
      type: 'appointment.cancelled',
      aggregateType: 'appointment',
      aggregateId: 'conflicting-appointment',
      requestHash: 'sha256:conflicting-domain-event',
      payload: {},
      occurredAt: 0,
    }],
  });
  await expectConflictingWebhookIdentity(
    applyWebhook(rollbackState, {
      eventId: 'event-rollback',
      appointment: calAppointment(),
    }),
  );
  assert.equal(rollbackState.rows.get('appointments').length, 0);
  assert.equal(rollbackState.rows.get('webhookReceipts').length, 0);
  assert.equal(rollbackState.rows.get('events').length, 1);
});

test('expired and reclaimed lease failures remain nonterminal and preserve the current owner', async () => {
  const state = createTransactionalContext({
    calReconciliationJobs: [reconciliationJob()],
  });
  const failure = registeredFunction('recordCalReconciliationFailure');
  const claim = registeredFunction('claimCalReconciliationPage');

  assert.deepEqual(
    await state.invoke(failure, {
      jobId,
      leaseToken: 'lease-old',
      now: 101,
      retryable: false,
    }),
    { terminal: false, retryAfterMs: 0 },
  );
  assert.equal(state.row('calReconciliationJobs', jobId).status, 'running');
  assert.equal(state.row('calReconciliationJobs', jobId).pageFailureCount, 0);

  const reclaimed = await state.invoke(claim, {
    jobId,
    leaseToken: 'lease-new',
    now: 102,
  });
  assert.equal(reclaimed.claimed, true);
  assert.equal(state.row('calReconciliationJobs', jobId).leaseToken, 'lease-new');
  assert.equal(state.scheduled.length, 1);

  assert.deepEqual(
    await state.invoke(failure, {
      jobId,
      leaseToken: 'lease-old',
      now: 103,
      retryable: false,
    }),
    { terminal: false, retryAfterMs: 0 },
  );
  const competing = await state.invoke(claim, {
    jobId,
    leaseToken: 'lease-competing',
    now: 104,
  });
  assert.deepEqual(competing, { claimed: false });
  assert.equal(state.row('calReconciliationJobs', jobId).leaseToken, 'lease-new');
  assert.equal(state.scheduled.length, 1);
});

test('page 99 with more data terminates and page 100 never reaches provider I/O', async () => {
  const state = createTransactionalContext({
    calReconciliationJobs: [reconciliationJob({
      cursor: 'cursor-99',
      pageNumber: 99,
      leaseExpiresAt: 500,
    })],
  });
  const persisted = await state.invoke(
    registeredFunction('persistCalReconciliationPage'),
    {
      jobId,
      leaseToken: 'lease-old',
      requestId: 'request-page-99',
      expectedBookingStatus: 'upcoming',
      expectedCursor: 'cursor-99',
      expectedPageNumber: 99,
      observedAt: 200,
      appointments: [],
      hasMore: true,
      nextCursor: 'cursor-100',
    },
  );
  assert.equal(persisted.done, true);
  assert.equal(persisted.terminal, true);
  assert.equal(state.row('calReconciliationJobs', jobId).status, 'failed');
  assert.equal(state.row('calReconciliationJobs', jobId).totalPages, 1);
  assert.equal(state.scheduled.length, 0);

  const capped = createTransactionalContext({
    calReconciliationJobs: [reconciliationJob({
      status: 'pending',
      cursor: 'cursor-100',
      pageNumber: 100,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
    })],
  });
  let mutationCalls = 0;
  let providerCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    providerCalls += 1;
    throw new Error('provider I/O must not occur');
  };
  try {
    const result = await registeredFunction('runCalReconciliationPage')._handler(
      {
        async runMutation(_reference, args) {
          mutationCalls += 1;
          return capped.invoke(
            registeredFunction('claimCalReconciliationPage'),
            args,
          );
        },
      },
      { jobId },
    );
    assert.deepEqual(result, { accepted: false, terminal: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(mutationCalls, 1);
  assert.equal(providerCalls, 0);
  assert.equal(capped.row('calReconciliationJobs', jobId).status, 'failed');
  assert.equal(capped.scheduled.length, 0);
});

test('cursor mismatch rolls back without a checkpoint or scheduled continuation', async () => {
  const state = createTransactionalContext({
    calReconciliationJobs: [reconciliationJob({
      cursor: 'cursor-current',
      leaseExpiresAt: 500,
    })],
  });
  const before = structuredClone(state.row('calReconciliationJobs', jobId));
  await assert.rejects(
    state.invoke(registeredFunction('persistCalReconciliationPage'), {
      jobId,
      leaseToken: 'lease-old',
      requestId: 'request-wrong-cursor',
      expectedBookingStatus: 'upcoming',
      expectedCursor: 'cursor-stale',
      expectedPageNumber: 1,
      observedAt: 200,
      appointments: [],
      hasMore: false,
    }),
    /durable checkpoint/,
  );
  assert.deepEqual(state.row('calReconciliationJobs', jobId), before);
  assert.equal(state.rows.get('idempotencyKeys').length, 0);
  assert.equal(state.scheduled.length, 0);
});

test('a second replacement cannot branch an established reschedule chain', async () => {
  const state = createTransactionalContext();
  const created = await applyWebhook(state, {
    eventId: 'event-a',
    appointment: calAppointment(),
  });
  assert.equal(created.ok, true);
  const originalHash = state.rows.get('appointments')[0].stateHash;

  const replaced = await applyWebhook(state, {
    eventId: 'event-b',
    appointment: calAppointment({
      triggerEvent: 'BOOKING_RESCHEDULED',
      providerOccurredAt: 200,
      providerBookingUid: 'booking-b',
      providerBookingId: '200',
      providerSequence: 2,
      supersedesProviderBookingUid: 'booking-a',
    }),
  });
  assert.equal(replaced.ok, true);
  const superseded = state.rows.get('appointments')
    .find((row) => row.providerBookingUid === 'booking-a');
  assert.equal(superseded.supersededByProviderBookingUid, 'booking-b');
  assert.notEqual(superseded.stateHash, originalHash);
  assert.equal(
    superseded.stateHash,
    await hashCanonicalContent({
      providerOrganizationId: 'org-1',
      providerBookingUid: 'booking-a',
      providerBookingId: '100',
      providerEventTypeId: '50',
      title: 'Estimate appointment',
      startsAt: 1_000,
      endsAt: 2_000,
      timeZone: 'America/Los_Angeles',
      status: 'rescheduled',
      providerSequence: 1,
      supersededByProviderBookingUid: 'booking-b',
      participantCount: 1,
      participantTimeZones: ['America/Los_Angeles'],
    }),
  );

  await expectConflictingWebhookIdentity(
    applyWebhook(state, {
      eventId: 'event-c',
      appointment: calAppointment({
        triggerEvent: 'BOOKING_RESCHEDULED',
        providerOccurredAt: 300,
        providerBookingUid: 'booking-c',
        providerBookingId: '300',
        providerSequence: 3,
        supersedesProviderBookingUid: 'booking-a',
      }),
    }),
  );
  assert.equal(
    state.rows.get('appointments')
      .some((row) => row.providerBookingUid === 'booking-c'),
    false,
  );
  assert.equal(superseded.supersededByProviderBookingUid, 'booking-b');
  assert.equal(state.rows.get('webhookReceipts').length, 2);
});

test('same-timestamp replacements ignore sequence from a different booking UID', async () => {
  const state = createTransactionalContext();
  assert.equal((await applyWebhook(state, {
    eventId: 'event-sequence-predecessor',
    appointment: calAppointment({
      providerSequence: 7,
    }),
  })).ok, true);

  const replacement = await applyWebhook(state, {
    eventId: 'event-sequence-replacement',
    appointment: calAppointment({
      triggerEvent: 'BOOKING_RESCHEDULED',
      providerBookingUid: 'booking-b',
      providerBookingId: '200',
      providerSequence: undefined,
      supersedesProviderBookingUid: 'booking-a',
    }),
  });
  assert.equal(replacement.ok, true);
  assert.equal(replacement.applied, true);
  assert.equal(
    state.rows.get('appointments')
      .some((row) => row.providerBookingUid === 'booking-b'),
    true,
  );
  assert.equal(
    state.rows.get('appointments')
      .find((row) => row.providerBookingUid === 'booking-a')
      .supersededByProviderBookingUid,
    'booking-b',
  );
});

test('provider versions use timestamp then bounded sequence and hash both supersession directions', async () => {
  const state = createTransactionalContext();
  assert.equal((await applyWebhook(state, {
    eventId: 'event-sequence-1',
    appointment: calAppointment(),
  })).ok, true);
  const firstHash = state.rows.get('appointments')[0].stateHash;

  const newerSequence = await applyWebhook(state, {
    eventId: 'event-sequence-2',
    appointment: calAppointment({
      providerSequence: 2,
      title: 'Updated estimate appointment',
    }),
  });
  assert.equal(newerSequence.ok, true);
  assert.equal(newerSequence.applied, true);
  assert.notEqual(state.rows.get('appointments')[0].stateHash, firstHash);

  const staleSequence = await applyWebhook(state, {
    eventId: 'event-sequence-stale',
    appointment: calAppointment({
      providerSequence: 1,
      title: 'Stale estimate appointment',
    }),
  });
  assert.equal(staleSequence.ok, true);
  assert.equal(staleSequence.stale, true);
  assert.equal(
    state.rows.get('appointments')[0].title,
    'Updated estimate appointment',
  );

  await expectConflictingWebhookIdentity(
    applyWebhook(state, {
      eventId: 'event-sequence-invalid',
      appointment: calAppointment({
        providerOccurredAt: 300,
        providerSequence: Number.MAX_SAFE_INTEGER + 1,
      }),
    }),
  );
  assert.equal(
    state.rows.get('webhookReceipts')
      .some((row) => row.eventId === 'event-sequence-invalid'),
    false,
  );

  const supersededBy = await applyWebhook(state, {
    eventId: 'event-superseded-by',
    appointment: calAppointment({
      providerOccurredAt: 400,
      providerSequence: 3,
      status: 'rescheduled',
      supersededByProviderBookingUid: 'booking-z',
    }),
  });
  assert.equal(supersededBy.ok, true);
  assert.equal(
    state.rows.get('appointments')[0].supersededByProviderBookingUid,
    'booking-z',
  );
});

test('provider fetch failures use failure accounting while checkpoint failures await lease recovery', async () => {
  const action = registeredFunction('runCalReconciliationPage')._handler;
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.CAL_API_KEY;
  process.env.CAL_API_KEY = 'cal_test_api_key_123';

  try {
    const providerMutationArgs = [];
    globalThis.fetch = async () =>
      new Response('temporary provider failure', { status: 503 });
    const providerResult = await action({
      async runMutation(_reference, args) {
        providerMutationArgs.push(args);
        if (providerMutationArgs.length === 1) {
          return {
            claimed: true,
            bookingStatus: 'upcoming',
            pageNumber: 0,
            companyId,
            providerOrganizationId: '5',
            runId: 'run-provider-failure',
          };
        }
        assert.equal(args.retryable, true);
        return { terminal: false, retryAfterMs: 60_000 };
      },
    }, { jobId });
    assert.deepEqual(providerResult, {
      accepted: false,
      terminal: false,
      retryAfterMs: 60_000,
    });
    assert.equal(providerMutationArgs.length, 2);

    const checkpointMutationArgs = [];
    globalThis.fetch = async () => Response.json({
      status: 'success',
      data: [],
      pagination: { hasMore: false },
    });
    await assert.rejects(
      action({
        async runMutation(_reference, args) {
          checkpointMutationArgs.push(args);
          if (checkpointMutationArgs.length === 1) {
            return {
              claimed: true,
              bookingStatus: 'upcoming',
              pageNumber: 0,
              companyId,
              providerOrganizationId: '5',
              runId: 'run-checkpoint-failure',
            };
          }
          throw new Error('checkpoint transaction failed');
        },
      }, { jobId }),
      /checkpoint transaction failed/,
    );
    assert.equal(checkpointMutationArgs.length, 2);
    assert.equal(
      Object.hasOwn(checkpointMutationArgs[1], 'requestId'),
      true,
      'the failed second call must be page persistence, not failure accounting',
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.CAL_API_KEY;
    else process.env.CAL_API_KEY = originalApiKey;
  }
});
