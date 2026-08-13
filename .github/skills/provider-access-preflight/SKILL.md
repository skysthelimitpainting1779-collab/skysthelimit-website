---
name: provider-access-preflight
description: Verify exact provider account, team, resource, environment, permission, and execution-node bindings before OAuth, external-provider access, or provider mutation. Use whenever an agent is about to authenticate to or change GitHub, Vercel, Convex, Clerk, Stripe, Cal.com, Resend, Supabase, Directus, Payload, Turso, Google Business Profile, or an SMS provider.
---

# Provider Access Preflight

This is a read-only necessary gate. It never performs the provider operation and
never grants approval.
Run it before OAuth or provider mutation.

## Workflow

1. Read the canonical provider ledger at
   `.agents/governance/provider-access-ledger.json`. Do not supply a replacement.
2. Use a provider read-only identity or metadata call to observe the account,
   team, resource, environment, and permission. Do not start OAuth or mutation.
3. Confirm the governed node has an active lifecycle lease in the shared SQLite
   control plane. The command binds `nodeId` to that lease rather than trusting
   the request by itself.
4. Write a temporary secret-free request outside the repository:

```json
{
  "schemaVersion": "1.0.0",
  "nodeId": "STL-104",
  "providerId": "vercel",
  "operation": "mutate",
  "accountId": "observed-account-id",
  "teamId": "observed-team-id-or-null",
  "resourceType": "deployment",
  "resourceId": "observed-resource-id",
  "environment": "preview",
  "permission": "deployment:preview",
  "observedAt": "2026-07-29T15:42:00Z"
}
```

5. Run:

```powershell
npm run providers:preflight -- --input <absolute-request-path>
```

6. Stop on any nonzero exit. Record the decision JSON, repository HEAD, provider
   read-only evidence reference, and timestamp in the node evidence.
7. Continue only when `allowed` is `true` and every separate lifecycle,
   approval, and environment gate also passes.

## Rules

- Never place tokens, secrets, credentials, authorization headers, or local user
  paths in the request.
- Treat missing, partial, unverified, blocked, stale, or mismatched evidence as
  denial.
- Refresh the canonical provider ledger with a read-only observation immediately
  before the gate. Stale ledger evidence is a denial.
- Mutation permissions must explicitly name a write capability and use an
  approved non-Production environment.
- Treat an omitted team as a mismatch when the provider ledger names a team.
- Never infer Production authorization from a passing preflight. Production
  mutation remains blocked until a separate exact approval event authorizes it.
- Delete the temporary request after recording bounded, secret-free evidence.
