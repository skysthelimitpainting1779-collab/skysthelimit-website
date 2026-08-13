import { v } from 'convex/values';

import { internalMutation, internalQuery } from './_generated/server';
import { appendAuditFact } from './lib/audit';
import { requireCompanyMembership } from './lib/authz';
import { requiredInvitationActorRoles } from './lib/invitationPolicy';

const invitationRole = v.union(
  v.literal('customer'),
  v.literal('staff'),
  v.literal('admin'),
);

export const authorizeCreate = internalQuery({
  args: { companyId: v.id('companies'), role: invitationRole },
  returns: v.object({
    userId: v.id('users'),
    companyId: v.id('companies'),
  }),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: requiredInvitationActorRoles(args.role),
    });
    return { userId: access.user._id, companyId: access.company._id };
  },
});

export const persistCreated = internalMutation({
  args: {
    clerkInvitationId: v.string(),
    companyId: v.id('companies'),
    emailAddress: v.string(),
    role: invitationRole,
    invitedByUserId: v.id('users'),
    expiresAt: v.optional(v.number()),
  },
  returns: v.id('invitations'),
  handler: async (ctx, args) => {
    const access = await requireCompanyMembership(ctx, {
      companyId: args.companyId,
      roles: requiredInvitationActorRoles(args.role),
    });
    if (access.user._id !== args.invitedByUserId) {
      throw new Error('Invitation actor identity changed before persistence.');
    }
    const existing = await ctx.db
      .query('invitations')
      .withIndex('by_clerkInvitationId', (q) =>
        q.eq('clerkInvitationId', args.clerkInvitationId),
      )
      .unique();
    if (existing) return existing._id;
    const now = Date.now();
    const invitationId = await ctx.db.insert('invitations', {
      ...args,
      emailAddress: args.emailAddress.toLowerCase(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    await appendAuditFact(
      ctx,
      access,
      {
        action: 'invitation.created',
        entityType: 'invitation',
        entityId: invitationId,
        metadata: { role: args.role },
        occurredAt: now,
      },
    );
    return invitationId;
  },
});

const invitationLifecycleType = v.union(
  v.literal('invitation.accepted'),
  v.literal('invitation.revoked'),
);

export const applyVerifiedClerkLifecycle = internalMutation({
  args: {
    eventId: v.string(),
    payloadHash: v.string(),
    type: invitationLifecycleType,
    clerkInvitationId: v.string(),
    emailAddress: v.string(),
    acceptedClerkSubject: v.optional(v.string()),
    providerOccurredAt: v.number(),
    receivedAt: v.number(),
  },
  returns: v.object({
    applied: v.boolean(),
    invitationId: v.id('invitations'),
  }),
  handler: async (ctx, args) => {
    const existingReceipt = await ctx.db
      .query('webhookReceipts')
      .withIndex('by_provider_eventId', (q) =>
        q.eq('provider', 'clerk').eq('eventId', args.eventId),
      )
      .unique();
    const invitation = await ctx.db
      .query('invitations')
      .withIndex('by_clerkInvitationId', (q) =>
        q.eq('clerkInvitationId', args.clerkInvitationId),
      )
      .unique();
    if (!invitation) {
      throw new Error(
        'Local invitation is not persisted yet; retry this verified Clerk event.',
      );
    }
    if (existingReceipt) {
      if (existingReceipt.payloadHash !== args.payloadHash) {
        throw new Error('Clerk webhook event ID was replayed with different content.');
      }
      return { applied: false, invitationId: invitation._id };
    }

    const now = Date.now();
    let applied = false;
    const emailAddress = args.emailAddress.trim().toLowerCase();
    if (emailAddress !== invitation.emailAddress) {
      throw new Error('Clerk invitation identity does not match the local invitation.');
    }
    const eventIsNewer =
      invitation.lastProviderOccurredAt === undefined
      || args.providerOccurredAt > invitation.lastProviderOccurredAt;

    if (args.type === 'invitation.revoked') {
      await ctx.db.patch(invitation._id, {
        status: 'revoked',
        updatedAt: now,
        ...(eventIsNewer
          ? {
              lastProviderEventId: args.eventId,
              lastProviderEventType: args.type,
              lastProviderOccurredAt: args.providerOccurredAt,
            }
          : {}),
      });
      if (invitation.acceptedByUserId) {
        const membership = await ctx.db
          .query('memberships')
          .withIndex('by_user_company', (q) =>
            q.eq('userId', invitation.acceptedByUserId!)
              .eq('companyId', invitation.companyId),
          )
          .unique();
        if (
          membership?.admissionSource === 'invitation'
          && membership.sourceInvitationId === invitation._id
          && membership.status === 'active'
        ) {
          await ctx.db.patch(membership._id, {
            status: 'revoked',
            revokedAt: now,
          });
        }
      }
      applied = true;
    } else if (
      invitation.status !== 'revoked'
      && eventIsNewer
      && (!invitation.expiresAt || invitation.expiresAt > args.providerOccurredAt)
    ) {
      const acceptedClerkSubject = args.acceptedClerkSubject?.trim();
      if (!acceptedClerkSubject) {
        throw new Error('Accepted Clerk invitation has no authoritative user identity.');
      }
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerkSubject', (q) =>
          q.eq('clerkSubject', acceptedClerkSubject),
        )
        .unique();
      if (
        !user
        || user.status !== 'active'
        || user.primaryEmailAddress !== emailAddress
      ) {
        throw new Error('Accepted Clerk user is not an active matching canonical identity.');
      }
      await ctx.db.patch(invitation._id, {
        status: 'accepted',
        acceptedByUserId: user._id,
        updatedAt: now,
        lastProviderEventId: args.eventId,
        lastProviderEventType: args.type,
        lastProviderOccurredAt: args.providerOccurredAt,
      });
      const membership = await ctx.db
        .query('memberships')
        .withIndex('by_user_company', (q) =>
          q.eq('userId', user._id).eq('companyId', invitation.companyId),
        )
        .unique();
      if (!membership) {
        await ctx.db.insert('memberships', {
          userId: user._id,
          companyId: invitation.companyId,
          role: invitation.role,
          status: 'active',
          admissionSource: 'invitation',
          sourceInvitationId: invitation._id,
          invitedByUserId: invitation.invitedByUserId,
          createdAt: now,
        });
      }
      applied = true;
    }

    await ctx.db.insert('webhookReceipts', {
      provider: 'clerk',
      eventId: args.eventId,
      payloadHash: args.payloadHash,
      verificationStatus: 'verified',
      processingStatus: 'succeeded',
      attemptCount: 1,
      receivedAt: args.receivedAt,
      processedAt: now,
    });
    return { applied, invitationId: invitation._id };
  },
});
