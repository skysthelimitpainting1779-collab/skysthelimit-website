# Current Architecture Decisions

**Repository:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`  
**Audited baseline:** `c7e94605eefdace7a76ce5145808478df8503dbb`

This file is authoritative for the migration target. It overrides stale target-state guidance in `README.md`, `.agents/STACK.md`, generated specialist instructions, and legacy CMS/portal planning documents.

## ADR-001 — Convex is the operational backend and business-state system of record.

- Supabase, Payload, and Directus are migration sources and rollback dependencies only.
- Do not add new product features to legacy data systems.
- Convex owns domain state, authorization, audit records, events, idempotency, and content publication state.

## ADR-002 — Clerk is the identity provider; Convex is the authorization authority.

- Do not reopen Clerk versus WorkOS.
- Staff access is invitation-only.
- Privileged staff roles require MFA.
- Never infer durable resource ownership or merge accounts from an email string alone.
- Supabase Auth remains only for a bounded rollback window.

## ADR-003 — Use one Vercel project with Vercel Services: a Next.js web service and an internal TypeScript integrations service, with Convex as the operational backend.

- The web service owns marketing, customer portal, and operator route groups.
- The integrations service owns verified provider webhooks, integration adapters, and Vercel Workflow entrypoints.
- Use Vercel service bindings for internal service communication.
- Expose only explicit integration/webhook routes through service rewrites.
- Migrate the project framework from nextjs to services in preview first; production conversion requires G70.
- Authenticated surfaces do not inherit the marketing shell.
- Browser code never receives service credentials or unrestricted database clients.

## ADR-004 — Use Convex scheduling for internal deterministic jobs and Vercel Workflow for durable multi-step external effects.

- External writes require idempotency and persisted attempt state.
- Webhook handlers verify signatures over the raw request body and deduplicate event IDs.
- Lead, proposal, payment, onboarding, and review sequences must be observable and replayable.

## ADR-005 — Use Stripe-hosted Checkout Sessions for deposit and invoice-payment boundaries.

- Amounts and terms come from deterministic approved business data.
- Stripe webhooks are signature-verified and event-ID idempotent.
- No live charge, refund, or payout occurs without the named production gate.

## ADR-006 — Customer, lead, proposal, agreement, and project files are private by default.

- The server validates MIME, size, ownership, privacy class, and retrieval authorization.
- Public media is an explicit publication class.
- No customer file is represented by a permanently public storage URL.

## ADR-007 — Convex becomes the sole content-publication authority after verified migration.

- Export and reconcile Directus, Payload, Supabase, and static fallbacks.
- Do not publish named testimonials without source provenance.
- Remove legacy CMS packages only after rollback and retention gates pass.

## ADR-008 — Use source-owned shadcn/ui components and the premium Measured Craft design system.

- Preserve the recognizable orange/charcoal brand.
- Use semantic geometry and radius tokens instead of forcing radius zero on every element.
- Meet WCAG 2.2 AA, keyboard, focus, motion, and responsive requirements.

## ADR-009 — Do not place raw PII in browser persistence, referral URLs, analytics, logs, or public file URLs.

- Offline drafts use an opaque server-issued resume token.
- Referral identity uses opaque, signed, revocable codes.
- Analytics uses internal entity IDs and server-side revenue facts.

## ADR-010 — The compiled Graph Engineer v2 artifacts own execution contracts; Graphifyy owns scoped code discovery; the goal loop owns implementation.

- Never edit or commit directly on main.
- Create a dedicated integration branch and worktree from the latest origin/main before any modification.
- Use additional worker worktrees only for independent tasks with disjoint files and resource locks.
- Treat compiled/.graph/graph.json as the execution contract.
- Do not install or rerun the Graph Engineer skill during normal implementation.
- Only request structural graph recompilation when evidence proves the compiled graph is invalid or scope materially changes.
- Query Graphify first and initially open only one to three cited source files.
- Production mutation, communications, payments, GBP edits, cutover, and decommissioning require their named gates.
- Generic graph labor-hour estimates are not schedule authority.
- Every graph node must load the primary domain-specific skill from TASK_SKILL_MATRIX.json.
- Every external-library task must query current Context7 documentation before implementation.
- Every Vercel platform task must use the connected Vercel plugin and Vercel official documentation search.
