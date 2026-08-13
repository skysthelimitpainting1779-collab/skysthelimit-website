import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { requireActiveUser } from './lib/authz';
import { decideUserLifecycleTransition } from './lib/userLifecycle';

const lifecycleType = v.union(
  v.literal('user.created'),
  v.literal('user.updated'),
  v.literal('user.deleted'),
);

/**
 * Resolves the current Clerk JWT subject to the canonical application user.
 * An authenticated Clerk session alone never grants company or resource access.
 */
export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.id('users'),
      status: v.union(v.literal('active'), v.literal('disabled')),
      displayName: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkSubject', (q) => q.eq('clerkSubject', identity.subject))
      .unique();
    if (!user) return null;
    return { id: user._id, status: user.status, displayName: user.displayName };
  },
});

/**
 * Idempotently provisions the signed-in Clerk subject. Lifecycle webhooks remain
 * authoritative for disabling users, while this closes first-session races.
 */
export const syncCurrentIdentity = mutation({
  args: {},
  returns: v.id('users'),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject?.trim();
    if (!subject) throw new Error('Authentication is required.');
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkSubject', (q) => q.eq('clerkSubject', subject))
      .unique();
    if (existing) {
      if (existing.status !== 'active') throw new Error('This user is disabled.');
      return existing._id;
    }
    const now = Date.now();
    return ctx.db.insert('users', {
      clerkSubject: subject,
      status: 'active',
      displayName: typeof identity?.name === 'string' ? identity.name : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Called only by the signature-verifying Clerk HTTP action. Receipt and identity
 * changes share one transaction so webhook retries are safe.
 */
export const applyVerifiedClerkLifecycle = internalMutation({
  args: {
    eventId: v.string(),
    payloadHash: v.string(),
    type: lifecycleType,
    clerkSubject: v.string(),
    primaryEmailAddress: v.optional(v.string()),
    displayName: v.optional(v.string()),
    providerOccurredAt: v.number(),
    receivedAt: v.number(),
  },
  returns: v.object({ applied: v.boolean(), userId: v.id('users') }),
  handler: async (ctx, args) => {
    const existingReceipt = await ctx.db
      .query('webhookReceipts')
      .withIndex('by_provider_eventId', (q) => q.eq('provider', 'clerk').eq('eventId', args.eventId))
      .unique();
    if (existingReceipt) {
      if (existingReceipt.payloadHash !== args.payloadHash) {
        throw new Error('Clerk webhook event ID was replayed with different content.');
      }
      const existingUser = await ctx.db
        .query('users')
        .withIndex('by_clerkSubject', (q) => q.eq('clerkSubject', args.clerkSubject))
        .unique();
      if (!existingUser) throw new Error('Webhook receipt exists without its canonical user.');
      return { applied: false, userId: existingUser._id };
    }

    const now = Date.now();
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerkSubject', (q) => q.eq('clerkSubject', args.clerkSubject))
      .unique();
    const decision = decideUserLifecycleTransition(
      existingUser
        ? {
            status: existingUser.status,
            lastLifecycleOccurredAt: existingUser.lastLifecycleOccurredAt,
          }
        : null,
      { type: args.type, providerOccurredAt: args.providerOccurredAt },
    );
    const disabled = decision.status === 'disabled';
    let userId;
    if (existingUser) {
      userId = existingUser._id;
      if (decision.apply) {
        await ctx.db.patch(existingUser._id, {
          status: decision.status,
          displayName: disabled ? existingUser.displayName : args.displayName,
          primaryEmailAddress: disabled
            ? existingUser.primaryEmailAddress
            : args.primaryEmailAddress,
          updatedAt: now,
          disabledAt: disabled ? now : undefined,
          disabledSource: disabled ? 'clerk' : undefined,
          disabledByEventId: disabled ? args.eventId : undefined,
          disabledProviderOccurredAt: disabled ? args.providerOccurredAt : undefined,
          ...(decision.updateLifecycleCursor
            ? {
                lifecycleProvider: 'clerk' as const,
                lastLifecycleEventId: args.eventId,
                lastLifecycleEventType: args.type,
                lastLifecycleOccurredAt: args.providerOccurredAt,
              }
            : {}),
        });
      }
    } else {
      userId = await ctx.db.insert('users', {
        clerkSubject: args.clerkSubject,
        status: decision.status,
        displayName: args.displayName,
        primaryEmailAddress: args.primaryEmailAddress,
        createdAt: now,
        updatedAt: now,
        disabledAt: disabled ? now : undefined,
        lifecycleProvider: 'clerk',
        lastLifecycleEventId: args.eventId,
        lastLifecycleEventType: args.type,
        lastLifecycleOccurredAt: args.providerOccurredAt,
        disabledSource: disabled ? 'clerk' : undefined,
        disabledByEventId: disabled ? args.eventId : undefined,
        disabledProviderOccurredAt: disabled ? args.providerOccurredAt : undefined,
      });
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
    return { applied: decision.apply, userId };
  },
});

/** Deploy-time smoke function proving auth helpers compile against generated types. */
export const requireCurrent = query({
  args: {},
  returns: v.object({ id: v.id('users') }),
  handler: async (ctx) => ({ id: (await requireActiveUser(ctx))._id }),
});
