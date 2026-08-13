# Authorization Matrix

Status: G20 review artifact
Last verified: 2026-07-27
Implementation source: `convex/lib/authz.ts`
Verification source: `tests/convex-domain.test.mjs`

## Boundary

Clerk proves session identity. Convex is the authorization authority for
application users, companies, memberships, projects, and resource grants.
Protected access is deny-by-default and never derives ownership from an email
address.

All rows below require a valid Clerk subject mapped to an active canonical
Convex user. A disabled user, missing user, or durable-subject mismatch is
denied before resource authorization.

## Access matrix

| Principal state | Canonical user | Company access | Project access | Privileged staff access |
| --- | --- | --- | --- | --- |
| Anonymous or invalid session | Deny | Deny | Deny | Deny |
| Missing canonical user | Deny | Deny | Deny | Deny |
| Disabled canonical user | Deny | Deny | Deny | Deny |
| Active customer without membership | Allow identity only | Deny | Deny | Deny |
| Active customer with active membership | Allow | Allow for the same active company | Allow only with an active, same-company, project-specific grant containing the requested permission | Deny |
| Active staff with active membership and current-session MFA | Allow | Allow for the same active company | Allow only with an active, same-company, project-specific grant containing the requested permission | Allow when the caller's role is explicitly accepted |
| Active admin with active membership and current-session MFA | Allow | Allow for the same active company | Allow only with an active, same-company, project-specific grant containing the requested permission | Allow when the caller's role is explicitly accepted |
| Disabled or revoked membership | Allow identity only | Deny | Deny | Deny |
| Archived company | Allow identity only | Deny | Deny | Deny |
| Complete or archived project | Allow identity only | Not sufficient | Deny | Not sufficient |
| Missing, revoked, cross-company, or wrong-permission grant | Allow identity only | Not sufficient | Deny | Not sufficient |

## Enforced invariants

- `requireActiveUser` requires a Clerk subject, an exact durable subject match,
  and an active canonical user.
- `requireCompanyMembership` requires an active company and active membership.
  Optional role restrictions are explicit allowlists.
- Staff and admin membership requires current-session second-factor age within
  the configured maximum; no historical user field can satisfy MFA.
- `requireProjectGrant` requires an active project, access to the project's
  company, and an active grant for that user, company, project, and permission.
- Cross-company grants and email-based ownership are never accepted.
- Audit facts receive actor and company identifiers from an already-authorized
  access result.

## Environment contract

The authorization rules are identical in development, preview, and production.
Environment selection changes deployment identity and provider configuration,
not access policy. Deployment validation fails closed when the declared
application environment and Convex deployment tier disagree.

## Verification

The focused G20 verification command is:

```bash
npx tsx --test tests/convex-domain.test.mjs tests/convex-domain-schema.test.mjs tests/manage-convex-auth.test.mjs tests/convex-deployment-command.test.mjs tests/migration-inventory.test.mjs tests/convex-migration-operator.test.mjs
```

The authorization cases cover anonymous access, disabled users, durable-subject
mismatch, current-session MFA, active tenant membership, cross-project access,
explicit project grants, wrong permissions, event/idempotency conflicts,
webhook replay, and audit attribution.
