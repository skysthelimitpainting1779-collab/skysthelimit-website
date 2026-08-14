# Context7 Universal Documentation Grounding Mandate

**Scope:** Universal across all agents and verifiers.

---

## 1. External Knowledge Grounding Rule
Agents MUST NOT trust static model pre-training weights for third-party libraries, SDKs, and platform APIs. Whenever work materially touches external dependencies, querying Context7 is mandatory.

### Mandatory Coverage Technologies:
- **Frameworks & Core**: Next.js (App Router, Server Components), React 19
- **Platform & Data**: Convex (schema, mutations, queries, auth, actions), WorkOS / AuthKit, Supabase, Vercel Platform & Edge Config
- **UI & Animation**: shadcn/ui, Radix UI / Base UI, Motion (Framer Motion v12+), Tailwind CSS v4
- **Testing & Tooling**: Playwright, GitHub Actions, Vitest / Node Test Runner
- **Integrations**: Stripe, Resend, PostHog

---

## 2. Four-Step Resolution Lifecycle
1. **Resolve Library ID**: Execute `resolve-library-id` using the exact library name (e.g. `convex`, `next`, `motion`).
2. **Select Canonical Match**: Choose authoritative repository/project ID (e.g. `/vercel/next.js`, `/get-convex/convex`).
3. **Targeted Query**: Execute `query-docs` with the resolved ID and a focused technical question scoped to the exact API or design pattern.
4. **Evidence-Based Implementation**: Implement strictly in conformance with the retrieved official specification.

---

## 3. Anti-Patterns & Efficiency
- Do NOT invoke Context7 for internal business logic calculations or purely local repository types.
- Do NOT combine multiple disjoint library questions into a single fuzzy query.
