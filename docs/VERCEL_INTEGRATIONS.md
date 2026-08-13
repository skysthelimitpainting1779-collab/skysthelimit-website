# Vercel Services and Integrations

## Canonical project

```text
Team ID:    team_bseTA2AuCO6A2fCOVY9ubrJo
Project ID: prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
Project:    website
Status:     Vercel – website
Production: main
Staging:    dev as Vercel Preview
```

Only this project is a deployment authority. A duplicate project, deployment, or GitHub
status must not satisfy a release gate.

## Active baseline

| Capability | Owner | State | Rule |
|---|---|---|---|
| Git integration | Vercel/GitHub | active | canonical repo and project only |
| Next.js hosting/CDN | Vercel | active | `main` Production, other branches Preview |
| Functions/Fluid Compute | Vercel | active | Next.js route handlers and server execution |
| Analytics | Vercel | active | no raw PII |
| Speed Insights | Vercel | active | performance telemetry only |
| Convex | Convex integration/config | active | operational backend |
| Clerk | Clerk integration/config | active | identity proof |
| Resend | application integration | bounded | transactional email after environment checks |
| Cron | `vercel.json` | active | production schedule; secret-authenticated route |

## Deferred services

| Service | Add only when | Required controls |
|---|---|---|
| Vercel Blob | private upload feature ships | file validation, ownership, privacy, retention |
| Vercel Workflow | durable external process ships | idempotency, retries, wait/cancel, compensation |
| Vercel Queues | measured fan-out requirement exists | consumer ownership, DLQ/replay, age alarms |
| AI SDK / AI Gateway | AI feature ships | provider routing, budgets, traces, evals, kill switch |
| Stripe live | payment release approved | test mode first, signatures, reconciliation, refunds |
| Dedicated integrations service | service boundary is proven | Preview project, bindings, public-route allowlist |
| Additional database/cache | measured requirement exists | ADR, ownership, backup, migration, exit plan |

Do not install a paid or stateful integration simply to make the stack appear complete.

## Integration installation contract

Before installing through the Vercel Marketplace or CLI:

1. Name the feature and measurable requirement.
2. Confirm the Vercel team and project.
3. Review requested permissions and resources.
4. Define Development, Preview, and Production scope.
5. Estimate recurring and usage-based cost.
6. Define data classification and retention.
7. Add variables without exposing values.
8. Add a failing integration contract.
9. Verify Preview.
10. Record uninstall, export, and rollback steps.
11. Require explicit approval before Production activation.

## Deployment verification

The deployment workflow checks:

- exact 40-character Git SHA;
- canonical `website-*.vercel.app` host family or approved production domain;
- canonical team and project through the Vercel API;
- READY state;
- HTTP health;
- customer-route smoke tests.

Project and team IDs are non-secret constants. `VERCEL_TOKEN` and deployment-protection
bypass values remain secrets.

## Deployment protection

Preview deployments should use Vercel Deployment Protection. Automation receives only a
dedicated bypass secret, and the smoke workflow is the only expected consumer. Never place
the bypass value in a URL, log, issue, or committed file.

## Duplicate project cleanup

A non-canonical Vercel project currently emits failed deployment statuses. It must be
disconnected or removed after confirming:

- the canonical project owns the production domains;
- the canonical project has the complete environment matrix;
- no required deployment or integration exists only on the duplicate;
- the last known-good rollback remains available.

Until removal, ignore the duplicate status for release decisions and track cleanup in
GitHub.

## Service ownership

Convex owns current business state. Vercel owns application deployment and durable
execution primitives. Clerk owns identity proof. Resend owns email transport. Stripe owns
payment processing. No two services should own the same business state or orchestration
lifecycle.
