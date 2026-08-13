"use node";

import { v } from 'convex/values';

import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action } from './_generated/server';
import { resolveTrustedInvitationRedirect } from './lib/invitationPolicy';

const invitationRole = v.union(
  v.literal('customer'),
  v.literal('staff'),
  v.literal('admin'),
);

/**
 * Staff invitations are authorized by Convex using the current Clerk JWT. The
 * staff/admin check also enforces a fresh second factor via the `fva` claim.
 */
export const create = action({
  args: {
    companyId: v.id('companies'),
    emailAddress: v.string(),
    role: invitationRole,
    redirectUrl: v.optional(v.string()),
  },
  returns: v.object({
    invitationId: v.id('invitations'),
    clerkInvitationId: v.string(),
  }),
  handler: async (ctx, args): Promise<{
    invitationId: Id<'invitations'>;
    clerkInvitationId: string;
  }> => {
    const authorization: { userId: Id<'users'>; companyId: Id<'companies'> } =
      await ctx.runQuery(internal.invitationsInternal.authorizeCreate, {
        companyId: args.companyId,
        role: args.role,
      });
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error('Clerk invitation service is not configured.');
    const emailAddress = args.emailAddress.trim().toLowerCase();
    if (!emailAddress) throw new Error('Invitation email is required.');
    const redirectUrl = resolveTrustedInvitationRedirect(
      args.redirectUrl,
      [
        process.env.SITE_URL ?? '',
        ...(process.env.CLERK_INVITATION_ALLOWED_ORIGINS ?? '').split(','),
      ],
    );

    const response = await fetch('https://api.clerk.com/v1/invitations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: emailAddress,
        redirect_url: redirectUrl,
        public_metadata: {
          companyId: args.companyId,
          role: args.role,
        },
      }),
    });
    if (!response.ok) throw new Error(`Clerk invitation failed with status ${response.status}.`);
    const invitation = (await response.json()) as {
      id?: string;
      expires_at?: number;
    };
    if (!invitation.id) throw new Error('Clerk returned no invitation ID.');
    let invitationId: Id<'invitations'>;
    try {
      invitationId = await ctx.runMutation(
        internal.invitationsInternal.persistCreated,
        {
          clerkInvitationId: invitation.id,
          companyId: authorization.companyId,
          emailAddress,
          role: args.role,
          invitedByUserId: authorization.userId,
          expiresAt: invitation.expires_at,
        },
      );
    } catch {
      const revokeResponse = await fetch(
        `https://api.clerk.com/v1/invitations/${encodeURIComponent(invitation.id)}/revoke`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (!revokeResponse.ok) {
        throw new Error(
          'Invitation could not be persisted or safely revoked. Manual Clerk reconciliation is required.',
        );
      }
      throw new Error(
        'Invitation authorization changed before persistence; the Clerk invitation was revoked.',
      );
    }
    return { invitationId, clerkInvitationId: invitation.id };
  },
});
