---
name: clerk-convex-authorization
description: Use when integrating Clerk identity with Convex, protecting routes, synchronizing identity lifecycle, implementing roles, invitations, MFA, or resource authorization.
---

# Clerk and Convex Authorization

Use current Clerk and Convex official docs.

Identity and authorization are separate:
- Clerk proves identity.
- Convex maps the durable provider ID to an application user and explicit resource grants.

Require invitation-only staff, MFA for privileged roles, verified lifecycle webhooks, disabled-user enforcement, and deny-by-default resource checks. Never use an email string as the final ownership grant. Test anonymous, customer, staff, disabled, cross-company, and cross-project cases.

## Context7 contracts

- `/clerk/clerk-docs`: verified webhook envelopes carry a provider event `timestamp`; use it for ordering rather than receipt time. `user.deleted` has a reduced payload, so deletion handling must not depend on profile fields. Treat disabled state as sticky: non-delete synchronization is not an explicit authorization to restore access.
- `/clerk/clerk-docs`: Clerk session-token `fva[1]` is second-factor verification age. Recheck it with staff/admin membership immediately before privileged persistence.
- `/clerk/clerk-docs`: an invitation created through the Backend API can be compensated with `POST /v1/invitations/{invitation_id}/revoke`.
- `/clerk/clerk-docs`: instance invitation lifecycle is authoritative through `invitation.created`, `invitation.accepted`, and `invitation.revoked` events. Never infer acceptance from `user.created`/`user.updated` or an email-only pending-invitation lookup; bind state transitions to the exact provider invitation ID.
- `/clerk/clerk-docs`: `users.getUserList({ emailAddress })` returns Clerk user objects including their provider IDs. For generic invitation acceptance payloads that do not carry an accepted user ID, resolve the unique Clerk user through the Backend API and map the resulting Clerk subject to the canonical user; email alone is never the membership grant.
- `/websites/convex_dev`: external API calls belong in actions and durable writes in mutations. Recheck mutable authorization inside the post-side-effect mutation; if it rejects, compensate the external side effect.

## Provider/local persistence race

An accepted or revoked provider invitation event can arrive before the action
persists its local invitation row. When the exact provider invitation ID is
unknown locally, either durably stage the verified event for reconciliation or
throw so the provider retries. Never write a succeeded webhook receipt or return
success for an event that has not been applied or durably staged.
