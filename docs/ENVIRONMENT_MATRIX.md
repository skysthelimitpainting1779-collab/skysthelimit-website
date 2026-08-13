# Environment Matrix

Environment isolation is a security boundary. Development, Preview, and Production use
matched provider bundles, but they do not share unrestricted credentials or live effects.

## Matrix

| Concern | Development | Preview (`dev` and PRs) | Production (`main`) |
|---|---|---|---|
| `NEXT_PUBLIC_APP_ENV` | `development` | `preview` | `production` |
| Convex | developer deployment | Preview deployment | production deployment |
| Clerk | development instance | Preview-safe instance/config | production instance |
| Data | fixtures or synthetic | non-production | production |
| Email | captured or allowlisted | approved test recipients | real recipients |
| SMS/calls | disabled or sandbox | disabled or allowlisted | approved live provider |
| Stripe | test mode | test mode | live only after payment gate |
| Cron | local/manual | Preview-safe and no customer effects | approved production schedule |
| Vercel Workflow | local/test | test-mode, reversible | approved durable effects |
| AI models | local/test budget | capped, logged, kill-switch enabled | approved budget and policy |
| Analytics | development disabled where practical | no raw PII | no raw PII |
| Files | fixture/private | private non-production | private production |

## Vercel environment-variable scope

Use the narrowest scope that works:

- Development variables support local linked development.
- Preview variables support `dev` and pull-request deployments.
- Production variables are available only to Production deployments.
- Branch-specific Preview overrides may be used for `dev`.
- Production secret values are not copied into Preview by default.
- Public variables use `NEXT_PUBLIC_` only when browser exposure is intentional.
- Deployment keys, webhook secrets, API keys, private tokens, and service credentials are
  server-only.

Every variable change records:

```text
name without value
owner
provider
environment scope
consumer
rotation or expiration
verification command
rollback/removal step
```

Never put secret values in GitHub issues, pull requests, logs, screenshots, telemetry,
evidence files, or model prompts.

## Provider bundles

### Convex and Clerk

The Convex URL, deployment key, Clerk publishable key, Clerk secret, JWT issuer, and
webhook signing secret must come from the same environment bundle. A mixed bundle fails
closed.

- `CONVEX_DEPLOY_KEY` is deployment-time only.
- `NEXT_PUBLIC_CONVEX_URL` is the selected runtime deployment.
- Clerk proves identity.
- Convex authorizes every protected resource.
- Privileged Preview identities remain separate from Production identities where
  practical.

### Resend

Preview sending is restricted to approved test recipients. Production sending requires:

- verified sending domain;
- environment-correct API key;
- recipient consent and suppression logic;
- idempotency and delivery-state persistence;
- approved templates and sender identity.

### Stripe

Preview always uses test mode. Live mode requires approved prices, webhook signature
verification, event deduplication, refund behavior, reconciliation, and rollback.

### Vercel Workflow, Queues, and AI Gateway

These remain disabled until a feature has:

- an executable input/output contract;
- cost and attempt limits;
- idempotency and bounded retries;
- timeout and cancellation;
- observability and ownership;
- a kill switch;
- a compensating action or rollback.

## Preview effect policy

Preview may read and write only non-production resources. It must not:

- send unrestricted customer messages;
- charge real payment methods;
- mutate production Convex data;
- edit production domains or provider configuration;
- publish public business claims automatically;
- submit contracts or municipal bids;
- invoke an irreversible workflow.

## Promotion checklist

Before `dev` can release to `main`:

- environment bundle identity is verified;
- required variables exist in Production;
- no Production-only variable leaked into Preview;
- schema and migration effects have rollback;
- customer-facing effects have approval and kill switches;
- exact-head Preview and smoke tests pass.
