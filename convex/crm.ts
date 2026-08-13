import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { appendAuditFact } from './lib/audit';
import {
  appendDomainEvent,
  claimIdempotencyKey,
  completeIdempotencyKey,
  type EventContext,
} from './lib/events';
import {
  requireActiveUser,
  requireCompanyMembership,
  requireProjectGrant,
} from './lib/authz';

const opportunityStage = v.union(
  v.literal('new'),
  v.literal('qualified'),
  v.literal('proposal'),
  v.literal('won'),
  v.literal('lost')
);

type OpportunityStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';

export const OPPORTUNITY_STAGE_TRANSITIONS = {
  new: ['qualified', 'lost'],
  qualified: ['proposal', 'lost'],
  proposal: ['won', 'lost'],
  won: [],
  lost: [],
} as const satisfies Record<OpportunityStage, readonly OpportunityStage[]>;

export function isOpportunityTransitionAllowed(
  currentStage: OpportunityStage,
  nextStage: OpportunityStage
) {
  return OPPORTUNITY_STAGE_TRANSITIONS[currentStage].some(
    (allowedStage) => allowedStage === nextStage
  );
}

function nextActionForStage(stage: OpportunityStage): string | null {
  const actions: Record<OpportunityStage, string | null> = {
    new: 'Qualify scope, fit, and urgency',
    qualified: 'Prepare and review the proposal',
    proposal: 'Record the customer decision',
    won: null,
    lost: null,
  };
  return actions[stage];
}

function stageFromUnknown(value: unknown): OpportunityStage | undefined {
  return typeof value === 'string' &&
    Object.hasOwn(OPPORTUNITY_STAGE_TRANSITIONS, value)
    ? (value as OpportunityStage)
    : undefined;
}

function metadataRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function auditSummary(action: string, nextStage?: OpportunityStage) {
  if (action === 'opportunity.stage_updated' && nextStage) {
    return `Stage changed to ${nextStage}`;
  }
  return action.replaceAll('.', ' ');
}

/**
 * Minimal staff console contract. Clerk proves the session identity while this
 * query alone grants access using active Convex memberships and a fresh MFA
 * second-factor claim.
 */
export const staffOverview = query({
  args: {},
  returns: v.array(
    v.object({
      companyId: v.id('companies'),
      companyName: v.string(),
      role: v.union(v.literal('staff'), v.literal('admin')),
    })
  ),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', user._id).eq('status', 'active')
      )
      .take(25);
    const result: Array<{
      companyId: Id<'companies'>;
      companyName: string;
      role: 'staff' | 'admin';
    }> = [];
    for (const membership of memberships) {
      if (membership.role !== 'staff' && membership.role !== 'admin') continue;
      const access = await requireCompanyMembership(ctx, {
        companyId: membership.companyId,
        roles: ['staff', 'admin'],
      });
      result.push({
        companyId: access.company._id,
        companyName: access.company.name,
        role: access.membership.role as 'staff' | 'admin',
      });
    }
    if (result.length === 0) {
      throw new Error('An active staff or admin membership is required.');
    }
    return result;
  },
});

export const myProjects = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.id('projects'),
      companyId: v.id('companies'),
      name: v.string(),
      status: v.union(
        v.literal('active'),
        v.literal('complete'),
        v.literal('archived')
      ),
    })
  ),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_user_status', (q) =>
        q.eq('userId', user._id).eq('status', 'active')
      )
      .take(25);
    const result: Array<{
      id: Id<'projects'>;
      companyId: Id<'companies'>;
      name: string;
      status: 'active' | 'complete' | 'archived';
    }> = [];
    for (const membership of memberships) {
      const projects = await ctx.db
        .query('projects')
        .withIndex('by_company_status', (q) =>
          q.eq('companyId', membership.companyId).eq('status', 'active')
        )
        .take(100);
      for (const project of projects) {
        try {
          await requireProjectGrant(ctx, {
            projectId: project._id,
            permission: 'view',
          });
          result.push({
            id: project._id,
            companyId: project.companyId,
            name: project.name,
            status: project.status,
          });
        } catch {
          // Resource grants are deny-by-default; omit projects without one.
        }
      }
    }
    return result;
  },
});

export const listContacts = query({
  args: { companyId: v.id('companies'), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.id('contacts'),
      name: v.string(),
      emailAddress: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      status: v.union(v.literal('active'), v.literal('archived')),
    })
  ),
  handler: async (ctx, args) => {
    await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const contacts = await ctx.db
      .query('contacts')
      .withIndex('by_company_status', (q) =>
        q.eq('companyId', args.companyId).eq('status', 'active')
      )
      .take(Math.max(1, Math.min(args.limit ?? 50, 100)));
    return contacts.map((contact) => ({
      id: contact._id,
      name: contact.name,
      emailAddress: contact.emailAddress,
      phoneNumber: contact.phoneNumber,
      status: contact.status,
    }));
  },
});

export const opportunityPipeline = query({
  args: { companyId: v.id('companies') },
  returns: v.array(
    v.object({
      id: v.id('opportunities'),
      stage: opportunityStage,
      updatedAt: v.number(),
      nextAction: v.union(v.string(), v.null()),
      allowedNextStages: v.array(opportunityStage),
      timeline: v.array(
        v.object({
          id: v.string(),
          action: v.string(),
          summary: v.string(),
          occurredAt: v.number(),
          fromStage: v.optional(opportunityStage),
          toStage: v.optional(opportunityStage),
          actorUserId: v.optional(v.string()),
          requestId: v.optional(v.string()),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });

    const opportunities = await ctx.db
      .query('opportunities')
      .withIndex('by_company_stage', (q) =>
        q.eq('companyId', args.companyId)
      )
      .collect();
    const events = await ctx.db
      .query('events')
      .withIndex('by_company_occurredAt', (q) =>
        q.eq('companyId', args.companyId)
      )
      .collect();
    const auditFacts = await ctx.db
      .query('auditFacts')
      .withIndex('by_company_occurredAt', (q) =>
        q.eq('companyId', args.companyId)
      )
      .collect();
    const eventsByOpportunity = new Map<string, typeof events>();
    const auditFactsByOpportunity = new Map<string, typeof auditFacts>();

    for (const event of events) {
      if (event.aggregateType !== 'opportunity') continue;
      const existing = eventsByOpportunity.get(event.aggregateId) ?? [];
      existing.push(event);
      eventsByOpportunity.set(event.aggregateId, existing);
    }
    for (const fact of auditFacts) {
      if (fact.entityType !== 'opportunity') continue;
      const existing = auditFactsByOpportunity.get(fact.entityId) ?? [];
      existing.push(fact);
      auditFactsByOpportunity.set(fact.entityId, existing);
    }

    return opportunities
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .map((opportunity) => {
        const opportunityEvents =
          eventsByOpportunity.get(opportunity._id) ?? [];
        const opportunityAuditFacts =
          auditFactsByOpportunity.get(opportunity._id) ?? [];
        const auditByActionRequest = new Map(
          opportunityAuditFacts.flatMap((fact) =>
            fact.requestId
              ? [[`${fact.action}:${fact.requestId}`, fact] as const]
              : []
          )
        );
        const eventActionRequests = new Set<string>();
        const timeline = [
          ...(opportunityEvents.some(
            (event) => event.type === 'opportunity.created'
          ) ||
          opportunityAuditFacts.some(
            (fact) => fact.action === 'opportunity.created'
          )
            ? []
            : [
                {
                  id: `created:${opportunity._id}`,
                  action: 'opportunity.created',
                  summary: 'Opportunity created',
                  occurredAt: opportunity._creationTime,
                },
              ]),
          ...opportunityEvents.map((event) => {
            const payload = metadataRecord(event.payload);
            const fromStage = stageFromUnknown(
              payload?.expectedStage ?? payload?.fromStage
            );
            const toStage = stageFromUnknown(
              payload?.nextStage ?? payload?.stage
            );
            const actorUserId =
              typeof payload?.actorUserId === 'string'
                ? payload.actorUserId
                : undefined;
            const requestId =
              typeof payload?.requestId === 'string'
                ? payload.requestId
                : undefined;
            const matchingAudit = requestId
              ? auditByActionRequest.get(`${event.type}:${requestId}`)
              : undefined;
            if (requestId) {
              eventActionRequests.add(`${event.type}:${requestId}`);
            }
            return {
              id: event.eventId,
              action: event.type,
              summary: auditSummary(event.type, toStage),
              occurredAt: event.occurredAt,
              ...(fromStage ? { fromStage } : {}),
              ...(toStage ? { toStage } : {}),
              ...(actorUserId || matchingAudit?.actorUserId
                ? {
                    actorUserId: String(
                      actorUserId ?? matchingAudit?.actorUserId
                    ),
                  }
                : {}),
              ...(requestId ? { requestId } : {}),
            };
          }),
          ...opportunityAuditFacts.flatMap((fact) => {
            if (
              fact.requestId &&
              eventActionRequests.has(`${fact.action}:${fact.requestId}`)
            ) {
              return [];
            }
            const metadata = metadataRecord(fact.metadata);
            const fromStage = stageFromUnknown(
              metadata?.expectedStage ?? metadata?.fromStage
            );
            const toStage = stageFromUnknown(
              metadata?.nextStage ?? metadata?.stage
            );
            return [
              {
                id: `audit:${fact._id}`,
                action: fact.action,
                summary: auditSummary(fact.action, toStage),
                occurredAt: fact.occurredAt,
                ...(fromStage ? { fromStage } : {}),
                ...(toStage ? { toStage } : {}),
                ...(fact.actorUserId
                  ? { actorUserId: String(fact.actorUserId) }
                  : {}),
                ...(fact.requestId ? { requestId: fact.requestId } : {}),
              },
            ];
          }),
        ].sort(
          (left, right) =>
            left.occurredAt - right.occurredAt ||
            left.id.localeCompare(right.id)
        );
        const latestRecordedStage = [...timeline]
          .reverse()
          .find((entry) => entry.toStage !== undefined)?.toStage;
        if (latestRecordedStage !== opportunity.stage) {
          timeline.push({
            id: `state:${opportunity._id}:${opportunity.stage}`,
            action: 'opportunity.current_state',
            summary: `Current stage is ${opportunity.stage}`,
            occurredAt: opportunity.updatedAt,
            toStage: opportunity.stage,
          });
          timeline.sort(
            (left, right) =>
              left.occurredAt - right.occurredAt ||
              left.id.localeCompare(right.id)
          );
        }

        return {
          id: opportunity._id,
          stage: opportunity.stage,
          updatedAt: opportunity.updatedAt,
          nextAction: nextActionForStage(opportunity.stage),
          allowedNextStages: [
            ...OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage],
          ],
          timeline,
        };
      });
  },
});

export const updateOpportunityStage = mutation({
  args: {
    companyId: v.id('companies'),
    opportunityId: v.id('opportunities'),
    expectedStage: opportunityStage,
    nextStage: opportunityStage,
    requestId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || opportunity.companyId !== args.companyId) {
      throw new Error('Opportunity access is denied.');
    }
    const requestId = args.requestId.trim();
    if (!requestId || requestId.length > 200) {
      throw new Error('A valid request ID is required.');
    }
    const occurredAt = Date.now();
    const eventContext = ctx as unknown as EventContext;
    const idempotencyInput = {
      scope: 'crm.opportunity.stage',
      key: requestId,
      companyId: args.companyId,
      aggregateType: 'opportunity',
      aggregateId: String(args.opportunityId),
      request: {
        expectedStage: args.expectedStage,
        nextStage: args.nextStage,
      },
      requestedAt: occurredAt,
    };
    const previousRequest = await ctx.db
      .query('idempotencyKeys')
      .withIndex('by_scope_key', (q) =>
        q.eq('scope', idempotencyInput.scope).eq('key', requestId)
      )
      .unique();
    if (previousRequest) {
      const replay = await claimIdempotencyKey(eventContext, idempotencyInput);
      if (!replay.claimed && replay.result !== undefined) {
        return null;
      }
      throw new Error('The prior stage transition has not completed.');
    }
    if (opportunity.stage !== args.expectedStage) {
      throw new Error(
        `Opportunity stage changed from ${args.expectedStage} to ${opportunity.stage}. Refresh and retry.`
      );
    }
    if (args.expectedStage === args.nextStage) {
      throw new Error('A stage transition must change the opportunity stage.');
    }
    if (OPPORTUNITY_STAGE_TRANSITIONS[opportunity.stage].length === 0) {
      throw new Error('Terminal opportunity stages cannot transition.');
    }
    if (!isOpportunityTransitionAllowed(opportunity.stage, args.nextStage)) {
      throw new Error(
        `Opportunity cannot move from ${opportunity.stage} to ${args.nextStage}.`
      );
    }
    const claim = await claimIdempotencyKey(eventContext, idempotencyInput);
    if (!claim.claimed) {
      throw new Error('The stage transition request is already in progress.');
    }
    await ctx.db.patch(args.opportunityId, {
      stage: args.nextStage,
      updatedAt: occurredAt,
    });
    await appendDomainEvent(eventContext, {
      eventId: `crm.opportunity.stage:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'opportunity.stage_updated',
      aggregateType: 'opportunity',
      aggregateId: String(args.opportunityId),
      payload: {
        actorUserId: access.user._id,
        requestId,
        expectedStage: args.expectedStage,
        nextStage: args.nextStage,
      },
      occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'opportunity.stage_updated',
      entityType: 'opportunity',
      entityId: args.opportunityId,
      requestId,
      metadata: {
        expectedStage: args.expectedStage,
        nextStage: args.nextStage,
      },
      occurredAt,
    });
    await completeIdempotencyKey(eventContext, {
      ...idempotencyInput,
      completedAt: occurredAt,
      result: {
        opportunityId: String(args.opportunityId),
        stage: args.nextStage,
      },
    });
    return null;
  },
});
