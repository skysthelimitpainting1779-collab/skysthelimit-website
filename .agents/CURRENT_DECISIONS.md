# Current Architecture Decisions

This file is authoritative for the active migration target. It overrides stale target-state
guidance in `README.md`, generated specialist instructions, historical graph branch names,
and legacy CMS or portal plans.

## Repository and delivery topology

- `main` is the production branch and accepts release pull requests from `dev`, plus
  explicitly approved `hotfix/*` work.
- `dev` is the non-production integration branch and deploys through Vercel Preview.
- Short-lived work branches target `dev`.
- The branch graph, canonical Vercel identity, and effect boundaries are defined in
  `config/platform-foundation.json`.
- The retained audited execution graph remains authoritative for node dependencies, stop
  gates, node IDs, and evidence requirements. Its historical integration-branch labels
  remain provenance and do not override the current operational branch policy.

## Operational architecture

- Convex is the operational backend and business-state system of record.
- Supabase, Payload, and Directus are migration sources and rollback dependencies only.
- Clerk proves identity; Convex owns authorization through durable provider IDs and
  explicit resource grants.
- Staff access is invitation-only, privileged staff require MFA, and email strings are
  never durable ownership grants.
- Replacing Clerk with WorkOS requires a separate approved ADR, migration, rollback, and
  authorization test project. It is not part of the current platform foundation.

## Vercel topology and effects

- The canonical Vercel team is `team_bseTA2AuCO6A2fCOVY9ubrJo`.
- The canonical project is `website`
  (`prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`).
- Only the `Vercel – website` status context is valid release evidence.
- Production tracks `main`; `dev` and short-lived branches are Preview-only.
- The production-linked `website` project remains a native Next.js application through
  G70. Its proven build path is `npm run build:vercel`, which validates environment
  separation, deploys Convex functions to the selected deployment, and builds Next.js.
- The target topology may add an internal TypeScript `integrations` service for verified
  provider webhooks, adapters, and Vercel Workflow entrypoints.
- That service must first run in a dedicated non-production Services project. It is not
  activated by the production-linked `website` project before G70 approval and a
  successful Preview packaging contract.
- When activated, internal service calls use Vercel service bindings; only explicit
  webhook routes receive public rewrites.
- Convex scheduling handles deterministic internal jobs. Vercel Workflow handles durable
  multi-step external effects.
- Webhooks verify raw-body signatures, and provider event IDs are idempotent.
- Production framework conversion, promotion, domains, secrets, billing, provider
  resources, and customer-facing effects require the named approval gate.

## Vercel services policy

- Git integration, Functions, Analytics, Speed Insights, Convex, and Clerk are active
  platform dependencies.
- Resend remains the transactional email boundary, subject to verified domain,
  environment, consent, and recipient controls.
- Blob, Workflow, AI Gateway, Queues, and live Stripe activate only when a shipped feature
  has executable security, environment, cost, observability, and rollback contracts.
- Do not install a parallel database, cache, queue, auth provider, or workflow engine
  without a measured requirement and an approved ADR.

## Revenue, files, and content

- Stripe-hosted Checkout Sessions are the payment boundary; amounts and terms come from
  approved canonical business data.
- Files are private by default. This includes customer, lead, proposal, agreement,
  project, bid, and operational files.
- Servers validate file type, size, ownership, privacy class, and retrieval authorization;
  public media is an explicit publication class.
- Convex becomes the sole content-publication authority after verified migration and
  reconciliation.
- Legacy services are removed only after rollback, restore, retention, and decommission
  gates pass.

## Product and privacy

- Use source-owned shadcn/ui components and the Measured Craft design system.
- Preserve the orange and charcoal brand with semantic geometry tokens.
- Meet WCAG 2.2 AA, keyboard, focus, reduced-motion, and responsive requirements.
- No raw PII is stored in browser persistence, referral URLs, analytics, logs, or public
  file URLs.
- Offline drafts and referrals use opaque server-issued identifiers.

## Execution contract

- The compiled graph artifacts own dependencies, gates, risk, and evidence contracts.
- Graphifyy owns scoped live code discovery; use query-first discovery and do not
  bulk-load graph reports or generated wikis.
- Every node loads its primary domain skill and current official documentation before
  implementation.
- Local, fixture, test-mode, and Preview-safe work may proceed through B60.
- Production mutation, communications, payments, GBP edits, cutover, and decommissioning
  require their named gates.
- Every change targets the exact current `dev` head, begins with a focused failing
  contract, and ends with exact-head GitHub and canonical Vercel verification.
