# Canonical Repository Map

**Repository:** `skysthelimitpainting1779-collab/skys-the-limit-painting-llc-website`  
**Baseline:** `c7e94605eefdace7a76ce5145808478df8503dbb`

| Module | State | Required action | Primary batch |
|---|---|---|---|
| `control-plane` | existing_but_inconsistent | repair | `B00` |
| `lead-intake` | existing_but_broken | repair_then_migrate | `B10` |
| `estimate-funnel` | existing_but_broken | repair_then_extend | `B10` |
| `manychat-intake` | existing_but_broken | replace_path | `B10` |
| `legacy-manage-admin` | critical_security_boundary | stabilize_then_replace | `B10` |
| `portal-auth-and-ownership` | legacy_dependency | migrate | `B20` |
| `private-files` | critical_privacy_failure | repair_then_migrate | `B10` |
| `route-registry` | existing_but_inconsistent | repair_then_consolidate | `B10` |
| `review-system` | policy_noncompliant | replace_behavior | `B10` |
| `referral-system` | privacy_failure | replace_behavior | `B10` |
| `content-authority` | split_brain | inventory_migrate_remove | `B30` |
| `legacy-payload` | legacy_dependency_with_security_risk | stabilize_export_decommission | `B10` |
| `legacy-supabase` | legacy_operational_dependency | inventory_migrate_decommission | `B20` |
| `convex-foundation` | missing | build | `B20` |
| `clerk-identity` | missing | build_and_migrate | `B20` |
| `public-design-system` | existing_needs_consolidation | refactor_and_extend | `B30` |
| `crm-and-revenue` | partially_implemented | build_on_existing_flows | `B31` |
| `portal-and-operations` | partial_legacy | replace_and_extend | `B50` |
| `analytics-seo-gbp` | partial | repair_and_build | `B30` |
| `cutover-and-decommission` | not_started | build_and_gate | `B60` |

## Module details

### `control-plane`

**Current:** Goal, Graphify, Graph Engineer, Entire checkpoints, specialists, and hooks exist but their scripts and architecture instructions disagree.

**Target:** One canonical decision source, executable /goal and Graphify commands, worktree-safe Graphify binding, regenerated specialists, economy defaults, and validated execution ledger.

**Nodes:** INSPECT-REPOSITORY, G00-AUDIT-LOCKED, ADR-AUTH-PROVIDER

**Initial files:**
- `AGENTS.md`
- `package.json`
- `scripts/goal.mjs`
- `scripts/graph-context.mjs`
- `scripts/ship-eval.mjs`
- `.agents/STACK.md`
- `.agents/specialists.json`
- `.agents/mcp_config.json`
- `.codex/config.toml`

### `lead-intake`

**Current:** Lead API validates data, attempts Supabase persistence, then executes Resend, HubSpot, auto-reply, and custom webhook effects inline; persistence failure is swallowed.

**Target:** One idempotent Convex command creates the canonical lead and event/outbox before any external effect, with durable replay and operator reconciliation.

**Nodes:** STL-001, STL-010, STL-107, STL-203

**Initial files:**
- `src/app/api/leads/route.ts`
- `src/lib/api/utils.ts`
- `src/components/LeadForm.tsx`
- `tests/leads-api-handler.test.mjs`
- `tests/api-units.test.mjs`

### `estimate-funnel`

**Current:** Interactive pricing works, but the final submit payload violates the server lead contract.

**Target:** One shared typed contract, adaptive estimate flow, versioned assumptions, and durable booking handoff.

**Nodes:** STL-002, STL-201, STL-205

**Initial files:**
- `src/views/Estimate.tsx`
- `src/lib/api/utils.ts`
- `src/app/api/leads/route.ts`

### `manychat-intake`

**Current:** ManyChat normalizes data but invokes external delivery before durable canonical persistence.

**Target:** ManyChat calls the same canonical createLead boundary as the website and uses verified provider authentication.

**Nodes:** STL-001, STL-008, STL-010, STL-107

**Initial files:**
- `src/app/api/manychat/route.ts`
- `src/lib/api/utils.ts`

### `legacy-manage-admin`

**Current:** A client-only /manage page permits Supabase sign-up and browser CRUD; its layout only sets noindex.

**Target:** Immediately disable sign-up and server-gate the legacy surface, then replace it with Clerk invitation-only staff access and Convex authorization.

**Nodes:** STL-003, STL-102, STL-103, STL-104, STL-204

**Initial files:**
- `src/app/manage/page.tsx`
- `src/app/manage/layout.tsx`
- `src/proxy.ts`
- `src/lib/supabase/client.ts`

### `portal-auth-and-ownership`

**Current:** Supabase session protection exists, but resources are associated with users by email-string matching.

**Target:** Clerk identity maps to explicit Convex contact/company/property/project grants and deny-by-default DTOs.

**Nodes:** STL-102, STL-103, STL-104, STL-401, STL-402, STL-403

**Initial files:**
- `src/proxy.ts`
- `src/lib/auth/portal-data.ts`
- `src/app/portal/page.tsx`
- `tests/portal-auth.test.mjs`

### `private-files`

**Current:** The upload route returns a permanent public lead-photo URL and relies heavily on client validation.

**Target:** Private objects, server validation, randomized IDs, privacy classes, scan state, retention, and authorized retrieval.

**Nodes:** STL-004, STL-403

**Initial files:**
- `src/app/api/storage/upload-url/route.ts`
- `src/components/LeadForm.tsx`
- `next.config.ts`

### `route-registry`

**Current:** Dynamic routes depend on static arrays while navigation, footer, redirects, metadata, sitemap, and robots can advertise different slugs.

**Target:** One published route registry drives existence, navigation, metadata, sitemap, robots, and redirects.

**Nodes:** STL-005, STL-006, STL-007, STL-009, STL-302, STL-305

**Initial files:**
- `src/app/painting-services/[slug]/page.tsx`
- `src/app/service-areas/[slug]/page.tsx`
- `src/data/landingPages.ts`
- `vercel.json`
- `src/app/sitemap.ts`
- `public/sitemap.xml`

### `review-system`

**Current:** Only ratings four and five receive the Google review path; tests require that gating.

**Target:** Every customer receives the same optional public review path, with a separate issue-resolution path and verified review provenance.

**Nodes:** STL-308, STL-405

**Initial files:**
- `src/views/Review.tsx`
- `tests/e2e.test.mjs`

### `referral-system`

**Current:** Referrer email appears in URLs, localStorage, and analytics.

**Target:** Opaque, signed, revocable referral codes linked server-side with clean analytics.

**Nodes:** STL-405, STL-501

**Initial files:**
- `src/views/Refer.tsx`
- `src/components/ConversionHeader.tsx`
- `src/components/LeadForm.tsx`
- `tests/e2e.test.mjs`

### `content-authority`

**Current:** Projects resolve Directus, then Supabase, then static content while Payload independently models similar content.

**Target:** Convex versioned CMS and one publication authority with export, dedupe, provenance, draft preview, and rollback evidence.

**Nodes:** STL-109, STL-110, STL-303, STL-304, STL-505

**Initial files:**
- `src/views/Projects.tsx`
- `src/lib/directus/client.ts`
- `src/payload.config.ts`
- `src/collections/payload/**`
- `src/data/**`

### `legacy-payload`

**Current:** Payload is mounted in Next, uses Supabase Postgres and S3, and has a known placeholder-secret fallback.

**Target:** Fail safely now, export content/media/admin inventory, preserve a read-only rollback adapter, and remove only after cutover.

**Nodes:** STL-003, STL-109, STL-304, STL-505

**Initial files:**
- `next.config.ts`
- `src/payload.config.ts`
- `src/collections/payload/**`
- `src/globals/payload/**`
- `src/app/(payload)/**`

### `legacy-supabase`

**Current:** Supabase stores leads, content, files, and portal/manage identity and contains historical policies.

**Target:** Inventory/export, shadow read, controlled dual-write, Convex reconciliation, bounded rollback retention, then removal.

**Nodes:** STL-108, STL-110, STL-504, STL-505, STL-506

**Initial files:**
- `src/lib/supabase/**`
- `supabase/migrations/**`
- `src/proxy.ts`
- `src/app/manage/page.tsx`
- `src/lib/auth/portal-data.ts`

### `convex-foundation`

**Current:** No Convex dependency or application code is present.

**Target:** Typed schema/indexes, auth config, deny-by-default authz, audit, events, idempotency, HTTP boundaries, scheduling, and migrations.

**Nodes:** STL-101, STL-103, STL-105, STL-106, STL-107, STL-110

**Initial files:**
- `convex/**`
- `src/components/providers/**`
- `package.json`

### `clerk-identity`

**Current:** Clerk is absent and identity is split between Supabase and Payload.

**Target:** Clerk provider, verified Convex issuer, invitation-only staff, MFA policy, verified lifecycle webhooks, and disabled-user enforcement.

**Nodes:** ADR-AUTH-PROVIDER, STL-102, STL-103

**Initial files:**
- `package.json`
- `src/proxy.ts`
- `src/app/layout.tsx`
- `src/app/api/webhooks/clerk/route.ts`
- `convex/auth.config.ts`

### `public-design-system`

**Current:** Strong visual assets and shadcn primitives exist, but competing tokens, global radius-zero instructions, and client-heavy composition conflict with the approved target.

**Target:** Measured Craft tokens, source-owned shadcn primitives, Server Component public templates, accessible client islands, and visual regression coverage.

**Nodes:** STL-301, STL-302

**Initial files:**
- `DESIGN.md`
- `src/app/globals.css`
- `src/components/ui/**`
- `src/views/LandingPage.tsx`
- `src/app/**`

### `crm-and-revenue`

**Current:** Lead list and status exist, but canonical contacts/properties/opportunities, versioned estimates/proposals/agreements/deposits, and durable SLA workflows do not.

**Target:** Complete visitor-to-deposit workflow using Convex, Clerk, Vercel Workflow, Cal.com, and Stripe test mode.

**Nodes:** STL-201, STL-202, STL-203, STL-204, STL-205, STL-206, STL-207, STL-208, STL-209

**Initial files:**
- `src/app/manage/page.tsx`
- `src/app/api/leads/route.ts`
- `src/views/Estimate.tsx`
- `convex/**`
- `src/workflows/**`

### `portal-and-operations`

**Current:** Portal shows email-scoped leads; project delivery, private files, updates, change orders, payments, assignments, and operator workflow controls are incomplete.

**Target:** Resource-granted customer portal and operator cockpit with project timeline, private files, approvals, automations, and health status.

**Nodes:** STL-401, STL-402, STL-403, STL-404, STL-405, STL-406, STL-407, STL-408

**Initial files:**
- `src/app/portal/**`
- `src/lib/auth/portal*.ts`
- `src/app/manage/page.tsx`
- `convex/**`
- `src/app/(app)/**`

### `analytics-seo-gbp`

**Current:** Browser events, static SEO assets, and a cron exist, but revenue attribution, experiment governance, proof gates, and operator GBP workspace are missing.

**Target:** First-party event ledger, revenue dashboards, experiments, one route/SEO registry, local proof gates, and owner-approved GBP operations.

**Nodes:** STL-305, STL-306, STL-307, STL-309, STL-501, STL-502, STL-503

**Initial files:**
- `src/lib/analytics.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `public/sitemap.xml`
- `vercel.json`
- `src/app/api/cron/**`

### `cutover-and-decommission`

**Current:** No Convex shadow-read, dual-write, reconciliation, rollback, or restore path exists.

**Target:** Count/checksum reconciliation, canary, rollback export, restore drill, monitored window, and separately approved provider removal.

**Nodes:** G70-CUTOVER-READY, G80-CUTOVER-COMPLETE, G85-ROLLBACK-WINDOW-CLEARED, G90-DECOMMISSIONED, STL-504, STL-505, STL-506

**Initial files:**
- `scripts/migrations/**`
- `convex/migrations/**`
- `.graph/**`
- `docs/runbooks/**`
