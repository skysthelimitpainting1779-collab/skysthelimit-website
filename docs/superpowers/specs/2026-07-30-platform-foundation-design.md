# Platform Foundation Design

**Date:** 2026-07-30  
**Status:** Approved for non-production implementation  
**Repository:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`  
**Canonical Vercel project:** `website` (`prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`)  
**Canonical Vercel team:** `team_bseTA2AuCO6A2fCOVY9ubrJo`

## Goal

Create a durable repository, GitHub, Vercel, and agent-governance foundation that lets
multiple coding agents deliver safely without allowing an unreviewed production change.

The foundation must preserve the verified Convex and Clerk migration already merged into
`dev`, keep `main` production-only, and make preview-first delivery the default.

## Current verified baseline

- `dev` contains the exact governed migration head
  `ebb0282ceb275b52fe397504a2fa8792c43672d3`.
- Repository Quality and Security passed for that exact head.
- The canonical Vercel `website` project produced a READY preview for that exact head.
- `main` remains unchanged and owns production.
- The duplicate non-canonical Vercel project remains a tracked cleanup item; it is not a
  valid release signal.

## Architecture decision

Keep the current bounded platform architecture:

```text
main
└── production releases only

dev
├── non-production integration branch
├── canonical long-lived Vercel Preview
└── release candidate source

feat/* | fix/* | infra/* | docs/* | agent/* | chore/*
└── short-lived work branches and pull-request previews
```

Application boundaries remain:

```text
Next.js 16 on Vercel
├── marketing site
├── operator surface
├── customer portal
└── route handlers / verified webhooks

Convex
├── operational data
├── authorization
├── realtime state
└── deterministic internal scheduling

Clerk
└── identity and session proof

Vercel Workflow
└── future durable, multi-step external effects only
```

Clerk remains the implemented identity provider. Replacing it with WorkOS would be a
separate ADR and migration project; it is not part of this foundation change.

## Branch and release policy

### `main`

- Production-only.
- No direct pushes.
- Accepts release pull requests from `dev`, plus explicitly approved `hotfix/*` branches.
- Requires repository quality, security, canonical Vercel deployment, approval, and
  rollback evidence.
- Production promotion, domains, secrets, billing, and provider resources remain explicit
  human-approved operations.

### `dev`

- Non-production integration branch.
- No direct human or agent pushes after initial bootstrap.
- Accepts short-lived branches through pull requests.
- Every merged head must pass lifecycle verification, tests, security checks, and a
  canonical Vercel Preview.
- Uses Preview-scoped environment variables and non-production provider resources.

### Work branches

- One purpose and one owner lease.
- Branch prefixes are constrained and machine-checkable.
- Agents never force-push shared branches.
- Governed commits preserve execution trailers and immutable evidence receipts.

## Deployment model

Vercel production continues to track `main`. Every other branch is a preview deployment.
`dev` receives a stable branch preview alias and acts as staging without becoming a second
production environment.

The canonical deployment signal is only:

```text
Team: team_bseTA2AuCO6A2fCOVY9ubrJo
Project: prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
Status context: Vercel – website
```

A deployment from any duplicate project is informational noise and must not satisfy a
release gate.

## Vercel services policy

Enable platform services only when a shipped feature consumes them:

| Service | Foundation state | Activation condition |
|---|---|---|
| Git integration | Active | Canonical project only |
| Analytics | Active | Already rendered in application |
| Speed Insights | Active | Already rendered in application |
| Functions / Fluid Compute | Active | Next.js route handlers |
| Convex | Active | Matched development, preview, and production bundles |
| Clerk | Active | Matched development, preview, and production bundles |
| Resend | Configured boundary | Verified domain and transactional flow |
| Blob | Deferred | Private upload contract and access tests exist |
| Workflow | Deferred | Durable external-effect workflow has tests and rollback |
| AI Gateway | Deferred | Model-using feature, budget, telemetry, and kill switch exist |
| Queues | Deferred | Measured fan-out or throughput requirement exists |
| Stripe | Deferred production use | Approved pricing, webhook, idempotency, and refund rules |

No paid or stateful integration is installed merely because it exists.

## Environment isolation

| Concern | Development | Preview / `dev` | Production / `main` |
|---|---|---|---|
| App tier | `development` | `preview` | `production` |
| Convex | Developer deployment | Preview deployment | Production deployment |
| Clerk | Development instance | Preview-safe instance/config | Production instance |
| Email | Suppressed/test recipients | Approved test recipients | Real recipients |
| Payments | Test mode | Test mode | Live mode after approval |
| Cron/workflows | Local/test | Preview-safe/no customer effects | Approved live effects |
| Data | Fixtures/synthetic | Non-production | Production |

Secrets never move through Git. Integration-provided variables must be reviewed for scope
and must not be copied from Production to Preview by default.

## Agent governance

`AGENTS.md` is the portable kernel. Host-specific files may adapt it but may not weaken it.

Every non-trivial change follows:

```text
goal → discovery → current docs → plan → failing contract
→ smallest implementation → focused verification → broad verification
→ independent review → canonical preview → integration
```

Agents must stop on:

- ambiguous production effect,
- missing provider/environment identity,
- failed canonical preview,
- unresolved high-severity security finding,
- stale or contradictory execution state,
- absent rollback path,
- cost or attempt limit breach.

Historical branch names inside the retained audited graph remain evidence history. The
current operational branch policy in this design and `docs/BRANCHING_AND_RELEASES.md`
controls new work; graph dependencies, stop gates, node IDs, and evidence requirements
remain authoritative.

## GitHub controls

Repository-contained controls include:

- branch-policy CI,
- required test and security workflows,
- CODEOWNERS,
- pull-request contract,
- Dependabot targeting `dev`,
- documented ruleset manifests,
- release and rollback runbooks.

Account-level rulesets and Vercel dashboard controls are applied as one-time settings.
Their desired state is committed and tracked so configuration drift is visible.

## Recovery

- Never repair `main` by rewriting history.
- Revert the offending release commit or promote the last known-good Vercel deployment.
- Disable outbound effects before database or provider recovery.
- Convex migrations require a tested rollback or compensating migration.
- The exact deployed commit, Vercel deployment ID, environment, and verification result
  are recorded for every release.

## Acceptance criteria

The foundation is accepted when:

1. `dev` is the documented integration branch and `main` is production-only.
2. CI and security run on pull requests and pushes involving `dev` or `main`.
3. A branch-policy test rejects invalid release and integration paths.
4. Vercel deploys `dev` and supported work branches as Preview, never Production.
5. `AGENTS.md`, CODEOWNERS, PR templates, environment policy, and runbooks agree.
6. The exact foundation head passes Repository Quality and Security.
7. The canonical `website` Vercel preview is READY for the exact foundation head.
8. No production resource, domain, secret, or customer-facing effect is mutated.
