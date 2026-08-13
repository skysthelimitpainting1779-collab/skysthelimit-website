# Research — Ship Sky's the Limit Convex production operating system

## Graph query

```bash
npm run graph:query -- "B00 control plane goal scripts architecture guard host compile and Vercel configuration" --budget 1500
```

## Baseline and control plane

- Integration branch/worktree: `agent/skys-limit-convex-os` at `C:\Users\Johnny Cage\DEV\skys-limit-worktrees\agent-skys-limit-convex-os`.
- Fetched `origin/main` equals audited commit `c7e94605eefdace7a76ce5145808478df8503dbb`; no delta re-audit is required.
- Baseline passes lint, 308 tests, and the Next.js production build. Fresh-worktree Graphify initially failed because generated output was absent; `graph:update` rebuilt 3,878 nodes and 4,910 edges.
- Goal/Graphify/ship/host scripts existed but their package aliases were absent. The prior Guapo goal was active and needed a non-destructive pause/resume transition.
- Stale `.agents/STACK.md` and specialist prompts prescribed Supabase/Payload, a single Next service, and global radius zero. `.agents/mcp_config.json` hardcoded the original checkout.

## Vercel evidence

- Connector project: `website` / `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`, team `team_bseTA2AuCO6A2fCOVY9ubrJo`, framework `nextjs`, Node 24.
- Production: `dpl_C2F52MyDkxbfUbmDSruP2CcMpu8v`, READY, commit `c7e94605…`. Prior production rollback reference: `dpl_829VVrdQ6qMq16EHLjDdMXWdUBHU`.
- Runtime errors: 70 `useSearchParams()` CSR bailouts under `/painting-services/[slug]`; one Payload/Postgres self-signed-certificate failure under `/admin`.
- Linked resources: Turso, Statsig, Autonoma UI testing, Prisma Postgres, and Supabase. No resource was created, removed, or re-scoped.
- Preview configuration lacks Convex, Clerk, Stripe, and Workflow credentials/resources.
- Current Vercel and Context7 docs use stable `services`, service `bindings`, and explicit service rewrites. The package plugin’s `experimentalServices` example is stale.

## Context7 contracts

- Library ID: `/websites/vercel`
- Contract: Preview variables and integrations are independently scoped from Production, and branch-specific Preview configuration may differ.
- Library ID: `/websites/convex_dev`
- Contract: Convex deploy selects its target from an explicit deployment identity or deploy key; migration and inventory commands must name a non-production deployment.
- Contract: `convex env set` accepts `--deployment <name>`, but a Vercel-managed deploy key does not substitute for Convex owner authentication when administering deployment environment variables; use the owner dashboard for that operation.
- Library ID: `/clerk/clerk-docs`
- Contract: Clerk development and production instances use distinct credentials and issuer configuration, which must align with the corresponding Convex deployment.
- Contract: a `pk_test_` publishable key identifies Clerk's non-production tier and encodes the Frontend API domain used as the Preview JWT issuer.
- Library ID: `/supabase/supabase`
- Contract: a read-only production inventory may inspect schema/table metadata, row counts, and RLS state without exporting row payloads; exposed `public` tables require RLS and explicit grants.
- Library ID: `/websites/ai_google_dev_gemini-api`
- Contract: `gemini-3.1-flash-lite` is the supported cost-efficient model identifier for high-volume lightweight tasks; the Graphify labeler must fail closed rather than accept provider errors with placeholder labels.

## Primary risks and non-goals

- Production framework settings, resources, secrets, domains, and aliases remain unchanged through B60.
- Existing tests intentionally preserve unsafe review gating, browser PII persistence, and email ownership; those tests must be replaced rather than accommodated.
- Missing external credentials block only their dependent preview nodes.
- High-risk boundaries require independent verification evidence; no production approval is implied by this goal.
