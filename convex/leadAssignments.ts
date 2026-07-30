import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';
import { appendAuditFact } from './lib/audit';
import { requireCompanyMembership } from './lib/authz';
import {
  appendDomainEvent,
  claimIdempotencyKey,
  completeIdempotencyKey,
  type EventContext,
} from './lib/events';
import {
  calculateFirstResponseDueAt,
  evaluateLeadSla,
  selectDeterministicAssignee,
  type LeadRoutingCandidate,
} from '../src/workflows/lead-assignment';

const assignmentStatus = v.union(
  v.literal('assigned'),
  v.literal('acknowledged'),
  v.literal('closed'),
);
const escalationStatus = v.union(
  v.literal('none'),
  v.literal('escalated'),
  v.literal('resolved'),
);
const slaStatus = v.union(
  v.literal('pending'),
  v.literal('breached'),
  v.literal('escalated'),
  v.literal('met'),
  v.literal('closed'),
);
const assignmentResult = v.object({
  assignmentId: v.id('leadAssignments'),
  leadId: v.id('leads'),
  assigneeUserId: v.id('users'),
  firstResponseDueAt: v.number(),
});
const escalationResult = v.object({
  status: v.union(
    v.literal('pending'),
    v.literal('met'),
    v.literal('closed'),
    v.literal('breached'),
    v.literal('escalated'),
  ),
  escalated: v.boolean(),
  escalatedAt: v.optional(v.number()),
});
const acknowledgementResult = v.object({
  assignmentId: v.id('leadAssignments'),
  status: v.literal('acknowledged'),
  firstResponseAt: v.number(),
});

type AssignmentResult = {
  assignmentId: Id<'leadAssignments'>;
  leadId: Id<'leads'>;
  assigneeUserId: Id<'users'>;
  firstResponseDueAt: number;
};

function eventContext(ctx: { db: unknown }): EventContext {
  return ctx as unknown as EventContext;
}

async function eligibleCandidates(
  ctx: Parameters<typeof requireCompanyMembership>[0],
  companyId: Id<'companies'>,
): Promise<LeadRoutingCandidate[]> {
  const memberships = [
    ...(await ctx.db
      .query('memberships')
      .withIndex('by_company_role', (index) =>
        index.eq('companyId', companyId).eq('role', 'staff')
      )
      .take(250)),
    ...(await ctx.db
      .query('memberships')
      .withIndex('by_company_role', (index) =>
        index.eq('companyId', companyId).eq('role', 'admin')
      )
      .take(250)),
  ];
  const candidates: LeadRoutingCandidate[] = [];
  for (const membership of memberships) {
    const user = await ctx.db.get(membership.userId);
    if (!user) continue;
    candidates.push({
      userId: String(user._id),
      role: membership.role,
      membershipStatus: membership.status,
      userStatus: user.status,
    });
  }
  return candidates;
}

export const assignLead = mutation({
  args: {
    companyId: v.id('companies'),
    leadId: v.id('leads'),
    requestId: v.string(),
    firstResponseSlaMinutes: v.number(),
  },
  returns: assignmentResult,
  handler: async (ctx, args): Promise<AssignmentResult> => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const lead = await ctx.db.get(args.leadId);
    if (!lead || lead.companyId !== args.companyId) {
      throw new Error('Lead access is denied.');
    }
    const requestId = args.requestId.trim();
    if (!requestId || requestId.length > 200) {
      throw new Error('A valid request ID is required.');
    }
    calculateFirstResponseDueAt(0, args.firstResponseSlaMinutes);

    const idempotencyInput = {
      scope: 'crm.lead.assignment',
      key: requestId,
      companyId: args.companyId,
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      request: {
        firstResponseSlaMinutes: args.firstResponseSlaMinutes,
      },
      requestedAt: Date.now(),
    };
    const existingRequest = await ctx.db
      .query('idempotencyKeys')
      .withIndex('by_scope_key', (index) =>
        index.eq('scope', idempotencyInput.scope).eq('key', requestId)
      )
      .unique();
    if (existingRequest) {
      const replay = await claimIdempotencyKey(
        eventContext(ctx),
        idempotencyInput,
      );
      if (!replay.claimed && replay.result !== undefined) {
        return replay.result as AssignmentResult;
      }
      throw new Error('The prior lead assignment has not completed.');
    }

    const existingAssignment = await ctx.db
      .query('leadAssignments')
      .withIndex('by_lead', (index) => index.eq('leadId', args.leadId))
      .unique();
    if (existingAssignment) {
      throw new Error('This lead is already assigned.');
    }

    const routing = selectDeterministicAssignee(
      String(args.leadId),
      await eligibleCandidates(ctx, args.companyId),
    );
    const assignedAt = Date.now();
    const firstResponseDueAt = calculateFirstResponseDueAt(
      assignedAt,
      args.firstResponseSlaMinutes,
    );
    const claim = await claimIdempotencyKey(eventContext(ctx), {
      ...idempotencyInput,
      requestedAt: assignedAt,
    });
    if (!claim.claimed) {
      throw new Error('The lead assignment request is already in progress.');
    }

    const assignmentId = await ctx.db.insert('leadAssignments', {
      companyId: args.companyId,
      leadId: args.leadId,
      assigneeUserId: routing.assigneeUserId as Id<'users'>,
      status: 'assigned',
      escalationStatus: 'none',
      routingVersion: routing.algorithmVersion,
      routingReason: routing.reason,
      assignedAt,
      firstResponseDueAt,
      requestId,
      updatedAt: assignedAt,
    });
    const result: AssignmentResult = {
      assignmentId,
      leadId: args.leadId,
      assigneeUserId: routing.assigneeUserId as Id<'users'>,
      firstResponseDueAt,
    };

    await ctx.scheduler.runAfter(
      firstResponseDueAt - assignedAt,
      internal.leadAssignments.escalateDueAssignment,
      { assignmentId, expectedDueAt: firstResponseDueAt },
    );
    await appendDomainEvent(eventContext(ctx), {
      eventId: `crm.lead.assigned:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'lead.assigned',
      aggregateType: 'lead',
      aggregateId: String(args.leadId),
      payload: {
        assignmentId,
        assigneeUserId: routing.assigneeUserId,
        routingVersion: routing.algorithmVersion,
        firstResponseDueAt,
        requestId,
      },
      occurredAt: assignedAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'lead.assigned',
      entityType: 'lead',
      entityId: args.leadId,
      requestId,
      metadata: {
        assignmentId,
        assigneeUserId: routing.assigneeUserId,
        routingVersion: routing.algorithmVersion,
        firstResponseDueAt,
      },
      occurredAt: assignedAt,
    });
    await completeIdempotencyKey(eventContext(ctx), {
      ...idempotencyInput,
      requestedAt: assignedAt,
      result,
      completedAt: assignedAt,
    });
    return result;
  },
});

export const acknowledgeLead = mutation({
  args: {
    companyId: v.id('companies'),
    assignmentId: v.id('leadAssignments'),
    requestId: v.string(),
  },
  returns: acknowledgementResult,
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.companyId !== args.companyId) {
      throw new Error('Lead assignment access is denied.');
    }
    const requestId = args.requestId.trim();
    if (!requestId || requestId.length > 200) {
      throw new Error('A valid request ID is required.');
    }
    const observedAt = Date.now();
    const idempotencyInput = {
      scope: 'crm.lead.acknowledgement',
      key: requestId,
      companyId: args.companyId,
      aggregateType: 'leadAssignment',
      aggregateId: String(args.assignmentId),
      request: {},
      requestedAt: observedAt,
    };
    const existingRequest = await ctx.db
      .query('idempotencyKeys')
      .withIndex('by_scope_key', (index) =>
        index.eq('scope', idempotencyInput.scope).eq('key', requestId)
      )
      .unique();
    if (existingRequest) {
      const replay = await claimIdempotencyKey(
        eventContext(ctx),
        idempotencyInput,
      );
      if (!replay.claimed && replay.result !== undefined) {
        return replay.result as {
          assignmentId: Id<'leadAssignments'>;
          status: 'acknowledged';
          firstResponseAt: number;
        };
      }
      throw new Error('The prior lead acknowledgement has not completed.');
    }
    if (assignment.status !== 'assigned') {
      throw new Error('Only an assigned lead can be acknowledged.');
    }
    const claim = await claimIdempotencyKey(
      eventContext(ctx),
      idempotencyInput,
    );
    if (!claim.claimed) {
      throw new Error('The lead acknowledgement is already in progress.');
    }

    const result = {
      assignmentId: args.assignmentId,
      status: 'acknowledged' as const,
      firstResponseAt: observedAt,
    };
    const late = observedAt >= assignment.firstResponseDueAt;
    const wasEscalated = assignment.escalationStatus === 'escalated';
    await ctx.db.patch(args.assignmentId, {
      status: 'acknowledged',
      firstResponseAt: observedAt,
      escalationStatus:
        late || wasEscalated
          ? 'resolved'
          : assignment.escalationStatus,
      updatedAt: observedAt,
    });
    if (late && !wasEscalated) {
      await appendDomainEvent(eventContext(ctx), {
        eventId: `crm.lead.sla_breached:${args.assignmentId}:${assignment.firstResponseDueAt}`,
        companyId: args.companyId,
        type: 'lead.sla_breached',
        aggregateType: 'lead',
        aggregateId: String(assignment.leadId),
        payload: {
          assignmentId: args.assignmentId,
          assigneeUserId: assignment.assigneeUserId,
          firstResponseDueAt: assignment.firstResponseDueAt,
          operatorLabel: 'SLA breached — immediate follow-up required',
        },
        occurredAt: assignment.firstResponseDueAt,
      });
      await ctx.db.insert('auditFacts', {
        companyId: args.companyId,
        action: 'lead.sla_breached',
        entityType: 'leadAssignment',
        entityId: String(args.assignmentId),
        requestId: `sla:${args.assignmentId}:${assignment.firstResponseDueAt}`,
        metadata: {
          leadId: assignment.leadId,
          assigneeUserId: assignment.assigneeUserId,
          firstResponseDueAt: assignment.firstResponseDueAt,
          operatorLabel: 'SLA breached — immediate follow-up required',
          actor: 'system',
        },
        occurredAt: assignment.firstResponseDueAt,
      });
    }
    await appendDomainEvent(eventContext(ctx), {
      eventId: `crm.lead.acknowledged:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'lead.acknowledged',
      aggregateType: 'lead',
      aggregateId: String(assignment.leadId),
      payload: {
        assignmentId: args.assignmentId,
        assigneeUserId: assignment.assigneeUserId,
        firstResponseAt: observedAt,
        requestId,
        slaOutcome: late ? 'breached' : 'met',
      },
      occurredAt: observedAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'lead.acknowledged',
      entityType: 'leadAssignment',
      entityId: args.assignmentId,
      requestId,
      metadata: {
        leadId: assignment.leadId,
        assigneeUserId: assignment.assigneeUserId,
        firstResponseAt: observedAt,
        slaOutcome: late ? 'breached' : 'met',
      },
      occurredAt: observedAt,
    });
    await completeIdempotencyKey(eventContext(ctx), {
      ...idempotencyInput,
      result,
      completedAt: observedAt,
    });
    return result;
  },
});

export const escalateDueAssignment = internalMutation({
  args: {
    assignmentId: v.id('leadAssignments'),
    expectedDueAt: v.number(),
  },
  returns: escalationResult,
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error('Lead assignment does not exist.');
    }
    if (assignment.firstResponseDueAt !== args.expectedDueAt) {
      throw new Error('Lead assignment SLA deadline changed.');
    }
    if (assignment.escalationStatus === 'escalated') {
      return {
        status: 'escalated' as const,
        escalated: false,
        ...(assignment.escalatedAt !== undefined
          ? { escalatedAt: assignment.escalatedAt }
          : {}),
      };
    }

    const observedAt = Date.now();
    const projection = evaluateLeadSla(assignment, observedAt);
    if (projection.status === 'pending') {
      await ctx.scheduler.runAfter(
        Math.max(0, assignment.firstResponseDueAt - observedAt),
        internal.leadAssignments.escalateDueAssignment,
        args,
      );
      return { status: 'pending' as const, escalated: false };
    }
    if (projection.status === 'met' || projection.status === 'closed') {
      return {
        status: projection.status,
        escalated: false,
      };
    }
    if (projection.status === 'breached' && !projection.shouldEscalate) {
      return {
        status: 'breached' as const,
        escalated: false,
      };
    }

    await ctx.db.patch(args.assignmentId, {
      escalationStatus: 'escalated',
      escalatedAt: observedAt,
      updatedAt: observedAt,
    });
    await appendDomainEvent(eventContext(ctx), {
      eventId: `crm.lead.sla_breached:${args.assignmentId}:${args.expectedDueAt}`,
      companyId: assignment.companyId,
      type: 'lead.sla_breached',
      aggregateType: 'lead',
      aggregateId: String(assignment.leadId),
      payload: {
        assignmentId: args.assignmentId,
        assigneeUserId: assignment.assigneeUserId,
        firstResponseDueAt: assignment.firstResponseDueAt,
        operatorLabel: projection.operatorLabel,
      },
      occurredAt: observedAt,
    });
    await ctx.db.insert('auditFacts', {
      companyId: assignment.companyId,
      action: 'lead.sla_breached',
      entityType: 'leadAssignment',
      entityId: String(args.assignmentId),
      requestId: `sla:${args.assignmentId}:${args.expectedDueAt}`,
      metadata: {
        leadId: assignment.leadId,
        assigneeUserId: assignment.assigneeUserId,
        firstResponseDueAt: assignment.firstResponseDueAt,
        operatorLabel: projection.operatorLabel,
        actor: 'system',
      },
      occurredAt: observedAt,
    });
    return {
      status: 'escalated' as const,
      escalated: true,
      escalatedAt: observedAt,
    };
  },
});

export const slaQueue = query({
  args: {
    companyId: v.id('companies'),
    asOf: v.number(),
  },
  returns: v.array(
    v.object({
      assignmentId: v.id('leadAssignments'),
      leadId: v.id('leads'),
      assigneeUserId: v.id('users'),
      assignmentStatus,
      escalationStatus,
      slaStatus,
      firstResponseDueAt: v.number(),
      firstResponseAt: v.optional(v.number()),
      escalatedAt: v.optional(v.number()),
      operatorLabel: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const assignments = await ctx.db
      .query('leadAssignments')
      .withIndex('by_company_status_dueAt', (index) =>
        index.eq('companyId', args.companyId).eq('status', 'assigned')
      )
      .take(200);
    return assignments
      .sort(
        (left, right) =>
          left.firstResponseDueAt - right.firstResponseDueAt ||
          String(left._id).localeCompare(String(right._id)),
      )
      .map((assignment) => {
        const projection = evaluateLeadSla(assignment, args.asOf);
        return {
          assignmentId: assignment._id,
          leadId: assignment.leadId,
          assigneeUserId: assignment.assigneeUserId,
          assignmentStatus: assignment.status,
          escalationStatus: assignment.escalationStatus,
          slaStatus: projection.status,
          firstResponseDueAt: assignment.firstResponseDueAt,
          ...(assignment.firstResponseAt !== undefined
            ? { firstResponseAt: assignment.firstResponseAt }
            : {}),
          ...(assignment.escalatedAt !== undefined
            ? { escalatedAt: assignment.escalatedAt }
            : {}),
          operatorLabel: projection.operatorLabel,
        };
      });
  },
});
