import type { GenericId } from 'convex/values';

type IndexQuery = { eq(field: string, value: unknown): IndexQuery };
type StoredRecord = Record<string, unknown> & { _id: GenericId<string> };
type EventDatabase = {
  query(table: string): {
    withIndex(name: string, build: (query: IndexQuery) => unknown): { unique(): Promise<StoredRecord | null> };
  };
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
