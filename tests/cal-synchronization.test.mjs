import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { ConvexError } from 'convex/values';

import * as httpModule from '../convex/http.ts';
import * as eventModule from '../convex/lib/events.ts';

function requiredFunction(module, name) {
  assert.equal(
    typeof module[name],
    'function',
    `${name} must be implemented for STL-202`,
  );
  return module[name];
}

function bookingPayload(overrides = {}) {
  return {
    triggerEvent: 'BOOKING_CREATED',
    createdAt: '2026-07-29T12:00:00.000Z',
    payload: {
      uid: 'booking_uid_123',
      bookingId: 123,
      eventTypeId: 50,
      organizationId: 5,
      title: 'Estimate appointment',
      startTime: '2026-08-01T15:30:00.000Z',
      endTime: '2026-08-01T16:30:00.000Z',
      status: 'ACCEPTED',
      iCalUID: 'booking_uid_123@example.com',
      organizer: {
        name: 'Estimator',
        email: 'estimator@example.com',
        timeZone: 'America/Chicago',
      },
      attendees: [{
        name: 'Home Owner',
        email: 'HOMEOWNER@example.com',
        timeZone: 'America/Chicago',
      }],
      ...overrides,
    },
  };
}

function createContext({
  companies = [],
  appointments = [],
  webhookReceipts = [],
  events = [],
  idempotencyKeys = [],
  calReconciliationJobs = [],
} = {}) {
  const rows = new Map([
    ['companies', companies.map((row) => ({ ...row }))],
    ['appointments', appointments.map((row) => ({ ...row }))],
    ['webhookReceipts', webhookReceipts.map((row) => ({ ...row }))],
    ['events', events.map((row) => ({ ...row }))],
    ['idempotencyKeys', idempotencyKeys.map((row) => ({ ...row }))],
    ['calReconciliationJobs', calReconciliationJobs.map((row) => ({ ...row }))],
  ]);
  let nextId = 0;

  return {
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
                assert.ok(found.length <= 1, `expected ${table} index to be unique`);
                return found[0] ?? null;
              },
              async collect() {
                return matches();
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
    rows,
  };
}

test('Cal webhook authentication fails closed and verifies the exact raw body', async () => {
  const hasConfiguredSecret = requiredFunction(
    httpModule,
    'hasConfiguredCalWebhookSecret',
  );
  const verifySignature = requiredFunction(
    httpModule,
    'verifyCalWebhookSignature',
  );
  const secret = 'cal_webhook_secret_12345678901234567890';
  const rawBody = JSON.stringify(bookingPayload());
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

  assert.equal(hasConfiguredSecret(undefined), false);
  assert.equal(hasConfiguredSecret('short'), false);
  assert.equal(hasConfiguredSecret(secret), true);
  assert.equal(await verifySignature(secret, signature, rawBody), true);
  assert.equal(
    await verifySignature(secret, signature, `${rawBody} `),
    false,
    'whitespace changes must invalidate the raw-body signature',
  );
  assert.equal(await verifySignature(secret, 'not-a-signature', rawBody), false);
});

test('Cal webhook payload normalization binds provider identity, tenant, timezone, and participants', () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const buildEventId = requiredFunction(httpModule, 'buildCalWebhookEventId');
  const parsed = parseEnvelope(JSON.stringify(bookingPayload()));

  assert.deepEqual(parsed, {
    triggerEvent: 'BOOKING_CREATED',
    providerOccurredAt: Date.parse('2026-07-29T12:00:00.000Z'),
    providerOrganizationId: '5',
    providerBookingUid: 'booking_uid_123',
    providerBookingId: '123',
    providerEventTypeId: '50',
    title: 'Estimate appointment',
    startsAt: Date.parse('2026-08-01T15:30:00.000Z'),
    endsAt: Date.parse('2026-08-01T16:30:00.000Z'),
    timeZone: 'America/Chicago',
    status: 'scheduled',
    iCalUid: 'booking_uid_123@example.com',
    participantCount: 1,
    participantTimeZones: ['America/Chicago'],
  });
  assert.equal(
    buildEventId(parsed),
    'cal:5:booking_uid_123:BOOKING_CREATED:1785326400000:none',
  );

  assert.throws(
    () => parseEnvelope(JSON.stringify(bookingPayload({ organizationId: undefined }))),
    /organization/i,
  );
  assert.throws(
    () => parseEnvelope(JSON.stringify({
      ...bookingPayload(),
      triggerEvent: 'FORM_SUBMITTED',
    })),
    /trigger/i,
  );
  assert.throws(
    () => parseEnvelope(JSON.stringify(bookingPayload({
      endTime: '2026-08-01T15:00:00.000Z',
    }))),
    /end/i,
  );
  assert.throws(
    () => parseEnvelope(JSON.stringify(bookingPayload({
      startTime: '2026-08-01T15:30:00',
    }))),
    /RFC3339|offset/i,
  );
  for (const startTime of [
    '2026-02-31T15:30:00.000Z',
    '2026-08-01T24:00:00.000Z',
  ]) {
    assert.throws(
      () => parseEnvelope(JSON.stringify(bookingPayload({ startTime }))),
      /invalid/i,
    );
  }
  assert.throws(
    () => parseEnvelope(JSON.stringify(bookingPayload({
      organizer: {
        name: 'Estimator',
        email: 'estimator@example.com',
        timeZone: 'Not/A_Timezone',
      },
    }))),
    /timezone/i,
  );
  for (const timeZone of ['CST', 'US/Central']) {
    assert.throws(
      () => parseEnvelope(JSON.stringify(bookingPayload({
        organizer: {
          name: 'Estimator',
          email: 'estimator@example.com',
          timeZone,
        },
      }))),
      /timezone|IANA/i,
    );
  }
  assert.equal(
    parseEnvelope(JSON.stringify(bookingPayload({
      startTime: '2026-08-01T10:30:00.000-05:00',
      endTime: '2026-08-01T11:30:00.000-05:00',
    }))).startsAt,
    Date.parse('2026-08-01T15:30:00.000Z'),
  );
});

test('Cal HTTP handler keeps provider event identity distinct from the raw payload hash', async () => {
  const handleWebhook = requiredFunction(
    httpModule,
    'handleCalWebhookRequest',
  );
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const secret = 'cal_webhook_secret_12345678901234567890';
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const mutationArgs = [];
  const handlerContext = {
    async runMutation(_mutation, args) {
      mutationArgs.push(args);
      try {
        return { ok: true, ...await applyEvent(context, args) };
      } catch (error) {
        if (error instanceof eventModule.EventIntegrityError) {
          throw new ConvexError({
            code: 'conflicting_webhook_identity',
          });
        }
        throw error;
      }
    },
  };
  const environment = {
    CAL_WEBHOOK_SIGNING_SECRET: secret,
    CAL_TENANT_MAP_JSON: JSON.stringify({ 5: companyId }),
  };
  const send = async (rawBody, payloadVersion = '2021-10-20') => {
    const signature = createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    const headers = new Headers({ 'x-cal-signature-256': signature });
    if (payloadVersion) {
      headers.set('x-cal-webhook-version', payloadVersion);
    }
    return handleWebhook(
      handlerContext,
      new Request('https://example.test/cal/webhook', {
        method: 'POST',
        headers,
        body: rawBody,
      }),
      environment,
      () => Date.parse('2026-07-29T12:00:01.000Z'),
    );
  };

  const firstBody = JSON.stringify(bookingPayload());
  const conflictingBody = JSON.stringify(bookingPayload({
    title: 'Changed title under the same provider event identity',
  }));
  assert.equal((await send(firstBody, '')).status, 400);
  assert.equal((await send(firstBody, '2025-01-01')).status, 400);
  assert.equal(mutationArgs.length, 0);
  assert.equal((await send(firstBody)).status, 200);
  assert.equal((await send(conflictingBody)).status, 409);
  assert.equal(mutationArgs.length, 2);
  assert.equal(mutationArgs[0].eventId, mutationArgs[1].eventId);
  assert.notEqual(mutationArgs[0].payloadHash, mutationArgs[1].payloadHash);
  assert.notEqual(
    mutationArgs[0].eventId,
    `cal:${mutationArgs[0].payloadHash.replace('sha256:', '')}`,
  );
});

test('Cal tenant mapping rejects malformed configuration and unknown organizations', () => {
  const resolveCompanyId = requiredFunction(
    httpModule,
    'resolveCalTenantCompanyId',
  );
  const configured = JSON.stringify({
    5: 'companies:alpha',
    9: 'companies:beta',
  });

  assert.equal(resolveCompanyId(configured, '5'), 'companies:alpha');
  assert.throws(() => resolveCompanyId(undefined, '5'), /configured/i);
  assert.throws(() => resolveCompanyId('[]', '5'), /configuration/i);
  assert.throws(() => resolveCompanyId(configured, '7'), /organization/i);
});

test('Cal webhook application is atomic, idempotent, tenant-bound, and stale-event safe', async () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const created = parseEnvelope(JSON.stringify(bookingPayload()));
  const input = {
    companyId,
    eventId: 'cal:event:created',
    payloadHash: 'sha256:created',
    receivedAt: Date.parse('2026-07-29T12:00:01.000Z'),
    appointment: created,
  };

  assert.deepEqual(await applyEvent(context, input), {
    applied: true,
    duplicate: false,
    stale: false,
    appointmentId: 'appointments:1',
  });
  assert.deepEqual(await applyEvent(context, input), {
    applied: false,
    duplicate: true,
    stale: false,
    appointmentId: 'appointments:1',
  });
  assert.equal(context.rows.get('appointments').length, 1);
  assert.equal(context.rows.get('webhookReceipts').length, 1);
  assert.equal(context.rows.get('events').length, 1);
  assert.equal(context.rows.get('appointments')[0].participantCount, 1);
  assert.deepEqual(
    context.rows.get('appointments')[0].participantTimeZones,
    ['America/Chicago'],
  );
  assert.equal(
    JSON.stringify(context.rows.get('appointments')[0])
      .includes('homeowner@example.com'),
    false,
  );
  assert.equal(
    JSON.stringify(context.rows.get('appointments')[0])
      .includes('Home Owner'),
    false,
  );

  const crossTenantContext = createContext({
    companies: [
      { _id: companyId, status: 'active' },
      { _id: 'companies:beta', status: 'active' },
    ],
    appointments: context.rows.get('appointments'),
    webhookReceipts: context.rows.get('webhookReceipts'),
    events: context.rows.get('events'),
  });
  await assert.rejects(
    () => applyEvent(crossTenantContext, {
      ...input,
      companyId: 'companies:beta',
    }),
    /tenant|company/i,
  );

  const rescheduled = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      startTime: '2026-08-02T15:30:00.000Z',
      endTime: '2026-08-02T16:30:00.000Z',
    }),
    triggerEvent: 'BOOKING_RESCHEDULED',
    createdAt: '2026-07-29T13:00:00.000Z',
  }));
  const rescheduleResult = await applyEvent(context, {
    ...input,
    eventId: 'cal:event:rescheduled',
    payloadHash: 'sha256:rescheduled',
    receivedAt: Date.parse('2026-07-29T13:00:01.000Z'),
    appointment: rescheduled,
  });
  assert.equal(rescheduleResult.applied, true);

  const staleCancellation = parseEnvelope(JSON.stringify({
    ...bookingPayload({ status: 'CANCELLED' }),
    triggerEvent: 'BOOKING_CANCELLED',
    createdAt: '2026-07-29T12:30:00.000Z',
  }));
  const staleResult = await applyEvent(context, {
    ...input,
    eventId: 'cal:event:stale-cancelled',
    payloadHash: 'sha256:stale-cancelled',
    receivedAt: Date.parse('2026-07-29T13:01:00.000Z'),
    appointment: staleCancellation,
  });
  assert.equal(staleResult.stale, true);
  assert.equal(context.rows.get('appointments')[0].status, 'scheduled');

  const cancellation = parseEnvelope(JSON.stringify({
    ...bookingPayload({ status: 'CANCELLED' }),
    triggerEvent: 'BOOKING_CANCELLED',
    createdAt: '2026-07-29T14:00:00.000Z',
  }));
  await applyEvent(context, {
    ...input,
    eventId: 'cal:event:cancelled',
    payloadHash: 'sha256:cancelled',
    receivedAt: Date.parse('2026-07-29T14:00:01.000Z'),
    appointment: cancellation,
  });
  assert.equal(context.rows.get('appointments')[0].status, 'cancelled');
});

test('Cal reschedule chains close the superseded booking and resist stale follow-up events', async () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const original = parseEnvelope(JSON.stringify(bookingPayload({
    uid: 'booking_uid_old',
    bookingId: 100,
    iCalUID: 'booking_uid_old@example.com',
  })));
  await applyEvent(context, {
    companyId,
    eventId: 'cal:event:original',
    payloadHash: 'sha256:original',
    receivedAt: Date.parse('2026-07-29T12:00:01.000Z'),
    appointment: original,
  });

  const replacement = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_new',
      bookingId: 101,
      iCalUID: 'booking_uid_new@example.com',
      rescheduledFromUid: 'booking_uid_old',
      startTime: '2026-08-02T15:30:00.000Z',
      endTime: '2026-08-02T16:30:00.000Z',
    }),
    triggerEvent: 'BOOKING_RESCHEDULED',
    createdAt: '2026-07-29T13:00:00.000Z',
  }));
  await applyEvent(context, {
    companyId,
    eventId: 'cal:event:replacement',
    payloadHash: 'sha256:replacement',
    receivedAt: Date.parse('2026-07-29T13:00:01.000Z'),
    appointment: replacement,
  });

  const oldAppointment = context.rows.get('appointments')
    .find((row) => row.providerBookingUid === 'booking_uid_old');
  const newAppointment = context.rows.get('appointments')
    .find((row) => row.providerBookingUid === 'booking_uid_new');
  assert.equal(oldAppointment.status, 'rescheduled');
  assert.equal(
    oldAppointment.supersededByProviderBookingUid,
    'booking_uid_new',
  );
  assert.equal(
    oldAppointment.lastProviderOccurredAt,
    Date.parse('2026-07-29T13:00:00.000Z'),
  );
  assert.equal(newAppointment.status, 'scheduled');

  const staleOldCancellation = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_old',
      bookingId: 100,
      iCalUID: 'booking_uid_old@example.com',
      status: 'CANCELLED',
    }),
    triggerEvent: 'BOOKING_CANCELLED',
    createdAt: '2026-07-29T12:30:00.000Z',
  }));
  const stale = await applyEvent(context, {
    companyId,
    eventId: 'cal:event:stale-old-cancellation',
    payloadHash: 'sha256:stale-old-cancellation',
    receivedAt: Date.parse('2026-07-29T13:30:00.000Z'),
    appointment: staleOldCancellation,
  });
  assert.equal(stale.stale, true);
  assert.equal(oldAppointment.status, 'rescheduled');
});

test('Cal reschedule arriving before create keeps the superseded booking closed', async () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const replacement = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_new',
      bookingId: 101,
      rescheduledFromUid: 'booking_uid_old',
      startTime: '2026-08-02T15:30:00.000Z',
      endTime: '2026-08-02T16:30:00.000Z',
    }),
    triggerEvent: 'BOOKING_RESCHEDULED',
    createdAt: '2026-07-29T13:00:00.000Z',
  }));
  await applyEvent(context, {
    companyId,
    eventId: 'cal:event:replacement-first',
    payloadHash: 'sha256:replacement-first',
    receivedAt: Date.parse('2026-07-29T13:00:01.000Z'),
    appointment: replacement,
  });

  const original = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_old',
      bookingId: 100,
    }),
    createdAt: '2026-07-29T12:00:00.000Z',
  }));
  const lateOriginal = await applyEvent(context, {
    companyId,
    eventId: 'cal:event:late-original',
    payloadHash: 'sha256:late-original',
    receivedAt: Date.parse('2026-07-29T14:00:00.000Z'),
    appointment: original,
  });

  assert.equal(lateOriginal.applied, false);
  assert.equal(lateOriginal.stale, true);
  const oldAppointment = context.rows.get('appointments')
    .find((row) => row.providerBookingUid === 'booking_uid_old');
  assert.equal(oldAppointment.status, 'rescheduled');
  assert.equal(
    oldAppointment.supersededByProviderBookingUid,
    'booking_uid_new',
  );
  assert.equal(
    oldAppointment.lastProviderOccurredAt,
    Date.parse('2026-07-29T13:00:00.000Z'),
  );
  assert.equal(
    context.rows.get('events')
      .some((event) =>
        event.aggregateId === oldAppointment._id
        && event.type === 'appointment.rescheduled'),
    true,
  );
});

test('a stale Cal reschedule retry replays its receipt without requiring a replacement record', async () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const original = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_old',
      bookingId: 100,
    }),
    createdAt: '2026-07-29T14:00:00.000Z',
  }));
  await applyEvent(context, {
    companyId,
    eventId: 'cal:event:newer-original',
    payloadHash: 'sha256:newer-original',
    receivedAt: Date.parse('2026-07-29T14:00:01.000Z'),
    appointment: original,
  });

  const staleReplacement = parseEnvelope(JSON.stringify({
    ...bookingPayload({
      uid: 'booking_uid_new',
      bookingId: 101,
      rescheduledFromUid: 'booking_uid_old',
      startTime: '2026-08-02T15:30:00.000Z',
      endTime: '2026-08-02T16:30:00.000Z',
    }),
    triggerEvent: 'BOOKING_RESCHEDULED',
    createdAt: '2026-07-29T13:00:00.000Z',
  }));
  const input = {
    companyId,
    eventId: 'cal:event:stale-replacement',
    payloadHash: 'sha256:stale-replacement',
    receivedAt: Date.parse('2026-07-29T15:00:00.000Z'),
    appointment: staleReplacement,
  };

  const first = await applyEvent(context, input);
  assert.equal(first.stale, true);
  assert.equal(
    context.rows.get('appointments')
      .some((row) => row.providerBookingUid === 'booking_uid_new'),
    false,
  );
  assert.deepEqual(await applyEvent(context, input), {
    applied: false,
    duplicate: true,
    stale: false,
    appointmentId: first.appointmentId,
  });
});

test('Cal reconciliation fetches exactly one bounded official organization cursor page', async () => {
  const fetchBookings = requiredFunction(
    httpModule,
    'fetchCalOrganizationBookings',
  );
  const requests = [];
  const pages = [
    {
      status: 'success',
      data: [{
        id: 123,
        uid: 'booking_uid_123',
        title: 'Estimate appointment',
        status: 'accepted',
        start: '2026-08-01T15:30:00.000Z',
        end: '2026-08-01T16:30:00.000Z',
        eventTypeId: 50,
        updatedAt: '2026-07-29T12:00:00.000Z',
        hosts: [{
          name: 'Estimator',
          email: 'estimator@example.com',
          timeZone: 'America/Chicago',
        }],
        attendees: [{
          name: 'Home Owner',
          email: 'homeowner@example.com',
          timeZone: 'America/Chicago',
        }],
        icsUid: 'booking_uid_123@example.com',
      }],
      pagination: { hasMore: true, nextCursor: 'cursor-2' },
    },
    {
      status: 'success',
      data: [{
        id: 456,
        uid: 'booking_uid_456',
        title: 'Cancelled estimate',
        status: 'cancelled',
        start: '2026-08-03T15:30:00.000Z',
        end: '2026-08-03T16:30:00.000Z',
        eventTypeId: 50,
        updatedAt: '2026-07-29T14:00:00.000Z',
        hosts: [{
          name: 'Estimator',
          email: 'estimator@example.com',
          timeZone: 'America/Chicago',
        }],
        attendees: [],
      }, {
        id: 457,
        uid: 'booking_uid_rescheduled_old',
        title: 'Rescheduled estimate',
        status: 'cancelled',
        start: '2026-08-04T15:30:00.000Z',
        end: '2026-08-04T16:30:00.000Z',
        eventTypeId: 50,
        updatedAt: '2026-07-29T14:30:00.000Z',
        rescheduledToUid: 'booking_uid_rescheduled_new',
        hosts: [{
          name: 'Estimator',
          email: 'estimator@example.com',
          timeZone: 'America/Chicago',
        }],
        attendees: [],
      }],
      pagination: { hasMore: false, nextCursor: null },
    },
    {
      status: 'success',
      data: [{
        id: 789,
        uid: 'booking_uid_past',
        title: 'Completed estimate',
        status: 'accepted',
        start: '2026-07-01T15:30:00.000Z',
        end: '2026-07-01T16:30:00.000Z',
        eventTypeId: 50,
        updatedAt: '2026-07-01T16:30:00.000Z',
        hosts: [{
          name: 'Estimator',
          email: 'estimator@example.com',
          timeZone: 'America/Chicago',
        }],
        attendees: [],
      }],
      pagination: { hasMore: false, nextCursor: null },
    },
  ];
  const fetchImpl = async (url, options) => {
    requests.push({ url: String(url), options });
    return new Response(JSON.stringify(pages.shift()), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const first = await fetchBookings({
    apiKey: 'cal_test_api_key',
    organizationId: '5',
    status: 'upcoming',
    fetchImpl,
  });
  assert.equal(first.appointments.length, 1);
  assert.equal(first.appointments[0].providerOrganizationId, '5');
  assert.equal(first.hasMore, true);
  assert.equal(first.nextCursor, 'cursor-2');
  assert.equal(requests.length, 1);
  assert.match(
    requests[0].url,
    /^https:\/\/api\.cal\.com\/v2\/organizations\/5\/bookings\?status=upcoming&limit=100$/,
  );
  assert.equal(requests[0].options.headers.Authorization, 'Bearer cal_test_api_key');
  assert.equal(requests[0].options.headers['cal-api-version'], '2026-05-01');

  const second = await fetchBookings({
    apiKey: 'cal_test_api_key',
    organizationId: '5',
    status: 'upcoming',
    cursor: first.nextCursor,
    fetchImpl,
  });
  assert.equal(second.appointments.length, 2);
  assert.equal(second.appointments[0].status, 'cancelled');
  assert.equal(second.appointments[1].status, 'rescheduled');
  assert.equal(
    second.appointments[1].supersededByProviderBookingUid,
    'booking_uid_rescheduled_new',
  );
  assert.equal(second.hasMore, false);
  assert.equal(second.nextCursor, undefined);
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /cursor=cursor-2/);

  const past = await fetchBookings({
    apiKey: 'cal_test_api_key',
    organizationId: '5',
    status: 'past',
    fetchImpl,
  });
  assert.equal(past.appointments[0].status, 'completed');
  assert.match(requests[2].url, /status=past/);
});

test('Cal reconciliation attempts every tenant before reporting partial enqueue failure', async () => {
  const handleReconciliation = requiredFunction(
    httpModule,
    'handleCalReconciliationRequest',
  );
  const calls = [];
  const response = await handleReconciliation(
    {
      async runMutation(_mutation, args) {
        calls.push(args);
        if (args.providerOrganizationId === '2') {
          throw new Error('tenant-specific failure');
        }
        return { created: true, jobId: `job:${args.providerOrganizationId}` };
      },
    },
    new Request('https://example.test/cal/reconciliation', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ops-secret': 'cal_reconciliation_secret_12345678901234567890',
      },
      body: JSON.stringify({ runId: 'cal-cron:2026-07-29T12:34Z' }),
    }),
    {
      CAL_RECONCILIATION_SECRET:
        'cal_reconciliation_secret_12345678901234567890',
      CAL_TENANT_MAP_JSON: JSON.stringify({
        1: 'companies:alpha',
        2: 'companies:beta',
        3: 'companies:gamma',
      }),
    },
    () => Date.parse('2026-07-29T12:34:56.000Z'),
  );

  assert.equal(response.status, 503);
  assert.deepEqual(
    calls.map((call) => call.providerOrganizationId),
    ['1', '2', '3'],
  );
  assert.deepEqual(await response.json(), {
    accepted: false,
    jobs: 2,
    failed: 1,
  });
});

test('Cal reconciliation persists bounded pages with a durable cursor lease and retry checkpoint', async () => {
  const statuses = httpModule.calReconciliationStatuses;
  assert.deepEqual(statuses, [
    'upcoming',
    'recurring',
    'past',
    'cancelled',
    'unconfirmed',
  ]);
  const startJob = requiredFunction(
    eventModule,
    'startCalReconciliationJob',
  );
  const claimPage = requiredFunction(
    eventModule,
    'claimCalReconciliationPage',
  );
  const persistPage = requiredFunction(
    eventModule,
    'persistCalReconciliationPage',
  );
  const failPage = requiredFunction(
    eventModule,
    'failCalReconciliationPage',
  );
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const scheduled = [];
  const schedule = async (jobId, delayMs) => {
    scheduled.push({ jobId, delayMs });
  };
  const started = await startJob(context, {
    companyId,
    providerOrganizationId: '5',
    runId: 'cal-cron:2026-07-29T12:00Z',
    now: Date.parse('2026-07-29T12:00:00.000Z'),
    schedule,
  });
  assert.equal(started.created, true);
  assert.deepEqual(scheduled, [{ jobId: started.jobId, delayMs: 0 }]);

  const claim = await claimPage(context, {
    jobId: started.jobId,
    now: Date.parse('2026-07-29T12:00:01.000Z'),
    leaseToken: 'lease:page:1',
    leaseDurationMs: 300_000,
    schedule,
  });
  assert.equal(claim.claimed, true);
  assert.equal(claim.bookingStatus, 'upcoming');
  assert.equal(claim.cursor, undefined);
  assert.equal(claim.pageNumber, 0);
  assert.equal(scheduled.at(-1).delayMs, 300_000);

  const parsed = httpModule.parseCalWebhookEnvelope(
    JSON.stringify(bookingPayload()),
  );
  const persisted = await persistPage(context, {
    jobId: started.jobId,
    leaseToken: 'lease:page:1',
    requestId: 'workflow-step:page:1',
    expectedBookingStatus: 'upcoming',
    expectedCursor: undefined,
    expectedPageNumber: 0,
    observedAt: Date.parse('2026-07-29T12:00:02.000Z'),
    appointments: [{ ...parsed, triggerEvent: 'RECONCILIATION' }],
    hasMore: true,
    nextCursor: 'cursor-2',
    schedule,
  });
  assert.equal(persisted.applied, 1);
  assert.equal(persisted.done, false);
  assert.equal(persisted.nextCursor, 'cursor-2');
  assert.equal(context.rows.get('appointments').length, 1);
  assert.equal(context.rows.get('idempotencyKeys').length, 1);
  assert.equal(context.rows.get('calReconciliationJobs')[0].cursor, 'cursor-2');
  assert.equal(context.rows.get('calReconciliationJobs')[0].pageNumber, 1);
  assert.equal(scheduled.at(-1).delayMs, 0);

  const retryClaim = await claimPage(context, {
    jobId: started.jobId,
    now: Date.parse('2026-07-29T12:00:03.000Z'),
    leaseToken: 'lease:page:2',
    leaseDurationMs: 300_000,
    schedule,
  });
  assert.equal(retryClaim.claimed, true);
  const failed = await failPage(context, {
    jobId: started.jobId,
    leaseToken: 'lease:page:2',
    now: Date.parse('2026-07-29T12:00:04.000Z'),
    retryable: true,
    schedule,
  });
  assert.equal(failed.terminal, false);
  assert.ok(failed.retryAfterMs > 0);
  assert.equal(scheduled.at(-1).delayMs, failed.retryAfterMs);
});

test('Vercel Cron handler fails closed and retries only the durable Convex enqueue', async () => {
  const cronModule = await import(
    '../src/app/api/cron/cal-reconciliation/handler.ts'
  );
  const handleCron = requiredFunction(
    cronModule,
    'handleCalReconciliationCron',
  );
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return new Response('request timeout', { status: 408 });
    }
    if (calls.length === 2) {
      return new Response('rate limited', { status: 429 });
    }
    return new Response(JSON.stringify({ accepted: true, jobs: 1 }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  };
  const baseOptions = {
    env: {
      CRON_SECRET: 'cron_secret_123456789012345678901234',
      CONVEX_SITE_URL: 'https://example.convex.site',
      CAL_RECONCILIATION_SECRET:
        'cal_reconciliation_secret_12345678901234567890',
    },
    fetchImpl,
    now: () => Date.parse('2026-07-29T12:34:56.000Z'),
    delay: async () => {},
  };

  assert.equal(
    (await handleCron(
      new Request('https://example.test/api/cron/cal-reconciliation'),
      { ...baseOptions, env: {} },
    )).status,
    503,
  );
  assert.equal(
    (await handleCron(
      new Request('https://example.test/api/cron/cal-reconciliation', {
        headers: { authorization: 'Bearer wrong' },
      }),
      baseOptions,
    )).status,
    401,
  );
  assert.equal(calls.length, 0);

  const response = await handleCron(
    new Request('https://example.test/api/cron/cal-reconciliation', {
      headers: {
        authorization:
          'Bearer cron_secret_123456789012345678901234',
      },
    }),
    baseOptions,
  );
  assert.equal(response.status, 202);
  assert.equal(calls.length, 3);
  assert.equal(
    calls[2].url,
    'https://example.convex.site/cal/reconciliation',
  );
  assert.equal(calls[2].options.method, 'POST');
  assert.equal(
    calls[2].options.headers['x-ops-secret'],
    baseOptions.env.CAL_RECONCILIATION_SECRET,
  );
  assert.deepEqual(JSON.parse(calls[2].options.body), {
    runId: 'cal-cron:2026-07-29T12:34Z',
  });

  let timeoutCalls = 0;
  const timeoutResponse = await handleCron(
    new Request('https://example.test/api/cron/cal-reconciliation', {
      headers: {
        authorization:
          'Bearer cron_secret_123456789012345678901234',
      },
    }),
    {
      ...baseOptions,
      requestTimeoutMs: 1,
      fetchImpl: async (_url, options) => {
        timeoutCalls += 1;
        return new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        });
      },
    },
  );
  assert.equal(timeoutResponse.status, 503);
  assert.equal(timeoutCalls, 3);

  const vercelConfig = JSON.parse(
    await readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(
    vercelConfig.crons.find(
      (cron) => cron.path === '/api/cron/cal-reconciliation',
    ),
    {
      path: '/api/cron/cal-reconciliation',
      schedule: '0 9 * * *',
    },
  );
});

test('Cal reconciliation heals drift but cannot cross tenant or overwrite newer webhook state', async () => {
  const parseEnvelope = requiredFunction(httpModule, 'parseCalWebhookEnvelope');
  const applyEvent = requiredFunction(eventModule, 'applyCalAppointmentEvent');
  const applySnapshot = requiredFunction(
    eventModule,
    'applyCalReconciliationSnapshot',
  );
  const companyId = 'companies:alpha';
  const context = createContext({
    companies: [{ _id: companyId, status: 'active' }],
  });
  const created = parseEnvelope(JSON.stringify(bookingPayload()));
  await applyEvent(context, {
    companyId,
    eventId: 'cal:event:created',
    payloadHash: 'sha256:created',
    receivedAt: Date.parse('2026-07-29T12:00:01.000Z'),
    appointment: created,
  });

  const reconciled = await applySnapshot(context, {
    companyId,
    providerOrganizationId: '5',
    runId: 'reconcile:2026-07-29T14:00:00Z',
    observedAt: Date.parse('2026-07-29T14:00:00.000Z'),
    appointments: [{
      ...created,
      triggerEvent: 'RECONCILIATION',
      providerOccurredAt: Date.parse('2026-07-29T13:30:00.000Z'),
      startsAt: Date.parse('2026-08-02T15:30:00.000Z'),
      endsAt: Date.parse('2026-08-02T16:30:00.000Z'),
    }],
  });
  assert.deepEqual(reconciled, {
    applied: 1,
    stale: 0,
    unchanged: 0,
  });
  assert.equal(
    context.rows.get('appointments')[0].startsAt,
    Date.parse('2026-08-02T15:30:00.000Z'),
  );

  const stale = await applySnapshot(context, {
    companyId,
    providerOrganizationId: '5',
    runId: 'reconcile:2026-07-29T15:00:00Z',
    observedAt: Date.parse('2026-07-29T15:00:00.000Z'),
    appointments: [{
      ...created,
      triggerEvent: 'RECONCILIATION',
      providerOccurredAt: Date.parse('2026-07-29T13:00:00.000Z'),
    }],
  });
  assert.equal(stale.stale, 1);

  await assert.rejects(
    () => applySnapshot(context, {
      companyId,
      providerOrganizationId: '9',
      runId: 'reconcile:wrong-tenant',
      observedAt: Date.parse('2026-07-29T16:00:00.000Z'),
      appointments: [{ ...created, triggerEvent: 'RECONCILIATION' }],
    }),
    /organization|tenant/i,
  );
});
