import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { appendAuditFact } from './lib/audit';
import { requireCompanyMembership } from './lib/authz';
import {
  appendDomainEvent,
  claimIdempotencyKey,
  completeIdempotencyKey,
  type EventContext,
} from './lib/events';

const acquisitionLane = v.union(
  v.literal('high_access'),
  v.literal('property_facility'),
  v.literal('subcontract_referral'),
  v.literal('affluent_residential'),
  v.literal('public_institutional')
);

const acquisitionLeadStatus = v.union(
  v.literal('discovered'),
  v.literal('verified'),
  v.literal('qualified'),
  v.literal('contacted'),
  v.literal('replied'),
  v.literal('estimate_requested'),
  v.literal('won'),
  v.literal('lost'),
  v.literal('suppressed')
);

const scoreDisposition = v.union(
  v.literal('work_now'),
  v.literal('monitor'),
  v.literal('low_priority'),
  v.literal('blocked')
);

const scoreInput = v.object({
  serviceFit: v.number(),
  urgency: v.number(),
  geography: v.number(),
  contactQuality: v.number(),
  proofMatch: v.number(),
  operationalFit: v.number(),
});

type AcquisitionLeadStatus =
  | 'discovered'
  | 'verified'
  | 'qualified'
  | 'contacted'
  | 'replied'
  | 'estimate_requested'
  | 'won'
  | 'lost'
  | 'suppressed';

type ScoreComponents = {
  serviceFit: number;
  urgency: number;
  geography: number;
  contactQuality: number;
  proofMatch: number;
  operationalFit: number;
};

export const LEAD_STATUS_TRANSITIONS = {
  discovered: ['verified', 'suppressed'],
  verified: ['qualified', 'suppressed'],
  qualified: ['contacted', 'suppressed'],
  contacted: ['replied', 'lost', 'suppressed'],
  replied: ['estimate_requested', 'lost', 'suppressed'],
  estimate_requested: ['won', 'lost'],
  won: [],
  lost: [],
  suppressed: [],
} as const satisfies Record<AcquisitionLeadStatus, readonly AcquisitionLeadStatus[]>;

export function isLeadTransitionAllowed(
  currentStatus: AcquisitionLeadStatus,
  nextStatus: AcquisitionLeadStatus
) {
  return LEAD_STATUS_TRANSITIONS[currentStatus].some(
    (allowedStatus) => allowedStatus === nextStatus
  );
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildLeadDedupeKey(input: {
  companyName?: string;
  city?: string;
  publicEmail?: string;
}) {
  const publicEmail = input.publicEmail?.trim().toLowerCase();
  if (publicEmail) return `email:${publicEmail}`;

  const companyName = normalizeSlug(input.companyName ?? '');
  if (!companyName) {
    throw new Error('A public email or company name is required to identify a lead.');
  }
  return `business:${companyName}|${normalizeSlug(input.city ?? '')}`;
}

function buildBusinessDedupeKey(input: { companyName?: string; city?: string }) {
  const companyName = normalizeSlug(input.companyName ?? '');
  return companyName ? `business:${companyName}|${normalizeSlug(input.city ?? '')}` : undefined;
}

function identityKeysForLead(lead: Pick<Doc<'leads'>, 'dedupeKey' | 'companyName' | 'city' | 'publicEmail'>) {
  const keys = new Set<string>();
  if (lead.dedupeKey) keys.add(lead.dedupeKey);
  const businessKey = buildBusinessDedupeKey(lead);
  if (businessKey) keys.add(businessKey);
  const publicEmail = lead.publicEmail?.trim().toLowerCase();
  if (publicEmail) keys.add(`email:${publicEmail}`);
  return [...keys];
}

export function compactCommandValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const item of value) {
      if (item !== undefined) result.push(compactCommandValue(item));
    }
    return result;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) result[key] = compactCommandValue(item);
    }
    return result;
  }
  return value;
}

export function requireRunCompletionEvidence(
  status: 'succeeded' | 'partial' | 'failed' | 'no_change',
  receipt: unknown,
  lastError: string | undefined
) {
  if ((status === 'succeeded' || status === 'partial') && (receipt === undefined || receipt === null)) {
    throw new Error(`${status} acquisition runs require a durable execution receipt.`);
  }
  if (status === 'failed' && !lastError?.trim()) {
    throw new Error('Failed acquisition runs require a recorded error.');
  }
}

export function buildCompanyRequestKey(companyId: string, requestId: string) {
  return `${companyId}:${requestId}`;
}

function assertScoreComponent(name: keyof ScoreComponents, value: number, max: number) {
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new Error(`${name} must be an integer from 0 to ${max}.`);
  }
}

export function scoreLead(input: ScoreComponents & { blockers: readonly string[] }) {
  assertScoreComponent('serviceFit', input.serviceFit, 30);
  assertScoreComponent('urgency', input.urgency, 20);
  assertScoreComponent('geography', input.geography, 15);
  assertScoreComponent('contactQuality', input.contactQuality, 15);
  assertScoreComponent('proofMatch', input.proofMatch, 10);
  assertScoreComponent('operationalFit', input.operationalFit, 10);
  const total =
    input.serviceFit +
    input.urgency +
    input.geography +
    input.contactQuality +
    input.proofMatch +
    input.operationalFit;
  if (input.blockers.length > 0) {
    return { total, disposition: 'blocked' as const, actionable: false };
  }
  if (total >= 70) {
    return { total, disposition: 'work_now' as const, actionable: true };
  }
  if (total >= 50) {
    return { total, disposition: 'monitor' as const, actionable: false };
  }
  return { total, disposition: 'low_priority' as const, actionable: false };
}

function requireRequestId(value: string) {
  const requestId = value.trim();
  if (!requestId || requestId.length > 200) {
    throw new Error('A request ID between 1 and 200 characters is required.');
  }
  return requestId;
}

function assertLeadStatus(value: string): asserts value is AcquisitionLeadStatus {
  if (!Object.hasOwn(LEAD_STATUS_TRANSITIONS, value)) {
    throw new Error(`Lead status ${value} is outside the acquisition lifecycle.`);
  }
}

function addBusinessDays(timestamp: number, businessDays: number) {
  const result = new Date(timestamp);
  let remaining = businessDays;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result.getTime();
}

async function activeSuppressionForKeys(
  ctx: MutationCtx,
  companyId: Id<'companies'>,
  keys: readonly string[],
  now: number
) {
  for (const key of new Set(keys)) {
    const suppression = await ctx.db
      .query('acquisitionSuppressions')
      .withIndex('by_company_key', (q) => q.eq('companyId', companyId).eq('key', key))
      .unique();
    if (suppression && (suppression.expiresAt === undefined || suppression.expiresAt > now)) {
      return suppression;
    }
  }
  return null;
}

async function ensureSuppressions(
  ctx: MutationCtx,
  input: {
    companyId: Id<'companies'>;
    keys: readonly string[];
    reason: string;
    source: 'reply' | 'bounce' | 'opt_out' | 'manual' | 'policy';
    createdAt: number;
  }
) {
  for (const key of new Set(input.keys)) {
    const existing = await ctx.db
      .query('acquisitionSuppressions')
      .withIndex('by_company_key', (q) => q.eq('companyId', input.companyId).eq('key', key))
      .unique();
    if (!existing) {
      await ctx.db.insert('acquisitionSuppressions', {
        companyId: input.companyId,
        key,
        reason: input.reason,
        source: input.source,
        createdAt: input.createdAt,
      });
    }
  }
}

async function leadForIdentityKeys(
  ctx: MutationCtx,
  companyId: Id<'companies'>,
  keys: readonly string[]
) {
  let lead: Doc<'leads'> | null = null;
  for (const key of new Set(keys)) {
    const identity = await ctx.db
      .query('acquisitionLeadIdentities')
      .withIndex('by_company_key', (q) => q.eq('companyId', companyId).eq('key', key))
      .unique();
    if (!identity) continue;
    const candidate = await ctx.db.get(identity.leadId);
    if (!candidate || candidate.companyId !== companyId) {
      throw new Error('Lead identity points outside the active company.');
    }
    if (lead && lead._id !== candidate._id) {
      throw new Error('Lead identity keys resolve to different records; merge review is required.');
    }
    lead = candidate;
  }
  return lead;
}

async function ensureLeadIdentityKeys(
  ctx: MutationCtx,
  companyId: Id<'companies'>,
  leadId: Id<'leads'>,
  keys: readonly string[],
  createdAt: number
) {
  for (const key of new Set(keys)) {
    const existing = await ctx.db
      .query('acquisitionLeadIdentities')
      .withIndex('by_company_key', (q) => q.eq('companyId', companyId).eq('key', key))
      .unique();
    if (existing && existing.leadId !== leadId) {
      throw new Error('Lead identity key is already assigned to a different lead.');
    }
    if (!existing) {
      await ctx.db.insert('acquisitionLeadIdentities', { companyId, key, leadId, createdAt });
    }
  }
}

async function finishCommand(
  ctx: Parameters<typeof appendDomainEvent>[0],
  input: {
    scope: string;
    requestId: string;
    companyId: Id<'companies'>;
    aggregateType: string;
    aggregateId: string;
    request: unknown;
    result: unknown;
    occurredAt: number;
  }
) {
  await completeIdempotencyKey(ctx, {
    scope: input.scope,
    key: buildCompanyRequestKey(String(input.companyId), input.requestId),
    companyId: input.companyId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    request: input.request,
    requestedAt: input.occurredAt,
    completedAt: input.occurredAt,
    result: input.result,
  });
}

export const upsertLead = mutation({
  args: {
    companyId: v.id('companies'),
    requestId: v.string(),
    source: v.string(),
    companyName: v.optional(v.string()),
    city: v.optional(v.string()),
    publicEmail: v.optional(v.string()),
    publicContactUrl: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    lane: acquisitionLane,
    verified: v.boolean(),
    scoreInput,
    blockers: v.array(v.string()),
    nextAction: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    createdByRunId: v.optional(v.string()),
  },
  returns: v.object({
    leadId: v.id('leads'),
    created: v.boolean(),
    status: acquisitionLeadStatus,
    score: v.number(),
    disposition: scoreDisposition,
    actionable: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const requestId = requireRequestId(args.requestId);
    const occurredAt = Date.now();
    const dedupeKey = buildLeadDedupeKey(args);
    const businessDedupeKey = buildBusinessDedupeKey(args);
    const identityKeys = businessDedupeKey && businessDedupeKey !== dedupeKey
      ? [dedupeKey, businessDedupeKey]
      : [dedupeKey];
    const publicEmail = args.publicEmail?.trim().toLowerCase();
    const commandRequest = compactCommandValue({
      dedupeKey,
      source: args.source.trim(),
      companyName: args.companyName?.trim(),
      city: args.city?.trim(),
      publicEmail,
      publicContactUrl: args.publicContactUrl,
      sourceUrl: args.sourceUrl,
      lane: args.lane,
      verified: args.verified,
      scoreInput: args.scoreInput,
      blockers: args.blockers,
      nextAction: args.nextAction,
      nextActionAt: args.nextActionAt,
      createdByRunId: args.createdByRunId,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.lead.upsert',
      key: buildCompanyRequestKey(String(args.companyId), requestId),
      companyId: args.companyId,
      aggregateType: 'lead_dedupe',
      aggregateId: dedupeKey,
      request: commandRequest,
      requestedAt: occurredAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The lead upsert is already in progress.');
      return claim.result as {
        leadId: Id<'leads'>;
        created: boolean;
        status: AcquisitionLeadStatus;
        score: number;
        disposition: 'work_now' | 'monitor' | 'low_priority' | 'blocked';
        actionable: boolean;
      };
    }

    const suppression = await activeSuppressionForKeys(ctx, args.companyId, identityKeys, occurredAt);
    const effectiveBlockers = suppression
      ? [...args.blockers, `suppressed: ${suppression.reason}`]
      : args.blockers;
    const scoring = scoreLead({ ...args.scoreInput, blockers: effectiveBlockers });
    const status: AcquisitionLeadStatus = suppression
      ? 'suppressed'
      : args.verified ? 'verified' : 'discovered';

    const identityExisting = await leadForIdentityKeys(ctx, args.companyId, identityKeys);
    const primaryExisting = await ctx.db
      .query('leads')
      .withIndex('by_company_dedupeKey', (q) =>
        q.eq('companyId', args.companyId).eq('dedupeKey', dedupeKey)
      )
      .unique();
    const businessExisting = businessDedupeKey && businessDedupeKey !== dedupeKey
      ? await ctx.db
          .query('leads')
          .withIndex('by_company_dedupeKey', (q) =>
            q.eq('companyId', args.companyId).eq('dedupeKey', businessDedupeKey)
          )
          .unique()
      : null;
    if (primaryExisting && businessExisting && primaryExisting._id !== businessExisting._id) {
      throw new Error('Lead identity enrichment conflicts with two existing records; merge review is required.');
    }
    const resolvedIds = new Set(
      [identityExisting?._id, primaryExisting?._id, businessExisting?._id]
        .flatMap((id) => id === undefined ? [] : [id])
    );
    if (resolvedIds.size > 1) {
      throw new Error('Lead identity enrichment conflicts with existing records; merge review is required.');
    }
    const existing = identityExisting ?? primaryExisting ?? businessExisting;
    let leadId: Id<'leads'>;
    let created = false;
    if (existing) {
      leadId = existing._id;
      await ctx.db.patch(leadId, {
        companyName: args.companyName?.trim() ?? existing.companyName,
        city: args.city?.trim() ?? existing.city,
        publicEmail: publicEmail ?? existing.publicEmail,
        publicContactUrl: args.publicContactUrl ?? existing.publicContactUrl,
        sourceUrl: args.sourceUrl ?? existing.sourceUrl,
        dedupeKey: publicEmail || !existing.publicEmail ? dedupeKey : existing.dedupeKey,
        lane: args.lane,
        score: scoring.total,
        scoreBreakdown: args.scoreInput,
        scoreDisposition: scoring.disposition,
        blockers: effectiveBlockers,
        nextAction: args.nextAction,
        nextActionAt: args.nextActionAt,
        status: suppression && existing.status !== 'won' && existing.status !== 'lost'
          ? 'suppressed'
          : existing.status,
        stopReason: suppression?.reason ?? existing.stopReason,
        updatedAt: occurredAt,
      });
      assertLeadStatus(existing.status);
    } else {
      created = true;
      leadId = await ctx.db.insert('leads', {
        companyId: args.companyId,
        companyName: args.companyName?.trim(),
        city: args.city?.trim(),
        publicEmail,
        publicContactUrl: args.publicContactUrl,
        sourceUrl: args.sourceUrl,
        dedupeKey,
        lane: args.lane,
        score: scoring.total,
        scoreBreakdown: args.scoreInput,
        scoreDisposition: scoring.disposition,
        blockers: effectiveBlockers,
        nextAction: args.nextAction,
        nextActionAt: args.nextActionAt,
        createdByRunId: args.createdByRunId,
        source: args.source.trim(),
        status,
        stopReason: suppression?.reason,
        submittedAt: occurredAt,
        updatedAt: occurredAt,
      });
    }
    const resultingStatus = existing
      ? (suppression && existing.status !== 'won' && existing.status !== 'lost'
          ? 'suppressed'
          : existing.status as AcquisitionLeadStatus)
      : status;
    await ensureLeadIdentityKeys(
      ctx,
      args.companyId,
      leadId,
      existing?.dedupeKey && !identityKeys.includes(existing.dedupeKey)
        ? [...identityKeys, existing.dedupeKey]
        : identityKeys,
      occurredAt
    );
    const result = {
      leadId,
      created,
      status: resultingStatus,
      score: scoring.total,
      disposition: scoring.disposition,
      actionable: scoring.actionable,
    };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.lead.upsert:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: created ? 'lead.discovered' : 'lead.refreshed',
      aggregateType: 'lead',
      aggregateId: String(leadId),
      payload: { actorUserId: access.user._id, requestId, dedupeKey, scoring },
      occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: created ? 'lead.discovered' : 'lead.refreshed',
      entityType: 'lead',
      entityId: leadId,
      requestId,
      metadata: { dedupeKey, lane: args.lane, scoring },
      occurredAt,
    });
    await finishCommand(eventContext, {
      scope: 'acquisition.lead.upsert',
      requestId,
      companyId: args.companyId,
      aggregateType: 'lead_dedupe',
      aggregateId: dedupeKey,
      request: commandRequest,
      result,
      occurredAt,
    });
    return result;
  },
});

export const transitionLead = mutation({
  args: {
    companyId: v.id('companies'),
    leadId: v.id('leads'),
    expectedStatus: acquisitionLeadStatus,
    nextStatus: acquisitionLeadStatus,
    requestId: v.string(),
    nextAction: v.optional(v.string()),
    nextActionAt: v.optional(v.number()),
    stopReason: v.optional(v.string()),
  },
  returns: v.object({ leadId: v.id('leads'), status: acquisitionLeadStatus }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.companyId !== args.companyId) throw new Error('Lead access is denied.');
    assertLeadStatus(lead.status);
    const requestId = requireRequestId(args.requestId);
    const occurredAt = Date.now();
    const request = compactCommandValue({
      expectedStatus: args.expectedStatus,
      nextStatus: args.nextStatus,
      nextAction: args.nextAction,
      nextActionAt: args.nextActionAt,
      stopReason: args.stopReason,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.lead.transition',
      key: buildCompanyRequestKey(String(args.companyId), requestId),
      companyId: args.companyId,
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      request,
      requestedAt: occurredAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The lead transition is already in progress.');
      return claim.result as { leadId: Id<'leads'>; status: AcquisitionLeadStatus };
    }
    if (lead.status !== args.expectedStatus) {
      throw new Error(`Lead status changed from ${args.expectedStatus} to ${lead.status}. Refresh and retry.`);
    }
    if (!isLeadTransitionAllowed(lead.status, args.nextStatus)) {
      throw new Error(`Lead cannot move from ${lead.status} to ${args.nextStatus}.`);
    }
    const stopReason = args.stopReason?.trim();
    if (args.nextStatus === 'suppressed' && !stopReason) {
      throw new Error('A stop reason is required when suppressing a lead.');
    }
    await ctx.db.patch(args.leadId, {
      status: args.nextStatus,
      nextAction: args.nextAction,
      nextActionAt: args.nextStatus === 'suppressed' ? undefined : args.nextActionAt,
      stopReason,
      updatedAt: occurredAt,
    });
    if (args.nextStatus === 'suppressed' && lead.dedupeKey) {
      await ensureSuppressions(ctx, {
        companyId: args.companyId,
        keys: identityKeysForLead(lead),
        reason: stopReason as string,
        source: 'manual',
        createdAt: occurredAt,
      });
    }
    const result = { leadId: args.leadId, status: args.nextStatus };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.lead.transition:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'lead.status_updated',
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      payload: { actorUserId: access.user._id, requestId, transition: request },
      occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'lead.status_updated',
      entityType: 'lead',
      entityId: args.leadId,
      requestId,
      metadata: request,
      occurredAt,
    });
    await finishCommand(eventContext, {
      scope: 'acquisition.lead.transition',
      requestId,
      companyId: args.companyId,
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      request,
      result,
      occurredAt,
    });
    return result;
  },
});

const touchChannel = v.union(
  v.literal('email'),
  v.literal('facebook'),
  v.literal('website'),
  v.literal('bid_portal'),
  v.literal('phone'),
  v.literal('sms'),
  v.literal('in_person')
);
const touchStatus = v.union(
  v.literal('planned'),
  v.literal('sent'),
  v.literal('delivered'),
  v.literal('replied'),
  v.literal('bounced'),
  v.literal('opted_out'),
  v.literal('failed')
);

export const recordTouch = mutation({
  args: {
    companyId: v.id('companies'),
    leadId: v.id('leads'),
    requestId: v.string(),
    channel: touchChannel,
    direction: v.union(v.literal('inbound'), v.literal('outbound'), v.literal('system')),
    status: touchStatus,
    summary: v.string(),
    externalId: v.optional(v.string()),
    occurredAt: v.number(),
    followUpAt: v.optional(v.number()),
    runId: v.optional(v.string()),
  },
  returns: v.object({ touchId: v.id('acquisitionTouches'), leadStatus: acquisitionLeadStatus }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.companyId !== args.companyId) throw new Error('Lead access is denied.');
    assertLeadStatus(lead.status);
    const requestId = requireRequestId(args.requestId);
    if (!args.summary.trim()) throw new Error('A touch summary is required.');
    const request = compactCommandValue({
      leadId: args.leadId,
      channel: args.channel,
      direction: args.direction,
      status: args.status,
      summary: args.summary.trim(),
      externalId: args.externalId,
      occurredAt: args.occurredAt,
      followUpAt: args.followUpAt,
      runId: args.runId,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.touch.record',
      key: buildCompanyRequestKey(String(args.companyId), requestId),
      companyId: args.companyId,
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      request,
      requestedAt: args.occurredAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The touch is already being recorded.');
      return claim.result as { touchId: Id<'acquisitionTouches'>; leadStatus: AcquisitionLeadStatus };
    }
    const isDeliveredOutbound = args.direction === 'outbound' &&
      (args.status === 'sent' || args.status === 'delivered');
    if (isDeliveredOutbound && (lead.status === 'won' || lead.status === 'lost' || lead.status === 'suppressed')) {
      throw new Error(`Outbound contact is blocked for ${lead.status} leads.`);
    }
    const identityKeys = identityKeysForLead(lead);
    if (isDeliveredOutbound) {
      const suppression = await activeSuppressionForKeys(ctx, args.companyId, identityKeys, args.occurredAt);
      if (suppression) throw new Error(`Outbound contact is suppressed: ${suppression.reason}`);
      if (args.followUpAt === undefined) {
        throw new Error('Successful outbound contact requires a five-business-day follow-up date.');
      }
      const priorOutbound = await ctx.db
        .query('acquisitionTouches')
        .withIndex('by_lead_deliveredOutbound_and_occurredAt', (q) =>
          q.eq('leadId', args.leadId).eq('isDeliveredOutbound', true)
        )
        .order('desc')
        .first();
      if (priorOutbound && args.occurredAt < addBusinessDays(priorOutbound.occurredAt, 5)) {
        throw new Error('Outbound contact is still inside the five-business-day cooldown.');
      }
    }
    if (
      isDeliveredOutbound &&
      args.followUpAt !== undefined &&
      args.followUpAt < addBusinessDays(args.occurredAt, 5)
    ) {
      throw new Error('Outbound follow-up must allow at least five business days.');
    }
    const touchId = await ctx.db.insert('acquisitionTouches', {
      companyId: args.companyId,
      leadId: args.leadId,
      channel: args.channel,
      direction: args.direction,
      status: args.status,
      isDeliveredOutbound,
      summary: args.summary.trim(),
      externalId: args.externalId,
      idempotencyKey: requestId,
      occurredAt: args.occurredAt,
      followUpAt: args.followUpAt,
      runId: args.runId,
    });
    let nextStatus = lead.status;
    if (
      lead.status === 'qualified' &&
      args.direction === 'outbound' &&
      (args.status === 'sent' || args.status === 'delivered')
    ) {
      nextStatus = 'contacted';
    } else if (lead.status === 'contacted' && args.status === 'replied') {
      nextStatus = 'replied';
    } else if (
      args.status === 'bounced' ||
      args.status === 'opted_out'
    ) {
      if (isLeadTransitionAllowed(lead.status, 'suppressed')) nextStatus = 'suppressed';
    }
    const stopReason =
      args.status === 'bounced'
        ? 'Public contact route bounced'
        : args.status === 'opted_out'
          ? 'Recipient opted out'
          : undefined;
    await ctx.db.patch(args.leadId, {
      status: nextStatus,
      lastTouchedAt: args.occurredAt,
      nextActionAt: nextStatus === 'suppressed' ? undefined : args.followUpAt,
      stopReason: nextStatus === 'suppressed' ? stopReason : lead.stopReason,
      updatedAt: args.occurredAt,
    });
    if (nextStatus === 'suppressed' && identityKeys.length > 0) {
      await ensureSuppressions(ctx, {
        companyId: args.companyId,
        keys: identityKeys,
        reason: stopReason ?? 'Suppressed by touch outcome',
        source: args.status === 'bounced' ? 'bounce' : 'opt_out',
        createdAt: args.occurredAt,
      });
    }
    const result = { touchId, leadStatus: nextStatus };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.touch.record:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'lead.touch_recorded',
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      payload: { actorUserId: access.user._id, requestId, touchId, status: args.status },
      occurredAt: args.occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'lead.touch_recorded',
      entityType: 'lead',
      entityId: args.leadId,
      requestId,
      metadata: { touchId, channel: args.channel, status: args.status, nextStatus },
      occurredAt: args.occurredAt,
    });
    await finishCommand(eventContext, {
      scope: 'acquisition.touch.record',
      requestId,
      companyId: args.companyId,
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      request,
      result,
      occurredAt: args.occurredAt,
    });
    return result;
  },
});

const signalType = v.union(
  v.literal('inbound'),
  v.literal('permit'),
  v.literal('planning'),
  v.literal('public_bid'),
  v.literal('bid_award'),
  v.literal('property_event'),
  v.literal('storm'),
  v.literal('referral'),
  v.literal('directory'),
  v.literal('engagement')
);

export const recordSignal = mutation({
  args: {
    companyId: v.id('companies'),
    requestId: v.string(),
    signalKey: v.string(),
    type: signalType,
    title: v.string(),
    sourceUrl: v.string(),
    location: v.optional(v.string()),
    score: v.optional(v.number()),
    dueAt: v.optional(v.number()),
    detectedAt: v.number(),
    metadata: v.optional(v.any()),
  },
  returns: v.object({ signalId: v.id('acquisitionSignals'), created: v.boolean() }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const requestId = requireRequestId(args.requestId);
    const signalKey = args.signalKey.trim();
    if (!signalKey || !args.title.trim() || !args.sourceUrl.trim()) {
      throw new Error('Signal key, title, and source URL are required.');
    }
    const request = compactCommandValue({
      signalKey,
      type: args.type,
      title: args.title,
      sourceUrl: args.sourceUrl,
      location: args.location,
      score: args.score,
      dueAt: args.dueAt,
      detectedAt: args.detectedAt,
      metadata: args.metadata,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.signal.record',
      key: buildCompanyRequestKey(String(args.companyId), requestId),
      companyId: args.companyId,
      aggregateType: 'signal_key',
      aggregateId: signalKey,
      request,
      requestedAt: args.detectedAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The signal is already being recorded.');
      return claim.result as { signalId: Id<'acquisitionSignals'>; created: boolean };
    }
    const existing = await ctx.db
      .query('acquisitionSignals')
      .withIndex('by_company_signalKey', (q) =>
        q.eq('companyId', args.companyId).eq('signalKey', signalKey)
      )
      .unique();
    const signalId = existing?._id ?? await ctx.db.insert('acquisitionSignals', {
      companyId: args.companyId,
      signalKey,
      type: args.type,
      title: args.title.trim(),
      sourceUrl: args.sourceUrl.trim(),
      location: args.location?.trim(),
      status: 'new',
      score: args.score,
      dueAt: args.dueAt,
      detectedAt: args.detectedAt,
      lastSeenAt: args.detectedAt,
      metadata: args.metadata,
    });
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title.trim(),
        sourceUrl: args.sourceUrl.trim(),
        location: args.location?.trim(),
        score: args.score,
        dueAt: args.dueAt,
        lastSeenAt: args.detectedAt,
        metadata: args.metadata,
      });
    }
    const result = { signalId, created: !existing };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.signal.record:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: existing ? 'signal.refreshed' : 'signal.discovered',
      aggregateType: 'acquisition_signal',
      aggregateId: String(signalId),
      payload: { actorUserId: access.user._id, requestId, signalKey },
      occurredAt: args.detectedAt,
    });
    await appendAuditFact(ctx, access, {
      action: existing ? 'signal.refreshed' : 'signal.discovered',
      entityType: 'acquisition_signal',
      entityId: signalId,
      requestId,
      metadata: { signalKey, type: args.type },
      occurredAt: args.detectedAt,
    });
    await finishCommand(eventContext, {
      scope: 'acquisition.signal.record', requestId, companyId: args.companyId,
      aggregateType: 'signal_key', aggregateId: signalKey, request, result,
      occurredAt: args.detectedAt,
    });
    return result;
  },
});

const runKind = v.union(
  v.literal('lead_engine'),
  v.literal('bid_watch'),
  v.literal('content'),
  v.literal('migration')
);
const terminalRunStatus = v.union(
  v.literal('succeeded'),
  v.literal('partial'),
  v.literal('failed'),
  v.literal('no_change')
);

export const startRun = mutation({
  args: {
    companyId: v.id('companies'), requestId: v.string(), runKey: v.string(),
    kind: runKind, lane: v.optional(acquisitionLane), startedAt: v.number(),
  },
  returns: v.object({ runId: v.id('acquisitionRuns'), created: v.boolean() }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, { companyId: args.companyId, roles: ['staff', 'admin'] });
    const requestId = requireRequestId(args.requestId);
    const runKey = args.runKey.trim();
    if (!runKey) throw new Error('A run key is required.');
    const request = compactCommandValue({ runKey, kind: args.kind, lane: args.lane, startedAt: args.startedAt });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.run.start', key: buildCompanyRequestKey(String(args.companyId), requestId), companyId: args.companyId,
      aggregateType: 'acquisition_run_key', aggregateId: runKey, request,
      requestedAt: args.startedAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The acquisition run is already being started.');
      return claim.result as { runId: Id<'acquisitionRuns'>; created: boolean };
    }
    const existing = await ctx.db.query('acquisitionRuns')
      .withIndex('by_company_runKey', (q) => q.eq('companyId', args.companyId).eq('runKey', runKey)).unique();
    if (existing && (
      existing.kind !== args.kind || existing.lane !== args.lane || existing.startedAt !== args.startedAt
    )) {
      throw new Error('Run key was reused with different run parameters.');
    }
    const runId = existing?._id ?? await ctx.db.insert('acquisitionRuns', {
      companyId: args.companyId, runKey, kind: args.kind, lane: args.lane,
      status: 'started', startedAt: args.startedAt,
    });
    const result = { runId, created: !existing };
    if (!existing) {
      await appendDomainEvent(eventContext, {
        eventId: `acquisition.run.start:${args.companyId}:${requestId}`,
        companyId: args.companyId, type: 'acquisition.run_started',
        aggregateType: 'acquisition_run', aggregateId: String(runId),
        payload: { actorUserId: access.user._id, requestId, runKey, kind: args.kind },
        occurredAt: args.startedAt,
      });
      await appendAuditFact(ctx, access, { action: 'acquisition.run_started', entityType: 'acquisition_run', entityId: runId, requestId, occurredAt: args.startedAt, metadata: { runKey, kind: args.kind } });
    }
    await finishCommand(eventContext, {
      scope: 'acquisition.run.start', requestId, companyId: args.companyId,
      aggregateType: 'acquisition_run_key', aggregateId: runKey, request, result,
      occurredAt: args.startedAt,
    });
    return result;
  },
});

export const completeRun = mutation({
  args: {
    companyId: v.id('companies'), requestId: v.string(), runId: v.id('acquisitionRuns'),
    status: terminalRunStatus, completedAt: v.number(), cursor: v.optional(v.string()),
    counts: v.optional(v.any()), receipt: v.optional(v.any()), lastError: v.optional(v.string()),
  },
  returns: v.object({ runId: v.id('acquisitionRuns'), status: terminalRunStatus }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, { companyId: args.companyId, roles: ['staff', 'admin'] });
    const requestId = requireRequestId(args.requestId);
    const run = await ctx.db.get(args.runId);
    if (!run || run.companyId !== args.companyId) throw new Error('Run access is denied.');
    requireRunCompletionEvidence(args.status, args.receipt, args.lastError);
    const request = compactCommandValue({
      status: args.status, completedAt: args.completedAt, cursor: args.cursor,
      counts: args.counts, receipt: args.receipt, lastError: args.lastError,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.run.complete', key: buildCompanyRequestKey(String(args.companyId), requestId), companyId: args.companyId,
      aggregateType: 'acquisition_run', aggregateId: String(args.runId), request,
      requestedAt: args.completedAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The run completion is already in progress.');
      return claim.result as { runId: Id<'acquisitionRuns'>; status: 'succeeded' | 'partial' | 'failed' | 'no_change' };
    }
    if (run.status !== 'started') throw new Error(`Run is already ${run.status}.`);
    await ctx.db.patch(args.runId, {
      status: args.status, completedAt: args.completedAt, cursor: args.cursor,
      counts: args.counts, receipt: args.receipt, lastError: args.lastError,
    });
    const result = { runId: args.runId, status: args.status };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.run.complete:${args.companyId}:${requestId}`,
      companyId: args.companyId, type: 'acquisition.run_completed',
      aggregateType: 'acquisition_run', aggregateId: String(args.runId),
      payload: compactCommandValue({ actorUserId: access.user._id, requestId, status: args.status, counts: args.counts }),
      occurredAt: args.completedAt,
    });
    await appendAuditFact(ctx, access, { action: 'acquisition.run_completed', entityType: 'acquisition_run', entityId: args.runId, requestId, occurredAt: args.completedAt, metadata: compactCommandValue({ status: args.status, counts: args.counts }) });
    await finishCommand(eventContext, {
      scope: 'acquisition.run.complete', requestId, companyId: args.companyId,
      aggregateType: 'acquisition_run', aggregateId: String(args.runId), request, result,
      occurredAt: args.completedAt,
    });
    return result;
  },
});

const contentChannel = v.union(
  v.literal('facebook'), v.literal('instagram'), v.literal('google_business_profile'),
  v.literal('nextdoor'), v.literal('email')
);

export const queueContent = mutation({
  args: {
    companyId: v.id('companies'), requestId: v.string(), channel: contentChannel,
    contentHash: v.string(), message: v.string(), scheduledAt: v.optional(v.number()),
  },
  returns: v.object({ contentId: v.id('contentQueue'), created: v.boolean() }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, { companyId: args.companyId, roles: ['staff', 'admin'] });
    const requestId = requireRequestId(args.requestId);
    const contentHash = args.contentHash.trim();
    if (!contentHash || !args.message.trim()) throw new Error('Content hash and message are required.');
    const request = compactCommandValue({
      channel: args.channel, contentHash, message: args.message.trim(), scheduledAt: args.scheduledAt,
    });
    const now = Date.now();
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.content.queue', key: buildCompanyRequestKey(String(args.companyId), requestId), companyId: args.companyId,
      aggregateType: 'content_hash', aggregateId: contentHash, request, requestedAt: now,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The content item is already being queued.');
      return claim.result as { contentId: Id<'contentQueue'>; created: boolean };
    }
    const existing = await ctx.db.query('contentQueue')
      .withIndex('by_company_contentHash', (q) => q.eq('companyId', args.companyId).eq('contentHash', contentHash)).unique();
    if (existing && (
      existing.channel !== args.channel || existing.message !== args.message.trim() ||
      existing.scheduledAt !== args.scheduledAt
    )) {
      throw new Error('Content hash was reused with different content or scheduling.');
    }
    const contentId = existing?._id ?? await ctx.db.insert('contentQueue', {
      companyId: args.companyId, channel: args.channel,
      status: args.scheduledAt === undefined ? 'drafted' : 'scheduled',
      contentHash, message: args.message.trim(), scheduledAt: args.scheduledAt,
      createdAt: now, updatedAt: now,
    });
    const result = { contentId, created: !existing };
    if (!existing) {
      await appendDomainEvent(eventContext, {
        eventId: `acquisition.content.queue:${args.companyId}:${requestId}`,
        companyId: args.companyId, type: 'content.queued',
        aggregateType: 'content', aggregateId: String(contentId),
        payload: compactCommandValue({ actorUserId: access.user._id, requestId, channel: args.channel, scheduledAt: args.scheduledAt }),
        occurredAt: now,
      });
      await appendAuditFact(ctx, access, { action: 'content.queued', entityType: 'content', entityId: contentId, requestId, occurredAt: now, metadata: compactCommandValue({ channel: args.channel, scheduledAt: args.scheduledAt }) });
    }
    await finishCommand(eventContext, {
      scope: 'acquisition.content.queue', requestId, companyId: args.companyId,
      aggregateType: 'content_hash', aggregateId: contentHash, request, result,
      occurredAt: now,
    });
    return result;
  },
});

const contentResultStatus = v.union(
  v.literal('published'), v.literal('failed'), v.literal('cancelled')
);

export const recordContentResult = mutation({
  args: {
    companyId: v.id('companies'), requestId: v.string(), contentId: v.id('contentQueue'),
    status: contentResultStatus, occurredAt: v.number(), externalId: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  returns: v.object({ contentId: v.id('contentQueue'), status: contentResultStatus }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, { companyId: args.companyId, roles: ['staff', 'admin'] });
    const requestId = requireRequestId(args.requestId);
    const content = await ctx.db.get(args.contentId);
    if (!content || content.companyId !== args.companyId) throw new Error('Content access is denied.');
    const externalId = args.externalId?.trim();
    const lastError = args.lastError?.trim();
    if (args.status === 'published' && !externalId) {
      throw new Error('Published content requires the provider publication ID.');
    }
    if (args.status === 'failed' && !lastError) {
      throw new Error('Failed content requires a recorded provider error.');
    }
    const request = compactCommandValue({
      contentId: args.contentId, status: args.status, occurredAt: args.occurredAt,
      externalId, lastError,
    });
    const eventContext = ctx as unknown as EventContext;
    const claim = await claimIdempotencyKey(eventContext, {
      scope: 'acquisition.content.result',
      key: buildCompanyRequestKey(String(args.companyId), requestId),
      companyId: args.companyId, aggregateType: 'content', aggregateId: String(args.contentId),
      request, requestedAt: args.occurredAt,
    });
    if (!claim.claimed) {
      if (claim.result === undefined) throw new Error('The content result is already being recorded.');
      return claim.result as { contentId: Id<'contentQueue'>; status: 'published' | 'failed' | 'cancelled' };
    }
    if (content.status === 'published' || content.status === 'cancelled') {
      throw new Error(`Content is already ${content.status}.`);
    }
    await ctx.db.patch(args.contentId, {
      status: args.status,
      externalId,
      lastError,
      publishedAt: args.status === 'published' ? args.occurredAt : undefined,
      updatedAt: args.occurredAt,
    });
    const result = { contentId: args.contentId, status: args.status };
    await appendDomainEvent(eventContext, {
      eventId: `acquisition.content.result:${args.companyId}:${requestId}`,
      companyId: args.companyId, type: `content.${args.status}`,
      aggregateType: 'content', aggregateId: String(args.contentId),
      payload: compactCommandValue({ actorUserId: access.user._id, requestId, externalId, lastError }),
      occurredAt: args.occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: `content.${args.status}`, entityType: 'content', entityId: args.contentId,
      requestId, occurredAt: args.occurredAt, metadata: compactCommandValue({ externalId, lastError }),
    });
    await finishCommand(eventContext, {
      scope: 'acquisition.content.result', requestId, companyId: args.companyId,
      aggregateType: 'content', aggregateId: String(args.contentId), request, result,
      occurredAt: args.occurredAt,
    });
    return result;
  },
});

const queueLead = v.object({
  leadId: v.id('leads'), companyName: v.optional(v.string()), city: v.optional(v.string()),
  lane: v.optional(acquisitionLane), status: acquisitionLeadStatus,
  score: v.optional(v.number()), disposition: v.optional(scoreDisposition),
  nextAction: v.optional(v.string()), nextActionAt: v.optional(v.number()),
  blockers: v.array(v.string()),
});

function queueItem(lead: Doc<'leads'>) {
  assertLeadStatus(lead.status);
  return {
    leadId: lead._id,
    companyName: lead.companyName,
    city: lead.city,
    lane: lead.lane,
    status: lead.status,
    score: lead.score,
    disposition: lead.scoreDisposition,
    nextAction: lead.nextAction,
    nextActionAt: lead.nextActionAt,
    blockers: lead.blockers ?? [],
  };
}

export const workQueue = query({
  args: { companyId: v.id('companies'), dueBefore: v.number(), limit: v.optional(v.number()) },
  returns: v.array(queueLead),
  handler: async (ctx, args) => {
    await requireCompanyMembership(ctx, { companyId: args.companyId, roles: ['staff', 'admin'] });
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 25), 100));
    const statuses: AcquisitionLeadStatus[] = ['qualified', 'contacted', 'replied', 'estimate_requested'];
    const batches = await Promise.all(statuses.map((status) =>
      ctx.db.query('leads')
        .withIndex('by_company_status_and_nextActionAt', (q) =>
          q.eq('companyId', args.companyId).eq('status', status).lte('nextActionAt', args.dueBefore)
        ).take(limit)
    ));
    return batches.flat().sort((left, right) =>
      (left.nextActionAt ?? Number.MAX_SAFE_INTEGER) - (right.nextActionAt ?? Number.MAX_SAFE_INTEGER) ||
      (right.score ?? 0) - (left.score ?? 0)
    ).slice(0, limit).map(queueItem);
  },
});
