---
trigger: model_decision
description: Host-native specialists map for Antigravity (see specialists.json).
---

# Specialists (host-native)

SSOT: `.agents/specialists.json` · compile: `npm run host:compile`

Skills SSOT: `.agents/skills/` (Agent Skills standard).

- **A0**: Root orchestrator: converts goals into work contracts, coordinates domain dispatch, manages circuit breakers.
  - Allow: `.agents/goals/**`, `.learnings/**`, `implementation_plan.md`, `walkthrough.md`
- **A1**: Read-only codebase intelligence: Graphify traversal, dependency mapping, blast radius calculation.
  - Allow: ``
- **A2**: Product/tenant boundary isolation, white-label configurations, and architecture decisions.
  - Allow: `src/config/**`, `src/types/product/**`, `docs/architecture/**`
- **A3**: Design system tokens, visual hierarchy, typography, industrial palette (#FF5A00 on charcoal).
  - Allow: `src/app/globals.css`, `src/index.css`, `src/styles/**`, `DESIGN.md`
- **A4**: Next.js App Router, React 19, shadcn/ui components, marketing & portal vertical slices.
  - Allow: `src/app/**`, `src/components/**`, `src/views/**`, `src/data/**`
- **A5**: Convex schema, queries, mutations, actions, auth helpers, migrations, and backend tests.
  - Allow: `convex/**`, `src/lib/*convex*`, `src/lib/*db*`, `src/lib/*auth*`
- **A6**: Adversarial inspection of trust boundaries, AuthKit/WorkOS, RBAC, webhooks, and secrets.
  - Allow: `src/lib/auth/**`, `SECURITY.md`, `docs/security/**`
- **A7**: GitHub Actions workflows, action pinning, branch rulesets, and Vercel build verification.
  - Allow: `.github/**`, `.husky/**`, `vercel.ts`, `scripts/ci*`
- **A8**: Local SEO, JSON-LD structured data, service-area routes, and CRO conversion funnels.
  - Allow: `src/app/(marketing)/**`, `src/app/service-area*/**`, `src/app/robots*`, `src/app/sitemap*`
- **A9**: Playwright end-to-end tests, responsive matrix checks, accessibility audits.
  - Allow: `tests/**`, `playwright.config.ts`
- **A10**: Exact-head reconciliation, evidence audit, architecture conformance, and release gating.
  - Allow: `.agents/goals/_eval/**`, `docs/releases/**`

Always obey root **AGENTS.md**. Never bulk-load wiki/GRAPH_REPORT.
