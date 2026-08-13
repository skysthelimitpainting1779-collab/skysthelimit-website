# B20 Convex, Clerk, authorization, and migration evidence

## Implemented foundation

- STL-101: Convex package, auth config, provider boundary, and explicit development/preview/production tier contracts.
- STL-102: Clerk session mapping, ordered/sticky user lifecycle synchronization, exact-ID invitation acceptance/revocation, role hierarchy, redirect allowlisting, and retry-safe webhook handling; Convex remains the only resource-authorization authority.
- STL-103: deny-by-default Convex authorization, active tenant/project grants, disabled-user enforcement, and current-session MFA for privileged roles.
- STL-104: neutral root layout with separate marketing and protected route groups; protected routes fail closed without valid Clerk/Convex runtime configuration.
- STL-105: pure client/runtime/deployment schemas with server-only loaders. `CONVEX_DEPLOY_KEY` is isolated from protected runtime code.
- STL-106: CRM foundation tables and access-path indexes.
- STL-107: immutable audit facts, content-bound events and idempotency, stable-result replay, and lease-based webhook retry/recovery.
- STL-108/STL-109: offline-only Supabase, Payload, and Directus inventory manifests that refuse credentials and report unavailable live evidence explicitly.
- STL-110: deterministic offline handoff, fail-closed deployment-identity preflight, source-provenance-safe atomic CRM upserts, bounded opaque Convex target-inventory export, and checksum-aware reconciliation. No live import has been run.

## Vercel Marketplace integrations

- Clerk resource `skys-limit-clerk-preview` (`ir_57PGFkpe8UFzVctS`), Free, connected to project `website` for Preview and Development.
- Convex resource `skysthelimit` (`store_OKNjrL7AQNXqXMGR`), Free, connected by the user-completed Marketplace setup for Production and Preview as required by Convex automated deploys.
- The unconnected duplicate `skys-limit-convex-preview` was removed with explicit user approval.
- Secret values were never logged. No application deployment, production migration, traffic change, or provider disconnect occurred.

## Discovery and documentation evidence

- Post-merge checkpoint: `509d17258646`; observed `origin/main`: `45aae73febc7`. Neither reference is an approval record.
- Graphifyy incremental update: 6,326 nodes, 7,780 edges, 584 communities.
- Graphifyy query traversed the B20 Clerk/Convex auth, protected-route, event/idempotency, and reconciliation symbols before final verification.
- Read-only Graphify inventory: G20 is `pending`; it names `security-verification` as the primary skill and requires Graphify, Vercel, GitHub, and Vercel official-documentation evidence before readiness.
- Read-only Context7 inventories: `/websites/convex_dev` documents `CLERK_JWT_ISSUER_DOMAIN` in Convex auth configuration and separate development/production instances; `/websites/vercel` documents a project as the unit for repository, environment-variable, and deployment configuration; `/clerk/clerk-docs` documents the Preview publishable-key issuer contract; `/supabase/supabase` documents metadata/RLS inventory without row export.
- Local Vercel baseline records opaque team `team_bseTA2AuCO6A2fCOVY9ubrJo` and project `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`; the two-service binding is the `website` web project plus the `skysthelimit` Convex Marketplace integration. This is local recorded evidence only, not a live read.
- Environment names only: `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_JWT_ISSUER_ENV`, `NEXT_PUBLIC_APP_ENV`, and `NEXT_PUBLIC_CONVEX_URL`; no values were read or recorded.

## Verification

- Mandatory `npm run goal:verify -- --build` at `2026-07-27T14:38:02.276Z`: lint passed, 383/383 tests passed, and the Next.js production build passed.
- Mandatory checkpoint `npm run goal:verify` at `2026-07-27T19:01:43.695Z`: Context7 contract verification, lint, and 383/383 tests passed for commit `5bae0686712be13dfd1bc38e40f09e4eec0bd5fe`.
- Identity/lifecycle focused suite: 43/43 passed. Convex typecheck, anonymous local function push, root TypeScript, and an independent Next/Turbopack production build also passed.
- Independent security review found and verified repairs for stale-user resurrection, invitation-ID lifecycle binding, role escalation, redirect validation, post-provider authorization races, and unknown-invitation retry behavior.
- Skill `repeatable-workflow-capture`: system validation passed.
- `npm run skills:validate`: 66 routes passed.
- `npm run host:compile`: passed and mirrored 78 host-native skills.
- `git diff --check`: passed.
- STL-110 combined focused suite: 25/25 passed using injected CLI responses; coverage includes source-relabel attacks, replay, source-provenance conflict, deployment-environment mismatch before mutation, post-import target-payload mutation, pagination, target shape, and checksum reconciliation. Tests performed no live mutation or cloud target export.
- Convex backend typecheck (`npx tsc -p convex/tsconfig.json`) and migration/operator syntax checks passed. Local `convex run --help` confirmed the explicit `--deployment`, `--codegen`, and `--typecheck` flags without contacting a deployment.
- Anonymous local Convex push (`CONVEX_AGENT_MODE=anonymous npx convex dev --once`) passed at `127.0.0.1:3210`; this proves local deployability only and did not contact or mutate a cloud deployment.
- Skill `convex-migration-operator`: system validation, repository skill routing validation, and host-adapter compilation passed.

## Live source inventory and later-gate boundary

- The connected production Supabase project `ouykfhoxlrkjgscdjjqg` is active and healthy. A connector-mediated read-only inventory returned 11 `public` tables and 77 aggregate rows; all 11 report RLS enabled. No row payloads or personal identifiers were read or retained.
- The same inventory confirmed two storage buckets and no stored objects. Auth metadata was inspected only for aggregate table counts and RLS state; no account records were exported.
- Payload is configured to use `SUPABASE_DB_URL`. The live Supabase inventory contains no Payload collection tables, so no deployed Payload dataset exists in that source.
- The production Vercel environment-name inventory contains no `DIRECTUS_URL` or `NEXT_PUBLIC_DIRECTUS_URL`; the application Directus adapter therefore has no configured live source to inventory.
- The reconciliation framework is verified by the 25/25 focused suite. Applying a handoff or reconciling migrated production data remains a later migration gate and was not inferred or executed for G20.
- A read-only Convex target export was attempted only against `hidden-roadrunner-577`. Convex owner CLI authentication is unavailable and the Vercel-managed deploy key is not exportable, so the operator failed closed before reading data. Both restricted scratch attempts were deleted and produced no output file.

## Preview deployment checkpoint

- Authenticated Vercel evidence confirms the exact non-production Convex deployment `hidden-roadrunner-577`, ref `preview/agent/skys-limit-convex-os`, cloud URL `https://hidden-roadrunner-577.convex.cloud`.
- The Vercel/Convex integration selected the exact non-production Convex deployment `hidden-roadrunner-577`, environment `Preview`, and injected the public Convex URLs for the application build.
- Convex Preview configuration now contains `NEXT_PUBLIC_APP_ENV`, `CLERK_JWT_ISSUER_ENV`, and `CLERK_JWT_ISSUER_DOMAIN`; Vercel Preview contains `CONVEX_DEPLOY_KEY` and `NEXT_PUBLIC_CONVEX_URL`. Only names and scopes were recorded.
- Credential scratch `E:\SkysLimitScratch\g20-convex-20260727T113802545` was created at `2026-07-27T18:38:02.5935594Z` and deleted at `2026-07-27T18:38:12.0003796Z`. Deletion was verified; no secret value or secret hash was retained; the attempted Convex environment update did not succeed.
- Clerk issuer scratch `E:\SkysLimitScratch\g20-clerk-20260727T120804619` was created at `2026-07-27T19:08:04.7170737Z` and deleted at `2026-07-27T19:08:08.9822485Z`. Deletion was verified; only the non-secret issuer origin was used, and the sanitized result file was deleted after configuration.
- Deployment `dpl_3mja4yMG9erE8TwcKCXfzrxokHYd` for commit `5bae0686712be13dfd1bc38e40f09e4eec0bd5fe` compiled Next.js and TypeScript, validated the environment, and deployed Convex functions successfully to `hidden-roadrunner-577`.
- Vercel then reported `ENOENT` while packaging the declared multi-service output in the production-linked `website` project. This does not roll back the successful Convex Preview deployment. The Services topology remains reserved for the separately governed Preview sandbox and is not enabled or promoted in the production-linked project.

The G20 evidence packet passed independent technical and final code review. The authenticated repository owner explicitly approved the completed snapshot at `e330aa5bca9fc44dc417e247e43efc14bd2979ed` on `2026-07-27T22:39:52.8534238Z`; the authoritative approval record is `.agents/goals/ship-sky-s-the-limit-convex-production-operating/g20-evidence.md`.
