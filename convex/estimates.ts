import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { appendAuditFact } from './lib/audit';
import { requireActiveUser, requireCompanyMembership } from './lib/authz';
import {
  appendDomainEvent,
  claimIdempotencyKey,
  completeIdempotencyKey,
  hashCanonicalContent,
  type EventContext,
} from './lib/events';

const estimateLineItemInput = v.object({
  description: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
});
const estimateLineItem = v.object({
  description: v.string(),
  quantity: v.number(),
  unitPriceCents: v.number(),
  totalCents: v.number(),
});
const estimateStatus = v.union(v.literal('draft'), v.literal('approved'));
const approvedStatus = v.literal('approved');

type NormalizedLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};
type DraftResult = {
  estimateId: Id<'estimates'>;
  revision: number;
  status: 'draft';
  subtotalCents: number;
  totalCents: number;
};
type ApprovalResult = {
  estimateId: Id<'estimates'>;
  versionId: Id<'estimateVersions'>;
  versionNumber: number;
  status: 'approved';
  totalCents: number;
};

function requiredText(value: string, label: string, maxLength: number) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

function currency(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative whole number of cents.`);
  }
  return value;
}

function normalizeDraft(args: {
  title: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  discountCents: number;
  taxCents: number;
  assumptions: string[];
}) {
  const title = requiredText(args.title, 'Estimate title', 200);
  if (args.lineItems.length === 0 || args.lineItems.length > 100) {
    throw new Error('An estimate requires between 1 and 100 line items.');
  }
  const lineItems: NormalizedLineItem[] = args.lineItems.map((item) => {
    const description = requiredText(
      item.description,
      'Line item description',
      500
    );
    const scaledQuantity = item.quantity * 100;
    const quantityHundredths = Math.round(scaledQuantity);
    const quantityTolerance =
      Number.EPSILON * Math.max(1, Math.abs(scaledQuantity)) * 4;
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      item.quantity > 100_000 ||
      Math.abs(scaledQuantity - quantityHundredths) > quantityTolerance
    ) {
      throw new Error(
        'Line item quantity must be positive with at most two decimal places.'
      );
    }
    const unitPriceCents = currency(item.unitPriceCents, 'Unit price');
    const scaledTotal = quantityHundredths * unitPriceCents;
    if (!Number.isSafeInteger(scaledTotal)) {
      throw new Error('Line item total exceeds the supported currency range.');
    }
    const totalCents = Math.round(scaledTotal / 100);
    return {
      description,
      quantity: quantityHundredths / 100,
      unitPriceCents,
      totalCents,
    };
  });
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + item.totalCents,
    0
  );
  if (!Number.isSafeInteger(subtotalCents)) {
    throw new Error('Estimate subtotal exceeds the supported currency range.');
  }
  const discountCents = currency(args.discountCents, 'Discount');
  const taxCents = currency(args.taxCents, 'Tax');
  if (discountCents > subtotalCents) {
    throw new Error('Discount cannot exceed the estimate subtotal.');
  }
  const totalCents = subtotalCents - discountCents + taxCents;
  if (!Number.isSafeInteger(totalCents)) {
    throw new Error('Estimate total exceeds the supported currency range.');
  }
  if (args.assumptions.length > 20) {
    throw new Error('An estimate supports at most 20 assumptions.');
  }
  const assumptions = args.assumptions.map((assumption) =>
    requiredText(assumption, 'Assumption', 500)
  );
  return {
    title,
    lineItems,
    subtotalCents,
    discountCents,
    taxCents,
    totalCents,
    assumptions,
  };
}

export const saveEstimateDraft = mutation({
  args: {
    companyId: v.id('companies'),
    opportunityId: v.id('opportunities'),
    estimateId: v.optional(v.id('estimates')),
    expectedRevision: v.optional(v.number()),
    title: v.string(),
    lineItems: v.array(estimateLineItemInput),
    discountCents: v.number(),
    taxCents: v.number(),
    assumptions: v.array(v.string()),
    requestId: v.string(),
  },
  returns: v.object({
    estimateId: v.id('estimates'),
    revision: v.number(),
    status: v.literal('draft'),
    subtotalCents: v.number(),
    totalCents: v.number(),
  }),
  handler: async (ctx, args): Promise<DraftResult> => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const opportunity = await ctx.db.get(args.opportunityId);
    if (!opportunity || opportunity.companyId !== args.companyId) {
      throw new Error('Opportunity access is denied.');
    }
    const existingEstimate = args.estimateId
      ? await ctx.db.get(args.estimateId)
      : null;
    if (
      args.estimateId &&
      (!existingEstimate ||
        existingEstimate.companyId !== args.companyId ||
        existingEstimate.opportunityId !== args.opportunityId)
    ) {
      throw new Error('Estimate access is denied.');
    }
    const requestId = requiredText(args.requestId, 'Request ID', 200);
    const draft = normalizeDraft(args);
    const occurredAt = Date.now();
    const eventContext = ctx as unknown as EventContext;
    const aggregateId = args.estimateId
      ? String(args.estimateId)
      : `opportunity:${args.opportunityId}`;
    const idempotencyInput = {
      scope: 'estimates.draft.save',
      key: requestId,
      companyId: args.companyId,
      aggregateType: 'estimate',
      aggregateId,
      request: {
        opportunityId: args.opportunityId,
        ...(args.estimateId ? { estimateId: args.estimateId } : {}),
        ...(args.expectedRevision !== undefined
          ? { expectedRevision: args.expectedRevision }
          : {}),
        ...draft,
      },
      requestedAt: occurredAt,
    };
    const claim = await claimIdempotencyKey(eventContext, idempotencyInput);
    if (!claim.claimed) {
      if (claim.result !== undefined) return claim.result as DraftResult;
      throw new Error('The prior estimate draft request has not completed.');
    }

    let estimateId: Id<'estimates'>;
    let revision: number;
    if (existingEstimate) {
      if (
        !Number.isSafeInteger(args.expectedRevision) ||
        existingEstimate.revision !== args.expectedRevision
      ) {
        throw new Error(
          `Estimate revision changed from ${args.expectedRevision ?? 'unknown'} to ${existingEstimate.revision}. Refresh and retry.`
        );
      }
      revision = existingEstimate.revision + 1;
      estimateId = existingEstimate._id;
      await ctx.db.patch(estimateId, {
        ...draft,
        status: 'draft',
        revision,
        updatedAt: occurredAt,
      });
    } else {
      if (args.expectedRevision !== undefined) {
        throw new Error('A new estimate cannot declare an expected revision.');
      }
      revision = 1;
      estimateId = await ctx.db.insert('estimates', {
        companyId: args.companyId,
        opportunityId: args.opportunityId,
        ...draft,
        status: 'draft',
        revision,
        nextVersionNumber: 1,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      });
    }

    const result: DraftResult = {
      estimateId,
      revision,
      status: 'draft',
      subtotalCents: draft.subtotalCents,
      totalCents: draft.totalCents,
    };
    await appendDomainEvent(eventContext, {
      eventId: `estimate.draft.saved:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'estimate.draft_saved',
      aggregateType: 'estimate',
      aggregateId: String(estimateId),
      payload: {
        actorUserId: access.user._id,
        requestId,
        opportunityId: args.opportunityId,
        revision,
        subtotalCents: draft.subtotalCents,
        totalCents: draft.totalCents,
      },
      occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'estimate.draft_saved',
      entityType: 'estimate',
      entityId: estimateId,
      requestId,
      metadata: {
        opportunityId: args.opportunityId,
        revision,
        totalCents: draft.totalCents,
      },
      occurredAt,
    });
    await completeIdempotencyKey(eventContext, {
      ...idempotencyInput,
      result,
      completedAt: occurredAt,
    });
    return result;
  },
});

export const approveEstimateVersion = mutation({
  args: {
    companyId: v.id('companies'),
    estimateId: v.id('estimates'),
    expectedRevision: v.number(),
    requestId: v.string(),
  },
  returns: v.object({
    estimateId: v.id('estimates'),
    versionId: v.id('estimateVersions'),
    versionNumber: v.number(),
    status: approvedStatus,
    totalCents: v.number(),
  }),
  handler: async (ctx, args): Promise<ApprovalResult> => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: ['staff', 'admin'],
    });
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate || estimate.companyId !== args.companyId) {
      throw new Error('Estimate access is denied.');
    }
    const requestId = requiredText(args.requestId, 'Request ID', 200);
    const occurredAt = Date.now();
    const eventContext = ctx as unknown as EventContext;
    const idempotencyInput = {
      scope: 'estimates.version.approve',
      key: requestId,
      companyId: args.companyId,
      aggregateType: 'estimate',
      aggregateId: String(args.estimateId),
      request: {
        estimateId: args.estimateId,
        expectedRevision: args.expectedRevision,
      },
      requestedAt: occurredAt,
    };
    const claim = await claimIdempotencyKey(eventContext, idempotencyInput);
    if (!claim.claimed) {
      if (claim.result !== undefined) return claim.result as ApprovalResult;
      throw new Error('The prior estimate approval request has not completed.');
    }
    if (
      !Number.isSafeInteger(args.expectedRevision) ||
      estimate.revision !== args.expectedRevision
    ) {
      throw new Error(
        `Estimate revision changed from ${args.expectedRevision} to ${estimate.revision}. Refresh and retry.`
      );
    }
    if (estimate.approvedRevision === estimate.revision) {
      throw new Error('This estimate revision is already approved.');
    }

    const versionNumber = estimate.nextVersionNumber;
    const snapshot = {
      companyId: args.companyId,
      estimateId: args.estimateId,
      versionNumber,
      status: 'approved' as const,
      title: estimate.title,
      lineItems: estimate.lineItems,
      subtotalCents: estimate.subtotalCents,
      discountCents: estimate.discountCents,
      taxCents: estimate.taxCents,
      totalCents: estimate.totalCents,
      assumptions: estimate.assumptions,
      approvedByUserId: access.user._id,
      approvedAt: occurredAt,
      requestId,
    };
    const contentHash = await hashCanonicalContent(snapshot);
    const versionId = await ctx.db.insert('estimateVersions', {
      ...snapshot,
      contentHash,
    });
    await ctx.db.patch(args.estimateId, {
      status: 'approved',
      latestApprovedVersionId: versionId,
      approvedRevision: estimate.revision,
      nextVersionNumber: versionNumber + 1,
      updatedAt: occurredAt,
    });

    const result: ApprovalResult = {
      estimateId: args.estimateId,
      versionId,
      versionNumber,
      status: 'approved',
      totalCents: estimate.totalCents,
    };
    await appendDomainEvent(eventContext, {
      eventId: `estimate.version.approved:${args.companyId}:${requestId}`,
      companyId: args.companyId,
      type: 'estimate.version_approved',
      aggregateType: 'estimate',
      aggregateId: String(args.estimateId),
      payload: {
        actorUserId: access.user._id,
        requestId,
        versionId,
        versionNumber,
        revision: estimate.revision,
        totalCents: estimate.totalCents,
        contentHash,
      },
      occurredAt,
    });
    await appendAuditFact(ctx, access, {
      action: 'estimate.version_approved',
      entityType: 'estimate',
      entityId: args.estimateId,
      requestId,
      metadata: {
        versionId,
        versionNumber,
        revision: estimate.revision,
        totalCents: estimate.totalCents,
        contentHash,
      },
      occurredAt,
    });
    await completeIdempotencyKey(eventContext, {
      ...idempotencyInput,
      result,
      completedAt: occurredAt,
    });
    return result;
  },
});

export const estimateDetail = query({
  args: {
    estimateId: v.id('estimates'),
  },
  returns: v.object({
    estimate: v.object({
      id: v.id('estimates'),
      companyId: v.id('companies'),
      opportunityId: v.id('opportunities'),
      title: v.string(),
      status: estimateStatus,
      revision: v.number(),
      lineItems: v.array(estimateLineItem),
      subtotalCents: v.number(),
      discountCents: v.number(),
      taxCents: v.number(),
      totalCents: v.number(),
      assumptions: v.array(v.string()),
      latestApprovedVersionId: v.optional(v.id('estimateVersions')),
      updatedAt: v.number(),
    }),
    versions: v.array(
      v.object({
        id: v.id('estimateVersions'),
        versionNumber: v.number(),
        status: approvedStatus,
        title: v.string(),
        lineItems: v.array(estimateLineItem),
        subtotalCents: v.number(),
        discountCents: v.number(),
        taxCents: v.number(),
        totalCents: v.number(),
        assumptions: v.array(v.string()),
        approvedByUserId: v.id('users'),
        approvedAt: v.number(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);
    const estimate = await ctx.db.get(args.estimateId);
    if (!estimate) throw new Error('Estimate access is denied.');
    try {
      await requireCompanyMembership(ctx, {
        companyId: estimate.companyId,
        roles: ['staff', 'admin'],
      });
    } catch {
      throw new Error('Estimate access is denied.');
    }
    const versions = await ctx.db
      .query('estimateVersions')
      .withIndex('by_estimate_versionNumber', (index) =>
        index.eq('estimateId', args.estimateId)
      )
      .collect();
    return {
      estimate: {
        id: estimate._id,
        companyId: estimate.companyId,
        opportunityId: estimate.opportunityId,
        title: estimate.title,
        status: estimate.status,
        revision: estimate.revision,
        lineItems: estimate.lineItems,
        subtotalCents: estimate.subtotalCents,
        discountCents: estimate.discountCents,
        taxCents: estimate.taxCents,
        totalCents: estimate.totalCents,
        assumptions: estimate.assumptions,
        latestApprovedVersionId: estimate.latestApprovedVersionId,
        updatedAt: estimate.updatedAt,
      },
      versions: versions
        .sort((left, right) => right.versionNumber - left.versionNumber)
        .map((version) => ({
          id: version._id,
          versionNumber: version.versionNumber,
          status: version.status,
          title: version.title,
          lineItems: version.lineItems,
          subtotalCents: version.subtotalCents,
          discountCents: version.discountCents,
          taxCents: version.taxCents,
          totalCents: version.totalCents,
          assumptions: version.assumptions,
          approvedByUserId: version.approvedByUserId,
          approvedAt: version.approvedAt,
        })),
    };
  },
});
