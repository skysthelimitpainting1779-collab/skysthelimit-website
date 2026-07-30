import type { GenericId } from 'convex/values';
import { calReconciliationStatuses } from './cal';
import type {
  CalReconciliationStatus,
  CanonicalCalAppointment,
} from './cal';

type CanonicalCalAppointmentState = CanonicalCalAppointment & {
  supersededByProviderBookingUid?: string;
};
type IndexQuery = { eq(field: string, value: unknown): IndexQuery };
type StoredRecord = Record<string, unknown> & { _id: GenericId<string> };
type EventDatabase = {
  query(table: string): {
    withIndex(name: string, build: (query: IndexQuery) => unknown): { unique(): Promise<StoredRecord | null> };
  };
  get(id: GenericId<string>): Promise<StoredRecord | null>;
  insert(table: string, value: Record<string, unknown>): Promise<GenericId<string>>;
  patch(id: GenericId<string>, value: Record<string, unknown>): Promise<void>;
};

export type EventContext = { db: EventDatabase };
export class EventIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventIntegrityError';
  }
}

export type DomainEventInput = {
  eventId: string;
  companyId: GenericId<'companies'>;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: unknown;
  occurredAt: number;
};

type IdempotencyInput = {
  scope: string;
  key: string;
  companyId: GenericId<'companies'>;
  aggregateType: string;
  aggregateId: string;
  /** Complete semantic command request. Retry timestamps are intentionally excluded. */
  request: unknown;
  requestedAt: number;
};

function requireNonEmpty(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new EventIntegrityError(`${name} is required.`);
  return normalized;
}

function canonicalize(value: unknown, seen = new Set<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new EventIntegrityError('Canonical content cannot contain a non-finite number.');
    return Object.is(value, -0) ? '0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') throw new EventIntegrityError(`Canonical content cannot contain ${typeof value}.`);
  if (seen.has(value)) throw new EventIntegrityError('Canonical content cannot contain a cycle.');
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item, seen)).join(',')}]`;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new EventIntegrityError('Canonical content must use plain objects and arrays.');
    }
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key], seen)}`).join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export async function hashCanonicalContent(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

function sameEventRequest(existing: StoredRecord, input: DomainEventInput, requestHash: string): boolean {
  return existing.companyId === input.companyId
    && existing.type === input.type
    && existing.aggregateType === input.aggregateType
    && existing.aggregateId === input.aggregateId
    && existing.requestHash === requestHash;
}

function sameIdempotencyRequest(existing: StoredRecord, input: IdempotencyInput, requestHash: string): boolean {
  return existing.companyId === input.companyId
    && existing.aggregateType === input.aggregateType
    && existing.aggregateId === input.aggregateId
    && existing.requestHash === requestHash;
}

/** Inserts immutable events and rejects reuse of an event ID with different content. */
export async function appendDomainEvent(
  ctx: EventContext,
  input: DomainEventInput,
): Promise<{ created: boolean; eventId: string }> {
  const eventId = requireNonEmpty(input.eventId, 'eventId');
  const normalized = {
    ...input,
    eventId,
    type: requireNonEmpty(input.type, 'type'),
    aggregateType: requireNonEmpty(input.aggregateType, 'aggregateType'),
    aggregateId: requireNonEmpty(input.aggregateId, 'aggregateId'),
  };
  const requestHash = await hashCanonicalContent({
    companyId: String(normalized.companyId),
    type: normalized.type,
    aggregateType: normalized.aggregateType,
    aggregateId: normalized.aggregateId,
    payload: normalized.payload,
    occurredAt: normalized.occurredAt,
  });
  const existing = await ctx.db.query('events').withIndex('by_eventId', (query) => query.eq('eventId', eventId)).unique();
  if (existing) {
    if (!sameEventRequest(existing, normalized, requestHash)) throw new EventIntegrityError('Event ID was reused with conflicting immutable content.');
    return { created: false, eventId };
  }
  await ctx.db.insert('events', { ...normalized, requestHash });
  return { created: true, eventId };
}

/** Claims one stable command request per scope/key and replays a completed result. */
export async function claimIdempotencyKey(
  ctx: EventContext,
  input: IdempotencyInput,
): Promise<{ claimed: boolean; idempotencyKeyId: GenericId<'idempotencyKeys'>; result?: unknown; resultHash?: string }> {
  const scope = requireNonEmpty(input.scope, 'Idempotency scope');
  const key = requireNonEmpty(input.key, 'Idempotency key');
  const requestHash = await hashCanonicalContent({
    companyId: String(input.companyId),
    aggregateType: requireNonEmpty(input.aggregateType, 'aggregateType'),
    aggregateId: requireNonEmpty(input.aggregateId, 'aggregateId'),
    request: input.request,
  });
  const existing = await ctx.db.query('idempotencyKeys').withIndex('by_scope_key', (query) => query.eq('scope', scope).eq('key', key)).unique();
  if (existing) {
    if (!sameIdempotencyRequest(existing, input, requestHash)) throw new EventIntegrityError('Idempotency key was reused with a conflicting request.');
    return {
      claimed: false,
      idempotencyKeyId: existing._id as GenericId<'idempotencyKeys'>,
      ...(existing.status === 'completed' ? { result: existing.result, resultHash: String(existing.resultHash) } : {}),
    };
  }
  const idempotencyKeyId = await ctx.db.insert('idempotencyKeys', {
    companyId: input.companyId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    requestedAt: input.requestedAt,
    requestHash,
    scope,
    key,
    status: 'claimed',
  });
  return { claimed: true, idempotencyKeyId: idempotencyKeyId as GenericId<'idempotencyKeys'> };
}

/** Stores a result exactly once so retries can return the same result without redoing work. */
export async function completeIdempotencyKey(
  ctx: EventContext,
  input: IdempotencyInput & { result: unknown; completedAt: number },
): Promise<{ completed: boolean; result: unknown; resultHash: string }> {
  const scope = requireNonEmpty(input.scope, 'Idempotency scope');
  const key = requireNonEmpty(input.key, 'Idempotency key');
  const requestHash = await hashCanonicalContent({
    companyId: String(input.companyId),
    aggregateType: requireNonEmpty(input.aggregateType, 'aggregateType'),
    aggregateId: requireNonEmpty(input.aggregateId, 'aggregateId'),
    request: input.request,
  });
  const resultHash = await hashCanonicalContent(input.result);
  const existing = await ctx.db.query('idempotencyKeys').withIndex('by_scope_key', (query) => query.eq('scope', scope).eq('key', key)).unique();
  if (!existing || !sameIdempotencyRequest(existing, input, requestHash)) throw new EventIntegrityError('Idempotency completion does not match a claimed request.');
  if (existing.status === 'completed') {
    if (existing.resultHash !== resultHash) throw new EventIntegrityError('Idempotency result was already completed with different content.');
    return { completed: false, result: existing.result, resultHash };
  }
  await ctx.db.patch(existing._id, { status: 'completed', result: input.result, resultHash, completedAt: input.completedAt });
  return { completed: true, result: input.result, resultHash };
}

type WebhookReceiptInput = { provider: string; eventId: string; payloadHash: string; receivedAt: number };
type WebhookState = 'received' | 'processing' | 'succeeded' | 'failed';

async function getMatchingWebhookReceipt(ctx: EventContext, input: WebhookReceiptInput): Promise<StoredRecord | null> {
  const provider = requireNonEmpty(input.provider, 'provider');
  const eventId = requireNonEmpty(input.eventId, 'event ID');
  const payloadHash = requireNonEmpty(input.payloadHash, 'payload hash');
  const existing = await ctx.db.query('webhookReceipts').withIndex('by_provider_eventId', (query) => query.eq('provider', provider).eq('eventId', eventId)).unique();
  if (existing && existing.payloadHash !== payloadHash) throw new EventIntegrityError('Webhook event ID was replayed with a different payload.');
  return existing;
}

/** Records only a pre-verified webhook. Signature verification remains at the HTTP boundary. */
export async function recordWebhookReceipt(
  ctx: EventContext,
  input: WebhookReceiptInput,
): Promise<{ received: boolean; receiptId: GenericId<'webhookReceipts'> }> {
  const existing = await getMatchingWebhookReceipt(ctx, input);
  if (existing) return { received: false, receiptId: existing._id as GenericId<'webhookReceipts'> };
  const receiptId = await ctx.db.insert('webhookReceipts', {
    ...input,
    provider: input.provider.trim(),
    eventId: input.eventId.trim(),
    verificationStatus: 'verified',
    processingStatus: 'received',
    attemptCount: 0,
  });
  return { received: true, receiptId: receiptId as GenericId<'webhookReceipts'> };
}

/** Claims work with a lease; failed or expired processing is safe to retry. */
export async function claimWebhookProcessing(
  ctx: EventContext,
  input: WebhookReceiptInput & { leaseToken: string; now: number; leaseDurationMs: number },
): Promise<{ claimed: boolean; receiptId: GenericId<'webhookReceipts'>; state: WebhookState }> {
  const existing = await getMatchingWebhookReceipt(ctx, input);
  if (!existing) throw new EventIntegrityError('Webhook receipt must be recorded before it can be processed.');
  const leaseToken = requireNonEmpty(input.leaseToken, 'lease token');
  if (input.leaseDurationMs <= 0) throw new EventIntegrityError('leaseDurationMs must be positive.');
  const state = existing.processingStatus as WebhookState;
  if (state === 'succeeded') return { claimed: false, receiptId: existing._id as GenericId<'webhookReceipts'>, state };
  const leaseExpiresAt = typeof existing.leaseExpiresAt === 'number' ? existing.leaseExpiresAt : 0;
  if (state === 'processing' && leaseExpiresAt > input.now) {
    return { claimed: false, receiptId: existing._id as GenericId<'webhookReceipts'>, state };
  }
  await ctx.db.patch(existing._id, {
    processingStatus: 'processing',
    leaseToken,
    leaseExpiresAt: input.now + input.leaseDurationMs,
    attemptCount: Number(existing.attemptCount ?? 0) + 1,
    lastError: undefined,
  });
  return { claimed: true, receiptId: existing._id as GenericId<'webhookReceipts'>, state: 'processing' };
}

/** Finishes only the holder's unexpired lease; no external effect runs in this helper. */
export async function completeWebhookProcessing(
  ctx: EventContext,
  input: { provider: string; eventId: string; leaseToken: string; now: number; outcome: 'succeeded' | 'failed'; error?: string },
): Promise<void> {
  const provider = requireNonEmpty(input.provider, 'provider');
  const eventId = requireNonEmpty(input.eventId, 'event ID');
  const leaseToken = requireNonEmpty(input.leaseToken, 'lease token');
  const existing = await ctx.db.query('webhookReceipts').withIndex('by_provider_eventId', (query) => query.eq('provider', provider).eq('eventId', eventId)).unique();
  if (!existing || existing.processingStatus !== 'processing' || existing.leaseToken !== leaseToken || Number(existing.leaseExpiresAt) <= input.now) {
    throw new EventIntegrityError('Webhook processing lease is no longer valid.');
  }
  await ctx.db.patch(existing._id, {
    processingStatus: input.outcome,
    leaseToken: undefined,
    leaseExpiresAt: undefined,
    lastError: input.outcome === 'failed' ? input.error ?? 'Webhook processing failed.' : undefined,
    processedAt: input.now,
  });
}

type AppointmentStateResult = {
  applied: boolean;
  stale: boolean;
  unchanged: boolean;
  derivedSupersession?: boolean;
  supersededByProviderBookingUid?: string;
  appointmentId: GenericId<'appointments'>;
};

type AppointmentStateWithSupersessionResult = AppointmentStateResult & {
  supersededAppointmentId?: GenericId<'appointments'>;
};

function requireFiniteTimestamp(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new EventIntegrityError(`${name} must be a finite non-negative timestamp.`);
  }
  return value;
}

function validateCanonicalAppointment(
  appointment: CanonicalCalAppointmentState,
  providerOrganizationId?: string,
): void {
  requireNonEmpty(appointment.providerOrganizationId, 'Cal organization ID');
  requireNonEmpty(appointment.providerBookingUid, 'Cal booking UID');
  requireNonEmpty(appointment.providerBookingId, 'Cal booking ID');
  requireNonEmpty(appointment.providerEventTypeId, 'Cal event type ID');
  requireNonEmpty(appointment.title, 'Cal appointment title');
  requireNonEmpty(appointment.timeZone, 'Cal appointment timezone');
  requireFiniteTimestamp(appointment.providerOccurredAt, 'Cal provider timestamp');
  requireFiniteTimestamp(appointment.startsAt, 'Cal appointment start');
  requireFiniteTimestamp(appointment.endsAt, 'Cal appointment end');
  if (
    appointment.providerSequence !== undefined
    && (
      !Number.isSafeInteger(appointment.providerSequence)
      || appointment.providerSequence < 0
    )
  ) {
    throw new EventIntegrityError(
      'Cal provider sequence must be a non-negative safe integer.',
    );
  }
  if (appointment.supersedesProviderBookingUid !== undefined) {
    requireNonEmpty(
      appointment.supersedesProviderBookingUid,
      'Cal superseded booking UID',
    );
  }
  if (appointment.supersededByProviderBookingUid !== undefined) {
    requireNonEmpty(
      appointment.supersededByProviderBookingUid,
      'Cal superseding booking UID',
    );
  }
  if (appointment.endsAt <= appointment.startsAt) {
    throw new EventIntegrityError('Cal appointment end must follow its start.');
  }
  if (
    !Number.isInteger(appointment.participantCount)
    || appointment.participantCount < 0
    || appointment.participantCount > 100
  ) {
    throw new EventIntegrityError(
      'Cal participant count must be a bounded non-negative integer.',
    );
  }
  if (
    !Array.isArray(appointment.participantTimeZones)
    || appointment.participantTimeZones.length > appointment.participantCount
    || appointment.participantTimeZones.some(
      (timeZone) => typeof timeZone !== 'string' || !timeZone.trim(),
    )
  ) {
    throw new EventIntegrityError('Cal participant timezones are invalid.');
  }
  if (
    providerOrganizationId
    && appointment.providerOrganizationId !== providerOrganizationId
  ) {
    throw new EventIntegrityError('Cal appointment organization violates the tenant boundary.');
  }
}

async function requireActiveCompany(
  ctx: EventContext,
  companyId: GenericId<'companies'>,
): Promise<void> {
  const company = await ctx.db.get(companyId);
  if (!company || company.status !== 'active') {
    throw new EventIntegrityError('Cal appointment company is not active.');
  }
}

async function findCalAppointment(
  ctx: EventContext,
  companyId: GenericId<'companies'>,
  providerOrganizationId: string,
  providerBookingUid: string,
): Promise<StoredRecord | null> {
  const appointment = await ctx.db
    .query('appointments')
    .withIndex(
      'by_provider_organization_booking',
      (query) => query
        .eq('provider', 'cal.com')
        .eq('providerOrganizationId', providerOrganizationId)
        .eq('providerBookingUid', providerBookingUid),
    )
    .unique();
  if (appointment && appointment.companyId !== companyId) {
    throw new EventIntegrityError(
      'Cal booking identity is already owned by another company.',
    );
  }
  return appointment;
}

const maxCalReconciliationPages = 100;

async function findCalSupersedingAppointment(
  ctx: EventContext,
  companyId: GenericId<'companies'>,
  providerOrganizationId: string,
  providerBookingUid: string,
): Promise<StoredRecord | null> {
  return ctx.db
    .query('appointments')
    .withIndex(
      'by_company_supersedes_booking',
      (query) => query
        .eq('companyId', companyId)
        .eq('provider', 'cal.com')
        .eq('providerOrganizationId', providerOrganizationId)
        .eq('supersedesProviderBookingUid', providerBookingUid),
    )
    .unique();
}

function appointmentState(
  appointment: CanonicalCalAppointmentState,
): Record<string, unknown> {
  return {
    providerOrganizationId: appointment.providerOrganizationId,
    providerBookingUid: appointment.providerBookingUid,
    providerBookingId: appointment.providerBookingId,
    providerEventTypeId: appointment.providerEventTypeId,
    title: appointment.title,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    timeZone: appointment.timeZone,
    status: appointment.status,
    ...(appointment.iCalUid ? { iCalUid: appointment.iCalUid } : {}),
    ...(appointment.providerSequence !== undefined
      ? { providerSequence: appointment.providerSequence }
      : {}),
    ...(appointment.supersedesProviderBookingUid
      ? {
          supersedesProviderBookingUid:
            appointment.supersedesProviderBookingUid,
        }
      : {}),
    ...(appointment.supersededByProviderBookingUid
      ? {
          supersededByProviderBookingUid:
            appointment.supersededByProviderBookingUid,
        }
      : {}),
    participantCount: appointment.participantCount,
    participantTimeZones: appointment.participantTimeZones,
  };
}

function storedProviderSequence(record: StoredRecord): number | undefined {
  if (record.providerSequence === undefined) return undefined;
  if (
    !Number.isSafeInteger(record.providerSequence)
    || Number(record.providerSequence) < 0
  ) {
    throw new EventIntegrityError('Stored Cal provider sequence is invalid.');
  }
  return Number(record.providerSequence);
}

/**
 * Provider occurrence time is authoritative. For the same booking UID,
 * sequence resolves multiple canonical states at the same timestamp.
 */
function compareProviderVersion(
  incoming: CanonicalCalAppointmentState,
  existing: StoredRecord,
): -1 | 0 | 1 {
  const existingOccurredAt = requireFiniteTimestamp(
    Number(existing.lastProviderOccurredAt),
    'Stored Cal provider timestamp',
  );
  if (incoming.providerOccurredAt < existingOccurredAt) return -1;
  if (incoming.providerOccurredAt > existingOccurredAt) return 1;
  if (incoming.providerBookingUid !== existing.providerBookingUid) return 0;

  const incomingSequence = incoming.providerSequence ?? -1;
  const existingSequence = storedProviderSequence(existing) ?? -1;
  if (incomingSequence < existingSequence) return -1;
  if (incomingSequence > existingSequence) return 1;
  return 0;
}

async function applyAppointmentState(
  ctx: EventContext,
  input: {
    companyId: GenericId<'companies'>;
    appointment: CanonicalCalAppointmentState;
    source: 'webhook' | 'reconciliation';
    sourceEventId: string;
    sourcePayloadHash: string;
    observedAt: number;
  },
): Promise<AppointmentStateResult> {
  validateCanonicalAppointment(input.appointment);
  requireFiniteTimestamp(input.observedAt, 'Cal observation timestamp');
  await requireActiveCompany(ctx, input.companyId);

  const state = appointmentState(input.appointment);
  const stateHash = await hashCanonicalContent(state);
  const existing = await findCalAppointment(
    ctx,
    input.companyId,
    input.appointment.providerOrganizationId,
    input.appointment.providerBookingUid,
  );
  if (!existing) {
    const superseding = await findCalSupersedingAppointment(
      ctx,
      input.companyId,
      input.appointment.providerOrganizationId,
      input.appointment.providerBookingUid,
    );
    if (
      superseding
      && compareProviderVersion(input.appointment, superseding) <= 0
    ) {
      const supersededState = {
        ...state,
        status: 'rescheduled',
        supersededByProviderBookingUid:
          String(superseding.providerBookingUid),
      };
      const observedAt = Math.max(
        input.observedAt,
        Number(superseding.lastObservedAt),
      );
      const appointmentId = await ctx.db.insert('appointments', {
        companyId: input.companyId,
        provider: 'cal.com',
        ...supersededState,
        stateHash: await hashCanonicalContent(supersededState),
        lastSyncSource: superseding.lastSyncSource,
        lastProviderEventId: superseding.lastProviderEventId,
        lastPayloadHash: superseding.lastPayloadHash,
        lastProviderOccurredAt: superseding.lastProviderOccurredAt,
        lastObservedAt: observedAt,
        createdAt: input.observedAt,
        updatedAt: observedAt,
      });
      return {
        applied: false,
        stale: true,
        unchanged: false,
        derivedSupersession: true,
        supersededByProviderBookingUid:
          String(superseding.providerBookingUid),
        appointmentId: appointmentId as GenericId<'appointments'>,
      };
    }
    const appointmentId = await ctx.db.insert('appointments', {
      companyId: input.companyId,
      provider: 'cal.com',
      ...state,
      stateHash,
      lastSyncSource: input.source,
      lastProviderEventId: input.sourceEventId,
      lastPayloadHash: input.sourcePayloadHash,
      lastProviderOccurredAt: input.appointment.providerOccurredAt,
      lastObservedAt: input.observedAt,
      createdAt: input.observedAt,
      updatedAt: input.observedAt,
    });
    return {
      applied: true,
      stale: false,
      unchanged: false,
      appointmentId: appointmentId as GenericId<'appointments'>,
    };
  }
  if (
    existing.companyId !== input.companyId
    || existing.providerOrganizationId
      !== input.appointment.providerOrganizationId
  ) {
    throw new EventIntegrityError('Cal appointment tenant ownership changed.');
  }

  const versionComparison = compareProviderVersion(
    input.appointment,
    existing,
  );
  if (versionComparison < 0) {
    return {
      applied: false,
      stale: true,
      unchanged: false,
      appointmentId: existing._id as GenericId<'appointments'>,
    };
  }
  if (versionComparison === 0) {
    if (existing.stateHash !== stateHash) {
      throw new EventIntegrityError(
        'Cal provider timestamp was reused with conflicting appointment state.',
      );
    }
    return {
      applied: false,
      stale: false,
      unchanged: true,
      appointmentId: existing._id as GenericId<'appointments'>,
    };
  }

  await ctx.db.patch(existing._id, {
    ...state,
    stateHash,
    lastSyncSource: input.source,
    lastProviderEventId: input.sourceEventId,
    lastPayloadHash: input.sourcePayloadHash,
    lastProviderOccurredAt: input.appointment.providerOccurredAt,
    lastObservedAt: input.observedAt,
    updatedAt: input.observedAt,
  });
  return {
    applied: true,
    stale: false,
    unchanged: false,
    appointmentId: existing._id as GenericId<'appointments'>,
  };
}

async function applyAppointmentStateWithSupersession(
  ctx: EventContext,
  input: {
    companyId: GenericId<'companies'>;
    appointment: CanonicalCalAppointmentState;
    source: 'webhook' | 'reconciliation';
    sourceEventId: string;
    sourcePayloadHash: string;
    observedAt: number;
  },
): Promise<AppointmentStateWithSupersessionResult> {
  const supersededUid = input.appointment.supersedesProviderBookingUid;
  if (!supersededUid) return applyAppointmentState(ctx, input);
  if (supersededUid === input.appointment.providerBookingUid) {
    throw new EventIntegrityError('Cal booking cannot supersede itself.');
  }

  const superseded = await findCalAppointment(
    ctx,
    input.companyId,
    input.appointment.providerOrganizationId,
    supersededUid,
  );
  let supersededVersionComparison: -1 | 0 | 1 | undefined;
  let supersessionAlreadyApplied = false;
  if (superseded) {
    if (
      superseded.companyId !== input.companyId
      || superseded.providerOrganizationId
        !== input.appointment.providerOrganizationId
    ) {
      throw new EventIntegrityError(
        'Cal reschedule chain violates the tenant boundary.',
      );
    }
    const existingSuperseder = await findCalSupersedingAppointment(
      ctx,
      input.companyId,
      input.appointment.providerOrganizationId,
      supersededUid,
    );
    if (
      existingSuperseder
      && existingSuperseder.providerBookingUid
        !== input.appointment.providerBookingUid
    ) {
      throw new EventIntegrityError(
        'Cal booking already has a different superseding appointment.',
      );
    }
    if (
      typeof superseded.supersededByProviderBookingUid === 'string'
      && superseded.supersededByProviderBookingUid
        !== input.appointment.providerBookingUid
    ) {
      throw new EventIntegrityError(
        'Cal reschedule would branch the existing appointment chain.',
      );
    }
    supersessionAlreadyApplied =
      superseded.status === 'rescheduled'
      && superseded.supersededByProviderBookingUid
        === input.appointment.providerBookingUid;

    supersededVersionComparison = compareProviderVersion(
      input.appointment,
      superseded,
    );
    if (supersededVersionComparison < 0) {
      return {
        applied: false,
        stale: true,
        unchanged: false,
        appointmentId: superseded._id as GenericId<'appointments'>,
      };
    }
  }

  const replacement = await applyAppointmentState(ctx, input);
  if (
    !superseded
    || supersessionAlreadyApplied
  ) {
    return replacement;
  }

  const supersededState = {
    providerOrganizationId: superseded.providerOrganizationId,
    providerBookingUid: superseded.providerBookingUid,
    providerBookingId: superseded.providerBookingId,
    providerEventTypeId: superseded.providerEventTypeId,
    title: superseded.title,
    startsAt: superseded.startsAt,
    endsAt: superseded.endsAt,
    timeZone: superseded.timeZone,
    status: 'rescheduled',
    ...(typeof superseded.iCalUid === 'string'
      ? { iCalUid: superseded.iCalUid }
      : {}),
    ...(typeof superseded.providerSequence === 'number'
      ? { providerSequence: superseded.providerSequence }
      : {}),
    ...(typeof superseded.supersedesProviderBookingUid === 'string'
      ? {
          supersedesProviderBookingUid:
            superseded.supersedesProviderBookingUid,
        }
      : {}),
    supersededByProviderBookingUid:
      input.appointment.providerBookingUid,
    participantCount: superseded.participantCount,
    participantTimeZones: superseded.participantTimeZones,
  };
  await ctx.db.patch(superseded._id, {
    status: 'rescheduled',
    supersededByProviderBookingUid:
      input.appointment.providerBookingUid,
    stateHash: await hashCanonicalContent(supersededState),
    lastSyncSource: input.source,
    lastProviderEventId: input.sourceEventId,
    lastPayloadHash: input.sourcePayloadHash,
    lastProviderOccurredAt: input.appointment.providerOccurredAt,
    lastObservedAt: input.observedAt,
    updatedAt: input.observedAt,
  });
  return {
    ...replacement,
    supersededAppointmentId:
      superseded._id as GenericId<'appointments'>,
  };
}

/**
 * Applies a signature-verified Cal webhook in the caller's transaction.
 * The global receipt binds the provider event to exactly one company.
 */
export async function applyCalAppointmentEvent(
  ctx: EventContext,
  input: {
    companyId: GenericId<'companies'>;
    eventId: string;
    payloadHash: string;
    receivedAt: number;
    appointment: CanonicalCalAppointmentState;
  },
): Promise<{
  applied: boolean;
  duplicate: boolean;
  stale: boolean;
  appointmentId: GenericId<'appointments'>;
}> {
  const eventId = requireNonEmpty(input.eventId, 'Cal event ID');
  const payloadHash = requireNonEmpty(input.payloadHash, 'Cal payload hash');
  validateCanonicalAppointment(input.appointment);
  requireFiniteTimestamp(input.receivedAt, 'Cal receivedAt');
  await requireActiveCompany(ctx, input.companyId);

  const receipt = await ctx.db
    .query('webhookReceipts')
    .withIndex(
      'by_provider_eventId',
      (query) => query.eq('provider', 'cal.com').eq('eventId', eventId),
    )
    .unique();
  if (receipt) {
    if (receipt.payloadHash !== payloadHash) {
      throw new EventIntegrityError(
        'Cal webhook event ID was replayed with different content.',
      );
    }
    if (receipt.companyId !== input.companyId) {
      throw new EventIntegrityError(
        'Cal webhook event was replayed across a tenant boundary.',
      );
    }
    let appointment = await findCalAppointment(
      ctx,
      input.companyId,
      input.appointment.providerOrganizationId,
      input.appointment.providerBookingUid,
    );
    if (
      !appointment
      && input.appointment.supersedesProviderBookingUid
    ) {
      appointment = await findCalAppointment(
        ctx,
        input.companyId,
        input.appointment.providerOrganizationId,
        input.appointment.supersedesProviderBookingUid,
      );
      if (
        appointment
        && appointment.providerOrganizationId
          !== input.appointment.providerOrganizationId
      ) {
        throw new EventIntegrityError(
          'Cal webhook replay violates the tenant boundary.',
        );
      }
    }
    if (!appointment) {
      throw new EventIntegrityError(
        'Cal webhook receipt exists without its canonical appointment.',
      );
    }
    return {
      applied: false,
      duplicate: true,
      stale: false,
      appointmentId: appointment._id as GenericId<'appointments'>,
    };
  }

  const stateResult = await applyAppointmentStateWithSupersession(ctx, {
    companyId: input.companyId,
    appointment: input.appointment,
    source: 'webhook',
    sourceEventId: eventId,
    sourcePayloadHash: payloadHash,
    observedAt: input.receivedAt,
  });
  const processedAt = input.receivedAt;
  await ctx.db.insert('webhookReceipts', {
    provider: 'cal.com',
    eventId,
    companyId: input.companyId,
    payloadHash,
    verificationStatus: 'verified',
    processingStatus: 'succeeded',
    attemptCount: 1,
    receivedAt: input.receivedAt,
    processedAt,
  });
  if (stateResult.derivedSupersession) {
    await appendDomainEvent(ctx, {
      eventId:
        `cal:webhook:${String(input.companyId)}:${eventId}:derived-superseded`,
      companyId: input.companyId,
      type: 'appointment.rescheduled',
      aggregateType: 'appointment',
      aggregateId: String(stateResult.appointmentId),
      payload: {
        provider: 'cal.com',
        providerBookingUid: input.appointment.providerBookingUid,
        supersededByProviderBookingUid:
          stateResult.supersededByProviderBookingUid,
      },
      occurredAt: input.appointment.providerOccurredAt,
    });
  } else if (stateResult.applied) {
    await appendDomainEvent(ctx, {
      eventId: `cal:webhook:${String(input.companyId)}:${eventId}`,
      companyId: input.companyId,
      type: `appointment.${input.appointment.status}`,
      aggregateType: 'appointment',
      aggregateId: String(stateResult.appointmentId),
      payload: {
        provider: 'cal.com',
        providerBookingUid: input.appointment.providerBookingUid,
        triggerEvent: input.appointment.triggerEvent,
        status: input.appointment.status,
        startsAt: input.appointment.startsAt,
        endsAt: input.appointment.endsAt,
        participantCount: input.appointment.participantCount,
      },
      occurredAt: input.appointment.providerOccurredAt,
    });
  }
  if (stateResult.supersededAppointmentId) {
    await appendDomainEvent(ctx, {
      eventId:
        `cal:webhook:${String(input.companyId)}:${eventId}:superseded`,
      companyId: input.companyId,
      type: 'appointment.rescheduled',
      aggregateType: 'appointment',
      aggregateId: String(stateResult.supersededAppointmentId),
      payload: {
        provider: 'cal.com',
        providerBookingUid:
          input.appointment.supersedesProviderBookingUid,
        supersededByProviderBookingUid:
          input.appointment.providerBookingUid,
      },
      occurredAt: input.appointment.providerOccurredAt,
    });
  }
  return {
    applied: stateResult.applied,
    duplicate: false,
    stale: stateResult.stale,
    appointmentId: stateResult.appointmentId,
  };
}

function isReconciliationResult(
  value: unknown,
): value is { applied: number; stale: number; unchanged: number } {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return Number.isInteger(result.applied)
    && Number.isInteger(result.stale)
    && Number.isInteger(result.unchanged);
}

/**
 * Applies one complete, tenant-scoped provider snapshot idempotently.
 * A newer webhook always wins over an older reconciliation record.
 */
export async function applyCalReconciliationSnapshot(
  ctx: EventContext,
  input: {
    companyId: GenericId<'companies'>;
    providerOrganizationId: string;
    runId: string;
    requestId?: string;
    observedAt: number;
    appointments: CanonicalCalAppointmentState[];
  },
): Promise<{ applied: number; stale: number; unchanged: number }> {
  const providerOrganizationId = requireNonEmpty(
    input.providerOrganizationId,
    'Cal organization ID',
  );
  const runId = requireNonEmpty(input.runId, 'Cal reconciliation run ID');
  requireFiniteTimestamp(input.observedAt, 'Cal reconciliation observedAt');
  if (input.appointments.length > 100) {
    throw new EventIntegrityError(
      'Cal reconciliation page exceeds the 100-appointment limit.',
    );
  }
  for (const appointment of input.appointments) {
    validateCanonicalAppointment(appointment, providerOrganizationId);
  }
  await requireActiveCompany(ctx, input.companyId);

  const idempotencyInput = {
    scope: 'cal.reconciliation.snapshot',
    key: `${String(input.companyId)}:${providerOrganizationId}:${runId}`,
    companyId: input.companyId,
    aggregateType: 'calOrganization',
    aggregateId: providerOrganizationId,
    request: {
      ...(input.requestId ? { requestId: input.requestId } : {}),
      appointments: input.appointments,
    },
    requestedAt: input.observedAt,
  };
  const claim = await claimIdempotencyKey(ctx, idempotencyInput);
  if (!claim.claimed) {
    if (!isReconciliationResult(claim.result)) {
      throw new EventIntegrityError(
        'Cal reconciliation replay does not have a completed result.',
      );
    }
    return claim.result;
  }

  const result = { applied: 0, stale: 0, unchanged: 0 };
  for (const appointment of input.appointments) {
    const sourceEventId =
      `cal:reconciliation:${runId}:${appointment.providerBookingUid}`;
    const sourcePayloadHash = await hashCanonicalContent(appointment);
    const stateResult = await applyAppointmentStateWithSupersession(ctx, {
      companyId: input.companyId,
      appointment,
      source: 'reconciliation',
      sourceEventId,
      sourcePayloadHash,
      observedAt: input.observedAt,
    });
    if (stateResult.applied) result.applied += 1;
    else if (stateResult.stale) result.stale += 1;
    else result.unchanged += 1;

    if (stateResult.applied) {
      await appendDomainEvent(ctx, {
        eventId:
          `cal:reconciliation:${String(input.companyId)}:${runId}:${appointment.providerBookingUid}`,
        companyId: input.companyId,
        type: 'appointment.reconciled',
        aggregateType: 'appointment',
        aggregateId: String(stateResult.appointmentId),
        payload: {
          provider: 'cal.com',
          providerBookingUid: appointment.providerBookingUid,
          status: appointment.status,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
        },
        occurredAt: appointment.providerOccurredAt,
      });
    }
  }
  await completeIdempotencyKey(ctx, {
    ...idempotencyInput,
    result,
    completedAt: input.observedAt,
  });
  return result;
}

type ScheduleCalReconciliation = (
  jobId: GenericId<'calReconciliationJobs'>,
  delayMs: number,
) => Promise<void>;

type ReconciliationJobStartInput = {
  companyId: GenericId<'companies'>;
  providerOrganizationId: string;
  runId: string;
  now: number;
  schedule: ScheduleCalReconciliation;
};

function requireReconciliationJob(
  job: StoredRecord | null,
): StoredRecord {
  if (!job) {
    throw new EventIntegrityError('Cal reconciliation job does not exist.');
  }
  return job;
}

function optionalStoredString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export async function startCalReconciliationJob(
  ctx: EventContext,
  input: ReconciliationJobStartInput,
): Promise<{
  created: boolean;
  jobId: GenericId<'calReconciliationJobs'>;
}> {
  const providerOrganizationId = requireNonEmpty(
    input.providerOrganizationId,
    'Cal organization ID',
  );
  const runId = requireNonEmpty(input.runId, 'Cal reconciliation run ID');
  requireFiniteTimestamp(input.now, 'Cal reconciliation start time');
  await requireActiveCompany(ctx, input.companyId);

  const existing = await ctx.db
    .query('calReconciliationJobs')
    .withIndex(
      'by_company_organization_run',
      (query) => query
        .eq('companyId', input.companyId)
        .eq('providerOrganizationId', providerOrganizationId)
        .eq('runId', runId),
    )
    .unique();
  if (existing) {
    if (existing.providerOrganizationId !== providerOrganizationId) {
      throw new EventIntegrityError(
        'Cal reconciliation run ID crossed an organization boundary.',
      );
    }
    const jobId = existing._id as GenericId<'calReconciliationJobs'>;
    if (existing.status !== 'completed' && existing.status !== 'failed') {
      await input.schedule(jobId, 0);
    }
    return { created: false, jobId };
  }

  const jobId = await ctx.db.insert('calReconciliationJobs', {
    companyId: input.companyId,
    providerOrganizationId,
    runId,
    bookingStatus: calReconciliationStatuses[0],
    status: 'pending',
    pageNumber: 0,
    pageFailureCount: 0,
    totalApplied: 0,
    totalStale: 0,
    totalUnchanged: 0,
    totalAppointments: 0,
    totalPages: 0,
    startedAt: input.now,
    updatedAt: input.now,
  }) as GenericId<'calReconciliationJobs'>;
  await input.schedule(jobId, 0);
  return { created: true, jobId };
}

export async function claimCalReconciliationPage(
  ctx: EventContext,
  input: {
    jobId: GenericId<'calReconciliationJobs'>;
    leaseToken: string;
    now: number;
    leaseDurationMs: number;
    schedule: ScheduleCalReconciliation;
  },
): Promise<{
  claimed: boolean;
  terminal?: boolean;
  bookingStatus?: CalReconciliationStatus;
  cursor?: string;
  pageNumber?: number;
  companyId?: GenericId<'companies'>;
  providerOrganizationId?: string;
  runId?: string;
}> {
  const job = requireReconciliationJob(await ctx.db.get(input.jobId));
  requireFiniteTimestamp(input.now, 'Cal reconciliation claim time');
  const leaseToken = requireNonEmpty(
    input.leaseToken,
    'Cal reconciliation lease token',
  );
  if (!Number.isFinite(input.leaseDurationMs) || input.leaseDurationMs <= 0) {
    throw new EventIntegrityError(
      'Cal reconciliation lease duration must be positive.',
    );
  }
  if (job.status === 'completed' || job.status === 'failed') {
    return { claimed: false, terminal: true };
  }
  const pageNumber = Number(job.pageNumber);
  if (
    !Number.isInteger(pageNumber)
    || pageNumber < 0
    || pageNumber >= maxCalReconciliationPages
  ) {
    await ctx.db.patch(input.jobId, {
      status: 'failed',
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      nextAttemptAt: undefined,
      updatedAt: input.now,
      completedAt: input.now,
    });
    return { claimed: false, terminal: true };
  }
  const nextAttemptAt = Number(job.nextAttemptAt ?? 0);
  if (nextAttemptAt > input.now) {
    await input.schedule(input.jobId, nextAttemptAt - input.now);
    return { claimed: false };
  }
  const leaseExpiresAt = Number(job.leaseExpiresAt ?? 0);
  if (job.status === 'running' && leaseExpiresAt > input.now) {
    return { claimed: false };
  }

  const bookingStatus = String(job.bookingStatus) as CalReconciliationStatus;
  if (!calReconciliationStatuses.includes(bookingStatus)) {
    throw new EventIntegrityError(
      'Cal reconciliation job has an invalid booking status.',
    );
  }
  await ctx.db.patch(input.jobId, {
    status: 'running',
    leaseToken,
    leaseExpiresAt: input.now + input.leaseDurationMs,
    nextAttemptAt: undefined,
    updatedAt: input.now,
  });
  await input.schedule(input.jobId, input.leaseDurationMs);
  return {
    claimed: true,
    bookingStatus,
    cursor: optionalStoredString(job.cursor),
    pageNumber,
    companyId: job.companyId as GenericId<'companies'>,
    providerOrganizationId: String(job.providerOrganizationId),
    runId: String(job.runId),
  };
}

export async function persistCalReconciliationPage(
  ctx: EventContext,
  input: {
    jobId: GenericId<'calReconciliationJobs'>;
    leaseToken: string;
    requestId: string;
    expectedBookingStatus: CalReconciliationStatus;
    expectedCursor?: string;
    expectedPageNumber: number;
    observedAt: number;
    appointments: CanonicalCalAppointmentState[];
    hasMore: boolean;
    nextCursor?: string;
    schedule: ScheduleCalReconciliation;
  },
): Promise<{
  applied: number;
  stale: number;
  unchanged: number;
  done: boolean;
  terminal?: boolean;
  nextCursor?: string;
}> {
  const job = requireReconciliationJob(await ctx.db.get(input.jobId));
  requireFiniteTimestamp(input.observedAt, 'Cal reconciliation observation time');
  const leaseToken = requireNonEmpty(
    input.leaseToken,
    'Cal reconciliation lease token',
  );
  const requestId = requireNonEmpty(
    input.requestId,
    'Cal reconciliation request ID',
  );
  if (
    job.status !== 'running'
    || job.leaseToken !== leaseToken
    || Number(job.leaseExpiresAt) <= input.observedAt
  ) {
    throw new EventIntegrityError(
      'Cal reconciliation page lease is no longer valid.',
    );
  }
  if (
    job.bookingStatus !== input.expectedBookingStatus
    || optionalStoredString(job.cursor) !== input.expectedCursor
    || Number(job.pageNumber) !== input.expectedPageNumber
  ) {
    throw new EventIntegrityError(
      'Cal reconciliation page does not match its durable checkpoint.',
    );
  }
  if (
    !Number.isInteger(input.expectedPageNumber)
    || input.expectedPageNumber < 0
    || input.expectedPageNumber >= maxCalReconciliationPages
  ) {
    throw new EventIntegrityError(
      'Cal reconciliation exceeded the bounded page count.',
    );
  }
  if (
    input.appointments.length > 100
    || (input.hasMore && !input.nextCursor)
    || (!input.hasMore && input.nextCursor !== undefined)
    || input.nextCursor === input.expectedCursor
  ) {
    throw new EventIntegrityError(
      'Cal reconciliation page cursor contract is invalid.',
    );
  }

  const pageKey = [
    String(job.runId),
    input.expectedBookingStatus,
    String(input.expectedPageNumber),
    input.expectedCursor ?? 'first',
  ].join(':');
  const result = await applyCalReconciliationSnapshot(ctx, {
    companyId: job.companyId as GenericId<'companies'>,
    providerOrganizationId: String(job.providerOrganizationId),
    runId: pageKey,
    requestId,
    observedAt: input.observedAt,
    appointments: input.appointments,
  });
  const totals = {
    totalApplied: Number(job.totalApplied) + result.applied,
    totalStale: Number(job.totalStale) + result.stale,
    totalUnchanged: Number(job.totalUnchanged) + result.unchanged,
    totalAppointments:
      Number(job.totalAppointments) + input.appointments.length,
    totalPages: Number(job.totalPages) + 1,
  };
  if (
    input.hasMore
    && input.expectedPageNumber === maxCalReconciliationPages - 1
  ) {
    await ctx.db.patch(input.jobId, {
      ...totals,
      status: 'failed',
      cursor: undefined,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      nextAttemptAt: undefined,
      lastRequestId: requestId,
      updatedAt: input.observedAt,
      completedAt: input.observedAt,
    });
    return { ...result, done: true, terminal: true };
  }
  if (input.hasMore) {
    await ctx.db.patch(input.jobId, {
      ...totals,
      status: 'pending',
      cursor: input.nextCursor,
      pageNumber: input.expectedPageNumber + 1,
      pageFailureCount: 0,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      lastRequestId: requestId,
      updatedAt: input.observedAt,
    });
    await input.schedule(input.jobId, 0);
    return { ...result, done: false, nextCursor: input.nextCursor };
  }

  const currentStatusIndex = calReconciliationStatuses.indexOf(
    input.expectedBookingStatus,
  );
  const nextStatus = calReconciliationStatuses[currentStatusIndex + 1];
  if (nextStatus) {
    await ctx.db.patch(input.jobId, {
      ...totals,
      status: 'pending',
      bookingStatus: nextStatus,
      cursor: undefined,
      pageNumber: 0,
      pageFailureCount: 0,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      lastRequestId: requestId,
      updatedAt: input.observedAt,
    });
    await input.schedule(input.jobId, 0);
    return { ...result, done: false };
  }

  await ctx.db.patch(input.jobId, {
    ...totals,
    status: 'completed',
    cursor: undefined,
    leaseToken: undefined,
    leaseExpiresAt: undefined,
    lastRequestId: requestId,
    updatedAt: input.observedAt,
    completedAt: input.observedAt,
  });
  return { ...result, done: true };
}

export async function failCalReconciliationPage(
  ctx: EventContext,
  input: {
    jobId: GenericId<'calReconciliationJobs'>;
    leaseToken: string;
    now: number;
    retryable: boolean;
    schedule: ScheduleCalReconciliation;
  },
): Promise<{ terminal: boolean; retryAfterMs: number }> {
  const job = requireReconciliationJob(await ctx.db.get(input.jobId));
  requireFiniteTimestamp(input.now, 'Cal reconciliation failure time');
  const leaseToken = requireNonEmpty(
    input.leaseToken,
    'Cal reconciliation lease token',
  );
  if (job.status === 'completed' || job.status === 'failed') {
    return { terminal: true, retryAfterMs: 0 };
  }
  if (
    job.status !== 'running'
    || job.leaseToken !== leaseToken
    || Number(job.leaseExpiresAt) <= input.now
  ) {
    return { terminal: false, retryAfterMs: 0 };
  }
  const failureCount = Number(job.pageFailureCount ?? 0) + 1;
  if (!input.retryable || failureCount >= 5) {
    await ctx.db.patch(input.jobId, {
      status: 'failed',
      pageFailureCount: failureCount,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      nextAttemptAt: undefined,
      updatedAt: input.now,
      completedAt: input.now,
    });
    return { terminal: true, retryAfterMs: 0 };
  }
  const retryAfterMs = Math.min(
    60_000 * (2 ** (failureCount - 1)),
    15 * 60_000,
  );
  await ctx.db.patch(input.jobId, {
    status: 'pending',
    pageFailureCount: failureCount,
    leaseToken: undefined,
    leaseExpiresAt: undefined,
    nextAttemptAt: input.now + retryAfterMs,
    updatedAt: input.now,
  });
  await input.schedule(input.jobId, retryAfterMs);
  return { terminal: false, retryAfterMs };
}
