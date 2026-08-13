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
