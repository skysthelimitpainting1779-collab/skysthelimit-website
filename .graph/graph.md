# Sky’s the Limit Convex Operating System Execution Graph

**Objective:** Maximize qualified visitor-to-signed-agreement-and-paid-deposit conversion while safely replacing fragmented Supabase, Payload, and Directus responsibilities with a Convex-centered operating system.
**Source request:** Turn this into a very efficient Loop and execution graph. Use this uploaded graph-engineer-codex-windows-v2 package as the canonical graph-engineering skill.
**Classification:** high-risk
**Recommended scenario:** expected
**Primary control pattern:** hybrid

## Assumptions

- The audited repository and Vercel project remain the canonical implementation target.
- Graphifyy is available or can be installed and refreshed incrementally.
- Provider and owner-account access will be supplied at gated nodes.
- ChatGPT Pro included agentic usage is consumed before purchased credits.

## Constraints

- No destructive migration before snapshots, reconciliation, rollback evidence, and explicit approval.
- No production payment, communication, GBP publication, cutover, or decommissioning without node-specific authorization.
- Maximum concurrent agents is 8; economy mode defaults to one writer and at most one read-only worker.
- Implementation agents receive bounded Graphifyy packets, not the full audit/wiki/graph report.
- Authentication provider decision must be canonicalized before implementation and may not remain contradictory.

## Control Pattern

The program combines strict dependency gates, conflict-free workstreams, production/data/payment side effects, independent verification, bounded remediation loops, and reversible migration requirements.

- **Synchronization:** A node starts only after every dependsOn node succeeds, resource locks are free, risk authorization is recorded, and a Graphifyy-bounded node packet is generated from the current code graph.
- **Termination:** All required terminal gates through G90-DECOMMISSIONED succeed with evidence, no blocking risk remains, actual cost is recorded, and independent completion verification is produced.
- **Recovery:** replan from checkpoint; use retry-with-backoff for transient idempotent nodes and compensation chains for completed external side effects

## Acceptance Criteria

- **ac-g00-audit-locked:** Audit and architecture baseline locked
  - Evidence required: master audit exists, canonical commit recorded, no destructive migration started
- **ac-g10-stabilized:** Revenue and security stabilization passed
  - Evidence required: durable lead success guarantee, valid estimate submission, protected manage surface, private uploads, critical route smoke
- **ac-g20-foundation-ready:** Identity, authorization, Convex, and migration foundation passed
  - Evidence required: environment isolation, authz matrix, domain event uniqueness, live source inventory, reconciliation framework
- **ac-g30-public-cms-ready:** Design, public site, CMS, SEO, and local growth passed
  - Evidence required: WCAG baseline, published content rollback, SEO crawl pass, GBP integrity checklist, no thin city pages
- **ac-g31-visitor-to-booking:** Visitor to durable lead to booked estimate passed
  - Evidence required: mobile save/resume, durable lead, verified appointment webhook, SLA escalation
- **ac-g40-proposal-to-deposit:** Estimate to proposal to agreement to posted deposit passed
  - Evidence required: immutable versions, signature evidence, provider-confirmed payment, idempotent reminders
- **ac-g50-portal-ops-ready:** Customer portal, project operations, and automation cockpit passed
  - Evidence required: customer isolation, private files, change-order evidence, field least privilege, replay-safe workflow UI
- **ac-g60-measurement-ready:** Revenue attribution, dashboards, and experiments reconcile
  - Evidence required: visit-to-revenue trace, dashboard totals reconcile, experiment guardrails
- **ac-g70-cutover-ready:** All product, data, security, SEO, and restore gates ready for cutover
  - Evidence required: final snapshot plan, write-freeze plan, provider switch plan, rollback drill passed
- **ac-g80-cutover-complete:** Production cutover completed and reconciled
  - Evidence required: critical-path production checks, data reconciliation in threshold, no auth/payment/SEO regression
- **ac-g85-rollback-window-cleared:** Monitored rollback window cleared
  - Evidence required: soak metrics stable, legacy fallback tested, no unresolved reconciliation exceptions
- **ac-g90-decommissioned:** Legacy services decommissioned with restore evidence retained
  - Evidence required: zero runtime dependency, archives verified, service cancellation approved, runbooks current

## Execution Graph

| Node | Type | Depends on | Risk | Mode | Duration | Timeout | Attempts |
|---|---|---|---|---|---:|---:|---:|
| `INSPECT-REPOSITORY` — Inspect repository and environment | tool | — | low | automatic | 30m | 60m | 2 |
| `G00-AUDIT-LOCKED` — Audit and architecture baseline locked | human | INSPECT-REPOSITORY | medium | approval | 30m | 1440m | 1 |
| `G10-STABILIZED` — Revenue and security stabilization passed | human | STL-001, STL-002, STL-003, STL-004, STL-005, STL-006, STL-007, STL-008, STL-009, STL-010 | medium | approval | 30m | 1440m | 1 |
| `ADR-AUTH-PROVIDER` — Approve canonical identity provider ADR | human | G10-STABILIZED | medium | approval | 60m | 1440m | 1 |
| `G20-FOUNDATION-READY` — Identity, authorization, Convex, and migration foundation passed | human | STL-101, STL-102, STL-103, STL-104, STL-105, STL-106, STL-107, STL-108, STL-109, STL-110 | medium | approval | 30m | 1440m | 1 |
| `G30-PUBLIC-CMS-READY` — Design, public site, CMS, SEO, and local growth passed | human | STL-301, STL-302, STL-303, STL-304, STL-305, STL-306, STL-307, STL-308, STL-309 | medium | approval | 30m | 1440m | 1 |
| `G31-VISITOR-TO-BOOKING` — Visitor to durable lead to booked estimate passed | human | STL-201, STL-202, STL-203 | medium | approval | 30m | 1440m | 1 |
| `G40-PROPOSAL-TO-DEPOSIT` — Estimate to proposal to agreement to posted deposit passed | human | STL-204, STL-205, STL-206, STL-207, STL-208, STL-209 | medium | approval | 30m | 1440m | 1 |
| `G50-PORTAL-OPS-READY` — Customer portal, project operations, and automation cockpit passed | human | STL-401, STL-402, STL-403, STL-404, STL-405, STL-406, STL-407, STL-408 | medium | approval | 30m | 1440m | 1 |
| `G60-MEASUREMENT-READY` — Revenue attribution, dashboards, and experiments reconcile | human | STL-501, STL-502, STL-503 | medium | approval | 30m | 1440m | 1 |
| `G70-CUTOVER-READY` — All product, data, security, SEO, and restore gates ready for cutover | human | G20-FOUNDATION-READY, G30-PUBLIC-CMS-READY, G31-VISITOR-TO-BOOKING, G40-PROPOSAL-TO-DEPOSIT, G50-PORTAL-OPS-READY, G60-MEASUREMENT-READY, STL-506 | high | blocked | 30m | 1440m | 1 |
| `G80-CUTOVER-COMPLETE` — Production cutover completed and reconciled | human | STL-504 | high | blocked | 30m | 1440m | 1 |
| `G85-ROLLBACK-WINDOW-CLEARED` — Monitored rollback window cleared | human | G80-CUTOVER-COMPLETE | high | blocked | 30m | 1440m | 1 |
| `G90-DECOMMISSIONED` — Legacy services decommissioned with restore evidence retained | human | STL-505 | high | blocked | 30m | 1440m | 1 |
| `STL-001` — Make lead creation durable/fail-closed | agent | G00-AUDIT-LOCKED | high | blocked | 120m | 216m | 1 |
| `STL-002` — Fix estimate payload and corrupted copy | agent | G00-AUDIT-LOCKED | medium | approval | 45m | 81m | 2 |
| `STL-003` — Disable public manage sign-up and enforce staff authorization | agent | G00-AUDIT-LOCKED | high | blocked | 120m | 216m | 1 |
| `STL-004` — Make lead/project uploads private | agent | G00-AUDIT-LOCKED | high | blocked | 120m | 216m | 1 |
| `STL-005` — Repair cabinet/commercial service pages or redirects | agent | G00-AUDIT-LOCKED | medium | approval | 45m | 81m | 2 |
| `STL-006` — Correct 404 canonical/robots metadata | agent | G00-AUDIT-LOCKED | medium | approval | 45m | 81m | 2 |
| `STL-007` — Resolve SSR search-param bailout | agent | G00-AUDIT-LOCKED | medium | approval | 45m | 81m | 2 |
| `STL-008` — Replace optional webhook authentication | agent | G00-AUDIT-LOCKED | high | blocked | 45m | 81m | 1 |
| `STL-009` — Expand smoke/E2E critical journeys | agent | G00-AUDIT-LOCKED | medium | approval | 300m | 540m | 2 |
| `STL-010` — Add lead-delivery reconciliation queue | agent | STL-001 | medium | approval | 120m | 216m | 2 |
| `STL-101` — Add Convex environments/provider | agent | G10-STABILIZED | medium | approval | 300m | 540m | 2 |
| `STL-102` — Integrate approved identity provider | agent | STL-101, STL-105, ADR-AUTH-PROVIDER | high | blocked | 300m | 540m | 1 |
| `STL-103` — Implement Convex authz/audit | validator | STL-102 | high | blocked | 300m | 540m | 1 |
| `STL-104` — Split marketing/portal/ops route groups | agent | STL-102, STL-105 | medium | approval | 120m | 216m | 2 |
| `STL-105` — Strict server/client env schema | agent | G10-STABILIZED | medium | approval | 45m | 81m | 2 |
| `STL-106` — CRM foundational schema | agent | STL-101, STL-103, STL-107 | medium | approval | 300m | 540m | 2 |
| `STL-107` — Domain events/idempotency/webhook receipts | agent | STL-101, STL-105 | high | blocked | 300m | 540m | 1 |
| `STL-108` — Supabase live inventory/export | agent | G10-STABILIZED | medium | approval | 120m | 216m | 2 |
| `STL-109` — Payload/Directus inventory/export | agent | G10-STABILIZED | medium | approval | 120m | 216m | 2 |
| `STL-110` — Migration mapping/reconciliation framework | agent | STL-106, STL-107, STL-108, STL-109 | medium | approval | 300m | 540m | 2 |
| `STL-201` — Dynamic estimate funnel | agent | STL-004, STL-103, STL-106, STL-107, STL-301 | medium | approval | 600m | 1080m | 2 |
| `STL-202` — Cal synchronization | agent | STL-107, STL-201 | medium | approval | 120m | 216m | 2 |
| `STL-203` — Lead assignment/SLA workflows | agent | STL-107, STL-201, STL-202 | medium | approval | 120m | 216m | 2 |
| `STL-204` — CRM pipeline/operator drawer | agent | STL-103, STL-106, STL-301 | medium | approval | 300m | 540m | 2 |
| `STL-205` — Estimate builder/versioning | agent | STL-106, STL-204, STL-301 | medium | approval | 300m | 540m | 2 |
| `STL-206` — Proposal builder/viewer | agent | STL-103, STL-107, STL-205, STL-301 | medium | approval | 600m | 1080m | 2 |
| `STL-207` — Agreement signing evidence | agent | STL-103, STL-206 | high | blocked | 300m | 540m | 1 |
| `STL-208` — Stripe deposit/invoice | agent | STL-103, STL-107, STL-207 | high | blocked | 300m | 540m | 1 |
| `STL-209` — Proposal/deposit workflows | agent | STL-107, STL-206, STL-207, STL-208 | high | blocked | 600m | 1080m | 1 |
| `STL-301` — Design tokens/shadcn baseline | agent | STL-104, STL-105 | medium | approval | 300m | 540m | 2 |
| `STL-302` — Public templates/home/service/location | agent | STL-005, STL-006, STL-007, STL-301 | medium | approval | 600m | 1080m | 2 |
| `STL-303` — Convex CMS/versioning/preview | agent | STL-103, STL-106, STL-107, STL-301 | medium | approval | 600m | 1080m | 2 |
| `STL-304` — Content/media migration | agent | STL-110, STL-303 | high | blocked | 600m | 1080m | 1 |
| `STL-305` — Technical SEO fixes | agent | STL-009, STL-302, STL-304 | medium | approval | 300m | 540m | 2 |
| `STL-306` — GBP integrity audit with owner access | validator | G10-STABILIZED | medium | approval | 120m | 216m | 2 |
| `STL-307` — GBP workspace | agent | STL-301, STL-303, STL-306 | medium | approval | 300m | 540m | 2 |
| `STL-308` — Review policy/system | agent | STL-103, STL-307 | medium | approval | 120m | 216m | 2 |
| `STL-309` — Local content proof gates | agent | STL-302, STL-304, STL-305, STL-306 | medium | approval | 120m | 216m | 2 |
| `STL-401` — Customer portal shell/next action | agent | STL-102, STL-103, STL-204, STL-301 | medium | approval | 300m | 540m | 2 |
| `STL-402` — Property/appointment/proposal/payment views | agent | STL-202, STL-206, STL-208, STL-401 | high | blocked | 600m | 1080m | 1 |
| `STL-403` — Projects/files/updates | agent | STL-004, STL-103, STL-106, STL-401 | high | blocked | 600m | 1080m | 1 |
| `STL-404` — Change orders | agent | STL-206, STL-207, STL-403 | high | blocked | 300m | 540m | 1 |
| `STL-405` — Project closeout/review/referral | agent | STL-209, STL-308, STL-403, STL-404, STL-406 | medium | approval | 300m | 540m | 2 |
| `STL-406` — Crew/project assignments | agent | STL-103, STL-403 | medium | approval | 120m | 216m | 2 |
| `STL-407` — Automation Center UI | agent | STL-107, STL-209, STL-301 | medium | approval | 600m | 1080m | 2 |
| `STL-408` — System health/integration dashboard | agent | STL-107, STL-407 | medium | approval | 300m | 540m | 2 |
| `STL-501` — First-party attribution ledger | agent | STL-107, STL-201, STL-202, STL-204, STL-208 | medium | approval | 300m | 540m | 2 |
| `STL-502` — Revenue dashboards | agent | STL-204, STL-208, STL-405, STL-501 | medium | approval | 300m | 540m | 2 |
| `STL-503` — Experiment framework | agent | STL-302, STL-305, STL-501 | medium | approval | 120m | 216m | 2 |
| `STL-504` — Final dual-read/write cutover | subgraph | G70-CUTOVER-READY | high | blocked | 600m | 1080m | 1 |
| `STL-505` — Supabase/Payload/Directus removal | agent | G85-ROLLBACK-WINDOW-CLEARED, STL-506 | high | blocked | 600m | 1080m | 1 |
| `STL-506` — Restore/decommission runbooks | subgraph | STL-110, G30-PUBLIC-CMS-READY, G31-VISITOR-TO-BOOKING, G40-PROPOSAL-TO-DEPOSIT, G50-PORTAL-OPS-READY, G60-MEASUREMENT-READY | high | blocked | 300m | 540m | 1 |

## Node Contracts

### `INSPECT-REPOSITORY` — Inspect repository and environment

**Objective:** Confirm the repository, production deployment, source systems, current commit, available tooling, and graph inputs before execution.
**Type:** tool | **Risk:** low | **Mode:** automatic
**Outputs:** repository-inspection, deployment-inspection, source-inventory
**Tools:** github, vercel, graphifyy/query_graph
**Permissions:** repository:read, deployment:read
**Verification:** The audited repository and environment are identified.
**Evidence required:** audit file, repository commit, deployment evidence
**Independent:** true

### `G00-AUDIT-LOCKED` — Audit and architecture baseline locked

**Objective:** Approve gate only when all required evidence is independently verified. On failure: return to discovery and update the audit.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:INSPECT-REPOSITORY
**Outputs:** G00-AUDIT-LOCKED-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G00-AUDIT-LOCKED is verified and the named approver records approval.
**Evidence required:** master audit exists, canonical commit recorded, no destructive migration started
**Independent:** false

### `G10-STABILIZED` — Revenue and security stabilization passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: block foundation work that assumes current-path integrity.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-001, node-evidence:STL-002, node-evidence:STL-003, node-evidence:STL-004, node-evidence:STL-005, node-evidence:STL-006, node-evidence:STL-007, node-evidence:STL-008, node-evidence:STL-009, node-evidence:STL-010
**Outputs:** G10-STABILIZED-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G10-STABILIZED is verified and the named approver records approval.
**Evidence required:** durable lead success guarantee, valid estimate submission, protected manage surface, private uploads, critical route smoke
**Independent:** false

### `ADR-AUTH-PROVIDER` — Approve canonical identity provider ADR

**Objective:** Resolve the Clerk versus WorkOS contradiction using current official integrations, required customer/staff capabilities, operating cost, migration risk, and rollback; record one canonical provider before implementation.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** master audit authentication ADR, execution graph WorkOS assumption, current official provider documentation, business role and portal requirements
**Outputs:** signed-auth-provider-adr
**Tools:** official-docs, artifact-review
**Permissions:** architecture:approve
**Verification:** One identity provider is approved and becomes the sole canonical decision.
**Evidence required:** signed ADR, official source references, migration/rollback section
**Independent:** false

### `G20-FOUNDATION-READY` — Identity, authorization, Convex, and migration foundation passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: do not expand protected product surfaces.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-101, node-evidence:STL-102, node-evidence:STL-103, node-evidence:STL-104, node-evidence:STL-105, node-evidence:STL-106, node-evidence:STL-107, node-evidence:STL-108, node-evidence:STL-109, node-evidence:STL-110
**Outputs:** G20-FOUNDATION-READY-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G20-FOUNDATION-READY is verified and the named approver records approval.
**Evidence required:** environment isolation, authz matrix, domain event uniqueness, live source inventory, reconciliation framework
**Independent:** false

### `G30-PUBLIC-CMS-READY` — Design, public site, CMS, SEO, and local growth passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: keep legacy/public adapter active.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-301, node-evidence:STL-302, node-evidence:STL-303, node-evidence:STL-304, node-evidence:STL-305, node-evidence:STL-306, node-evidence:STL-307, node-evidence:STL-308, node-evidence:STL-309
**Outputs:** G30-PUBLIC-CMS-READY-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G30-PUBLIC-CMS-READY is verified and the named approver records approval.
**Evidence required:** WCAG baseline, published content rollback, SEO crawl pass, GBP integrity checklist, no thin city pages
**Independent:** false

### `G31-VISITOR-TO-BOOKING` — Visitor to durable lead to booked estimate passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: route conversion traffic to last known good funnel.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-201, node-evidence:STL-202, node-evidence:STL-203
**Outputs:** G31-VISITOR-TO-BOOKING-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G31-VISITOR-TO-BOOKING is verified and the named approver records approval.
**Evidence required:** mobile save/resume, durable lead, verified appointment webhook, SLA escalation
**Independent:** false

### `G40-PROPOSAL-TO-DEPOSIT` — Estimate to proposal to agreement to posted deposit passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: disable payment/proposal promotion and retain manual fallback.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-204, node-evidence:STL-205, node-evidence:STL-206, node-evidence:STL-207, node-evidence:STL-208, node-evidence:STL-209
**Outputs:** G40-PROPOSAL-TO-DEPOSIT-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G40-PROPOSAL-TO-DEPOSIT is verified and the named approver records approval.
**Evidence required:** immutable versions, signature evidence, provider-confirmed payment, idempotent reminders
**Independent:** false

### `G50-PORTAL-OPS-READY` — Customer portal, project operations, and automation cockpit passed

**Objective:** Approve gate only when all required evidence is independently verified. On failure: keep affected portal/ops module behind feature flag.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-401, node-evidence:STL-402, node-evidence:STL-403, node-evidence:STL-404, node-evidence:STL-405, node-evidence:STL-406, node-evidence:STL-407, node-evidence:STL-408
**Outputs:** G50-PORTAL-OPS-READY-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G50-PORTAL-OPS-READY is verified and the named approver records approval.
**Evidence required:** customer isolation, private files, change-order evidence, field least privilege, replay-safe workflow UI
**Independent:** false

### `G60-MEASUREMENT-READY` — Revenue attribution, dashboards, and experiments reconcile

**Objective:** Approve gate only when all required evidence is independently verified. On failure: no cutover decision may rely on untrusted dashboards.
**Type:** human | **Risk:** medium | **Mode:** approval
**Inputs:** node-evidence:STL-501, node-evidence:STL-502, node-evidence:STL-503
**Outputs:** G60-MEASUREMENT-READY-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record
**Verification:** All evidence for G60-MEASUREMENT-READY is verified and the named approver records approval.
**Evidence required:** visit-to-revenue trace, dashboard totals reconcile, experiment guardrails
**Independent:** false

### `G70-CUTOVER-READY` — All product, data, security, SEO, and restore gates ready for cutover

**Objective:** Approve gate only when all required evidence is independently verified. On failure: remain in shadow/dual-read mode.
**Type:** human | **Risk:** high | **Mode:** blocked
**Inputs:** node-evidence:G20-FOUNDATION-READY, node-evidence:G30-PUBLIC-CMS-READY, node-evidence:G31-VISITOR-TO-BOOKING, node-evidence:G40-PROPOSAL-TO-DEPOSIT, node-evidence:G50-PORTAL-OPS-READY, node-evidence:G60-MEASUREMENT-READY, node-evidence:STL-506
**Outputs:** G70-CUTOVER-READY-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record, production:approval
**Verification:** All evidence for G70-CUTOVER-READY is verified and the named approver records approval.
**Evidence required:** final snapshot plan, write-freeze plan, provider switch plan, rollback drill passed
**Independent:** false

### `G80-CUTOVER-COMPLETE` — Production cutover completed and reconciled

**Objective:** Approve gate only when all required evidence is independently verified. On failure: execute rollback procedure immediately.
**Type:** human | **Risk:** high | **Mode:** blocked
**Inputs:** node-evidence:STL-504
**Outputs:** G80-CUTOVER-COMPLETE-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record, production:approval
**Verification:** All evidence for G80-CUTOVER-COMPLETE is verified and the named approver records approval.
**Evidence required:** critical-path production checks, data reconciliation in threshold, no auth/payment/SEO regression
**Independent:** false

### `G85-ROLLBACK-WINDOW-CLEARED` — Monitored rollback window cleared

**Objective:** Approve gate only when all required evidence is independently verified. On failure: extend rollback window and block decommission.
**Type:** human | **Risk:** high | **Mode:** blocked
**Inputs:** node-evidence:G80-CUTOVER-COMPLETE
**Outputs:** G85-ROLLBACK-WINDOW-CLEARED-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record, production:approval
**Verification:** All evidence for G85-ROLLBACK-WINDOW-CLEARED is verified and the named approver records approval.
**Evidence required:** soak metrics stable, legacy fallback tested, no unresolved reconciliation exceptions
**Independent:** false

### `G90-DECOMMISSIONED` — Legacy services decommissioned with restore evidence retained

**Objective:** Approve gate only when all required evidence is independently verified. On failure: restore required legacy service or dependency.
**Type:** human | **Risk:** high | **Mode:** blocked
**Inputs:** node-evidence:STL-505
**Outputs:** G90-DECOMMISSIONED-approval-record
**Tools:** execution-ledger, artifact-review
**Permissions:** approval:record, production:approval
**Verification:** All evidence for G90-DECOMMISSIONED is verified and the named approver records approval.
**Evidence required:** zero runtime dependency, archives verified, service cancellation approved, runbooks current
**Independent:** false

### `STL-001` — Make lead creation durable/fail-closed

**Objective:** Make lead creation durable/fail-closed. Acceptance: failed persistence never returns success; lead retained on notification failure.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G00-AUDIT-LOCKED, file:src/app/api/leads/route.ts, file:src/lib/api/utils.ts
**Outputs:** STL-001-implementation, STL-001-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** failed persistence never returns success; lead retained on notification failure
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, failed persistence never returns success; lead retained on notification failure, independent review for STL-001
**Independent:** true

### `STL-002` — Fix estimate payload and corrupted copy

**Objective:** Fix estimate payload and corrupted copy. Acceptance: every path produces valid shared command; no broken text.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G00-AUDIT-LOCKED, file:src/views/Estimate.tsx
**Outputs:** STL-002-implementation, STL-002-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** every path produces valid shared command; no broken text
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, every path produces valid shared command; no broken text, independent review for STL-002
**Independent:** true

### `STL-003` — Disable public manage sign-up and enforce staff authorization

**Objective:** Disable public manage sign-up and enforce staff authorization. Acceptance: anonymous/customer cannot access or write.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G00-AUDIT-LOCKED, file:src/app/manage/*, file:src/proxy.ts, file:Supabase policies
**Outputs:** STL-003-implementation, STL-003-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** anonymous/customer cannot access or write
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, anonymous/customer cannot access or write, independent review for STL-003
**Independent:** true

### `STL-004` — Make lead/project uploads private

**Objective:** Make lead/project uploads private. Acceptance: unauthenticated URL denied; ownership tests pass.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G00-AUDIT-LOCKED, file:upload route/storage policies
**Outputs:** STL-004-implementation, STL-004-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, github
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** unauthenticated URL denied; ownership tests pass
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, unauthenticated URL denied; ownership tests pass, independent review for STL-004
**Independent:** true

### `STL-005` — Repair cabinet/commercial service pages or redirects

**Objective:** Repair cabinet/commercial service pages or redirects. Acceptance: all global links return intended 2xx.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G00-AUDIT-LOCKED, file:layout, file:landing data, file:routes
**Outputs:** STL-005-implementation, STL-005-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** all global links return intended 2xx
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, all global links return intended 2xx, independent review for STL-005
**Independent:** true

### `STL-006` — Correct 404 canonical/robots metadata

**Objective:** Correct 404 canonical/robots metadata. Acceptance: no contradictory index/canonical.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G00-AUDIT-LOCKED, file:root metadata, file:not-found
**Outputs:** STL-006-implementation, STL-006-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** no contradictory index/canonical
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, no contradictory index/canonical, independent review for STL-006
**Independent:** true

### `STL-007` — Resolve SSR search-param bailout

**Objective:** Resolve SSR search-param bailout. Acceptance: no production bailout logs.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G00-AUDIT-LOCKED, file:landing/client boundaries
**Outputs:** STL-007-implementation, STL-007-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** no production bailout logs
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, no production bailout logs, independent review for STL-007
**Independent:** true

### `STL-008` — Replace optional webhook authentication

**Objective:** Replace optional webhook authentication. Acceptance: unsigned requests denied.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G00-AUDIT-LOCKED, file:ManyChat/webhook routes
**Outputs:** STL-008-implementation, STL-008-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** unsigned requests denied
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, unsigned requests denied, independent review for STL-008
**Independent:** true

### `STL-009` — Expand smoke/E2E critical journeys

**Objective:** Expand smoke/E2E critical journeys. Acceptance: deployment fails on route/form/auth regressions.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G00-AUDIT-LOCKED, file:scripts/tests/workflows
**Outputs:** STL-009-implementation, STL-009-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** deployment fails on route/form/auth regressions
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, deployment fails on route/form/auth regressions, independent review for STL-009
**Independent:** true

### `STL-010` — Add lead-delivery reconciliation queue

**Objective:** Add lead-delivery reconciliation queue. Acceptance: failed delivery visible/retryable.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-001, file:current adapter or initial Convex event store
**Outputs:** STL-010-implementation, STL-010-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** failed delivery visible/retryable
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, failed delivery visible/retryable, independent review for STL-010
**Independent:** true

### `STL-101` — Add Convex environments/provider

**Objective:** Add Convex environments/provider. Acceptance: dev/preview/prod isolated.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G10-STABILIZED, file:package.json, file:convex/, file:src/components/providers/ConvexAuthProvider.tsx
**Outputs:** STL-101-implementation, STL-101-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, github
**Permissions:** repository:read, repository:write
**Verification:** dev/preview/prod isolated
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, dev/preview/prod isolated, independent review for STL-101
**Independent:** true

### `STL-102` — Integrate approved identity provider

**Objective:** Integrate the identity provider selected by ADR-AUTH-PROVIDER with Next.js and Convex, including session validation, invitations, lifecycle synchronization, MFA requirements, and rollback. Acceptance: identity provider establishes identity while Convex remains the authorization authority.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-101, dependency:STL-105, file:convex/auth.config.ts, file:src/lib/auth/*, file:src/proxy.ts, signed-auth-provider-adr
**Outputs:** STL-102-implementation, STL-102-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** staff/customer session works
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, staff/customer session works, independent review for STL-102
**Independent:** true

### `STL-103` — Implement Convex authz/audit

**Objective:** Implement Convex authz/audit. Acceptance: table-driven permission tests.
**Type:** validator | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-102, file:convex/lib/authz.ts, file:convex/lib/audit.ts, file:tests/convex/authz.test.ts
**Outputs:** STL-103-implementation, STL-103-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, separate-authorization-required
**Verification:** table-driven permission tests
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, table-driven permission tests, independent review for STL-103
**Independent:** true

### `STL-104` — Split marketing/portal/ops route groups

**Objective:** Split marketing/portal/ops route groups. Acceptance: no marketing shell in apps.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-102, dependency:STL-105, file:src/app/(marketing), file:src/app/(portal), file:src/app/(ops)
**Outputs:** STL-104-implementation, STL-104-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** no marketing shell in apps
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, no marketing shell in apps, independent review for STL-104
**Independent:** true

### `STL-105` — Strict server/client env schema

**Objective:** Strict server/client env schema. Acceptance: missing secret fails fast.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G10-STABILIZED, file:src/lib/env/server.ts, file:src/lib/env/client.ts, file:.env.example
**Outputs:** STL-105-implementation, STL-105-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** missing secret fails fast
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, missing secret fails fast, independent review for STL-105
**Independent:** true

### `STL-106` — CRM foundational schema

**Objective:** CRM foundational schema. Acceptance: contacts/properties/leads/opportunities.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-101, dependency:STL-103, dependency:STL-107, file:convex/schema.ts, file:convex/contacts.ts, file:convex/properties.ts, file:convex/leads.ts, file:convex/opportunities.ts
**Outputs:** STL-106-implementation, STL-106-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** contacts/properties/leads/opportunities
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, contacts/properties/leads/opportunities, independent review for STL-106
**Independent:** true

### `STL-107` — Domain events/idempotency/webhook receipts

**Objective:** Domain events/idempotency/webhook receipts. Acceptance: unique/replay-safe events.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-101, dependency:STL-105, file:convex/lib/events.ts, file:convex/lib/idempotency.ts, file:convex/webhooks.ts
**Outputs:** STL-107-implementation, STL-107-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** unique/replay-safe events
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, unique/replay-safe events, independent review for STL-107
**Independent:** true

### `STL-108` — Supabase live inventory/export

**Objective:** Supabase live inventory/export. Acceptance: complete schema/data report.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G10-STABILIZED, file:scripts/migrations/export-supabase.ts, file:inventory artifacts
**Outputs:** STL-108-implementation, STL-108-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required
**Verification:** complete schema/data report
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, complete schema/data report, independent review for STL-108
**Independent:** true

### `STL-109` — Payload/Directus inventory/export

**Objective:** Payload/Directus inventory/export. Acceptance: drafts/media/redirect report.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G10-STABILIZED, file:scripts/migrations/export-payload.ts, file:export-directus.ts, file:inventory artifacts
**Outputs:** STL-109-implementation, STL-109-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required
**Verification:** drafts/media/redirect report
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, drafts/media/redirect report, independent review for STL-109
**Independent:** true

### `STL-110` — Migration mapping/reconciliation framework

**Objective:** Migration mapping/reconciliation framework. Acceptance: idempotent import + report.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-106, dependency:STL-107, dependency:STL-108, dependency:STL-109, file:scripts/migrations/*, file:convex/migrations.ts, file:tests/convex/migrations.test.ts
**Outputs:** STL-110-implementation, STL-110-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required
**Verification:** idempotent import + report
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, idempotent import + report, independent review for STL-110
**Independent:** true

### `STL-201` — Dynamic estimate funnel

**Objective:** Dynamic estimate funnel. Acceptance: mobile save/resume/attribution/private files.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-004, dependency:STL-103, dependency:STL-106, dependency:STL-107, dependency:STL-301, file:src/features/estimate-funnel/*, file:convex/leads.ts, file:upload session routes
**Outputs:** STL-201-implementation, STL-201-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** mobile save/resume/attribution/private files
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, mobile save/resume/attribution/private files, independent review for STL-201
**Independent:** true

### `STL-202` — Cal synchronization

**Objective:** Cal synchronization. Acceptance: verified webhook and appointment reconciliation.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-107, dependency:STL-201, file:src/app/api/webhooks/cal/route.ts, file:convex/appointments.ts
**Outputs:** STL-202-implementation, STL-202-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** verified webhook and appointment reconciliation
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, verified webhook and appointment reconciliation, independent review for STL-202
**Independent:** true

### `STL-203` — Lead assignment/SLA workflows

**Objective:** Lead assignment/SLA workflows. Acceptance: deterministic routing and visible escalation.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-107, dependency:STL-201, dependency:STL-202, file:workflows/lead-created.ts, file:workflows/lead-response-sla.ts, file:convex/tasks.ts
**Outputs:** STL-203-implementation, STL-203-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** deterministic routing and visible escalation
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, deterministic routing and visible escalation, independent review for STL-203
**Independent:** true

### `STL-204` — CRM pipeline/operator drawer

**Objective:** CRM pipeline/operator drawer. Acceptance: full timeline/next action.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-103, dependency:STL-106, dependency:STL-301, file:src/app/(ops)/ops/leads/*, file:src/features/crm/*, file:convex/opportunities.ts
**Outputs:** STL-204-implementation, STL-204-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** full timeline/next action
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, full timeline/next action, independent review for STL-204
**Independent:** true

### `STL-205` — Estimate builder/versioning

**Objective:** Estimate builder/versioning. Acceptance: approved immutable version.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-106, dependency:STL-204, dependency:STL-301, file:src/features/estimates/*, file:convex/estimates.ts
**Outputs:** STL-205-implementation, STL-205-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** approved immutable version
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, approved immutable version, independent review for STL-205
**Independent:** true

### `STL-206` — Proposal builder/viewer

**Objective:** Proposal builder/viewer. Acceptance: secure versioned delivery/view tracking.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-103, dependency:STL-107, dependency:STL-205, dependency:STL-301, file:src/features/proposals/*, file:convex/proposals.ts
**Outputs:** STL-206-implementation, STL-206-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, github
**Permissions:** repository:read, repository:write
**Verification:** secure versioned delivery/view tracking
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, secure versioned delivery/view tracking, independent review for STL-206
**Independent:** true

### `STL-207` — Agreement signing evidence

**Objective:** Agreement signing evidence. Acceptance: immutable legal/version audit.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-103, dependency:STL-206, file:src/features/agreements/*, file:convex/agreements.ts
**Outputs:** STL-207-implementation, STL-207-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** immutable legal/version audit
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, immutable legal/version audit, independent review for STL-207
**Independent:** true

### `STL-208` — Stripe deposit/invoice

**Objective:** Stripe deposit/invoice. Acceptance: provider-confirmed posted payment.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-103, dependency:STL-107, dependency:STL-207, file:src/app/api/webhooks/stripe/route.ts, file:convex/payments.ts
**Outputs:** STL-208-implementation, STL-208-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, stripe-sandbox
**Permissions:** repository:read, repository:write, payment:sandbox-only, separate-authorization-required
**Verification:** provider-confirmed posted payment
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, provider-confirmed posted payment, independent review for STL-208
**Independent:** true

### `STL-209` — Proposal/deposit workflows

**Objective:** Proposal/deposit workflows. Acceptance: retries/stop conditions/dead letters.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-107, dependency:STL-206, dependency:STL-207, dependency:STL-208, file:workflows/proposal-conversion.ts, file:workflows/deposit-collection.ts
**Outputs:** STL-209-implementation, STL-209-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, github, stripe-sandbox
**Permissions:** repository:read, repository:write, payment:sandbox-only, separate-authorization-required
**Verification:** retries/stop conditions/dead letters
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, retries/stop conditions/dead letters, independent review for STL-209
**Independent:** true

### `STL-301` — Design tokens/shadcn baseline

**Objective:** Design tokens/shadcn baseline. Acceptance: WCAG/visual-regression baseline.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-104, dependency:STL-105, file:components.json, file:src/index.css, file:src/components/ui/*, file:src/components/brand/*
**Outputs:** STL-301-implementation, STL-301-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** WCAG/visual-regression baseline
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, WCAG/visual-regression baseline, independent review for STL-301
**Independent:** true

### `STL-302` — Public templates/home/service/location

**Objective:** Public templates/home/service/location. Acceptance: differentiated mobile-first pages.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-005, dependency:STL-006, dependency:STL-007, dependency:STL-301, file:src/app/(marketing)/*, file:src/features/marketing/*
**Outputs:** STL-302-implementation, STL-302-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** differentiated mobile-first pages
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, differentiated mobile-first pages, independent review for STL-302
**Independent:** true

### `STL-303` — Convex CMS/versioning/preview

**Objective:** Convex CMS/versioning/preview. Acceptance: publish/rollback.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-103, dependency:STL-106, dependency:STL-107, dependency:STL-301, file:convex/content.ts, file:src/app/(ops)/ops/content/*
**Outputs:** STL-303-implementation, STL-303-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, github
**Permissions:** repository:read, repository:write
**Verification:** publish/rollback
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, publish/rollback, independent review for STL-303
**Independent:** true

### `STL-304` — Content/media migration

**Objective:** Content/media migration. Acceptance: checksum/URL/visual diff.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-110, dependency:STL-303, file:scripts/migrations/import-content.ts, file:import-media.ts, file:URL manifest
**Outputs:** STL-304-implementation, STL-304-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required, separate-authorization-required
**Verification:** checksum/URL/visual diff
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, checksum/URL/visual diff, independent review for STL-304
**Independent:** true

### `STL-305` — Technical SEO fixes

**Objective:** Technical SEO fixes. Acceptance: crawl/schema/sitemap/canonical pass.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-009, dependency:STL-302, dependency:STL-304, file:src/app/sitemap.ts, file:src/app/robots.ts, file:metadata/schema utilities, file:tests/e2e/seo-routes.spec.ts
**Outputs:** STL-305-implementation, STL-305-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** crawl/schema/sitemap/canonical pass
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, crawl/schema/sitemap/canonical pass, independent review for STL-305
**Independent:** true

### `STL-306` — GBP integrity audit with owner access

**Objective:** GBP integrity audit with owner access. Acceptance: completed verified profile checklist.
**Type:** validator | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:G10-STABILIZED, file:GBP owner-access checklist and verified export
**Outputs:** STL-306-implementation, STL-306-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, web-official-docs
**Permissions:** repository:read, external-communication:draft-only
**Verification:** completed verified profile checklist
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, completed verified profile checklist, independent review for STL-306
**Independent:** true

### `STL-307` — GBP workspace

**Objective:** GBP workspace. Acceptance: tasks/reviews/posts/photos/UTMs.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-301, dependency:STL-303, dependency:STL-306, file:convex/gbp.ts, file:src/app/(ops)/ops/google-business/*
**Outputs:** STL-307-implementation, STL-307-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, web-official-docs
**Permissions:** repository:read, repository:write, external-communication:draft-only
**Verification:** tasks/reviews/posts/photos/UTMs
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, tasks/reviews/posts/photos/UTMs, independent review for STL-307
**Independent:** true

### `STL-308` — Review policy/system

**Objective:** Review policy/system. Acceptance: no gating; human-approved responses.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-103, dependency:STL-307, file:convex/reviews.ts, file:workflows/review-referral.ts, file:review UI
**Outputs:** STL-308-implementation, STL-308-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** no gating; human-approved responses
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, no gating; human-approved responses, independent review for STL-308
**Independent:** true

### `STL-309` — Local content proof gates

**Objective:** Local content proof gates. Acceptance: no thin city pages.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-302, dependency:STL-304, dependency:STL-305, dependency:STL-306, file:content proof rules, file:city/service templates, file:editorial gates
**Outputs:** STL-309-implementation, STL-309-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, github
**Permissions:** repository:read, repository:write
**Verification:** no thin city pages
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, no thin city pages, independent review for STL-309
**Independent:** true

### `STL-401` — Customer portal shell/next action

**Objective:** Customer portal shell/next action. Acceptance: authorized task-first dashboard.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-102, dependency:STL-103, dependency:STL-204, dependency:STL-301, file:src/app/(portal)/portal/*, file:portal shell
**Outputs:** STL-401-implementation, STL-401-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** authorized task-first dashboard
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, authorized task-first dashboard, independent review for STL-401
**Independent:** true

### `STL-402` — Property/appointment/proposal/payment views

**Objective:** Property/appointment/proposal/payment views. Acceptance: customer isolation.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-202, dependency:STL-206, dependency:STL-208, dependency:STL-401, file:portal property/appointment/proposal/payment routes
**Outputs:** STL-402-implementation, STL-402-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, github, stripe-sandbox
**Permissions:** repository:read, repository:write, payment:sandbox-only, separate-authorization-required
**Verification:** customer isolation
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, customer isolation, independent review for STL-402
**Independent:** true

### `STL-403` — Projects/files/updates

**Objective:** Projects/files/updates. Acceptance: private secure lifecycle.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-004, dependency:STL-103, dependency:STL-106, dependency:STL-401, file:convex/projects.ts, file:convex/files.ts, file:portal project routes
**Outputs:** STL-403-implementation, STL-403-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, github
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** private secure lifecycle
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, private secure lifecycle, independent review for STL-403
**Independent:** true

### `STL-404` — Change orders

**Objective:** Change orders. Acceptance: immutable version + approval.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-206, dependency:STL-207, dependency:STL-403, file:convex/changeOrders.ts, file:proposal/agreement integration
**Outputs:** STL-404-implementation, STL-404-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, separate-authorization-required
**Verification:** immutable version + approval
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, immutable version + approval, independent review for STL-404
**Independent:** true

### `STL-405` — Project closeout/review/referral

**Objective:** Project closeout/review/referral. Acceptance: full retention loop.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-209, dependency:STL-308, dependency:STL-403, dependency:STL-404, dependency:STL-406, file:workflows/project-closeout.ts, file:workflows/review-referral.ts
**Outputs:** STL-405-implementation, STL-405-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, github
**Permissions:** repository:read, repository:write
**Verification:** full retention loop
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, full retention loop, independent review for STL-405
**Independent:** true

### `STL-406` — Crew/project assignments

**Objective:** Crew/project assignments. Acceptance: scoped field access.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-103, dependency:STL-403, file:convex/projectAssignments.ts, file:field access UI
**Outputs:** STL-406-implementation, STL-406-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, github
**Permissions:** repository:read, repository:write
**Verification:** scoped field access
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, scoped field access, independent review for STL-406
**Independent:** true

### `STL-407` — Automation Center UI

**Objective:** Automation Center UI. Acceptance: version/run/replay/approval.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-107, dependency:STL-209, dependency:STL-301, file:convex/automations.ts, file:workflows/*, file:src/app/(ops)/ops/automations/*
**Outputs:** STL-407-implementation, STL-407-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** version/run/replay/approval
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, version/run/replay/approval, independent review for STL-407
**Independent:** true

### `STL-408` — System health/integration dashboard

**Objective:** System health/integration dashboard. Acceptance: actionable failures.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-107, dependency:STL-407, file:convex/systemHealth.ts, file:ops integration health UI
**Outputs:** STL-408-implementation, STL-408-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** actionable failures
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, actionable failures, independent review for STL-408
**Independent:** true

### `STL-501` — First-party attribution ledger

**Objective:** First-party attribution ledger. Acceptance: tagged visit → revenue trace.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-107, dependency:STL-201, dependency:STL-202, dependency:STL-204, dependency:STL-208, file:convex/analytics.ts, file:src/lib/tracking/*
**Outputs:** STL-501-implementation, STL-501-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write
**Verification:** tagged visit → revenue trace
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, tagged visit → revenue trace, independent review for STL-501
**Independent:** true

### `STL-502` — Revenue dashboards

**Objective:** Revenue dashboards. Acceptance: drill-down totals reconcile.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-204, dependency:STL-208, dependency:STL-405, dependency:STL-501, file:ops revenue dashboard, file:reconciliation queries
**Outputs:** STL-502-implementation, STL-502-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** drill-down totals reconcile
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, drill-down totals reconcile, independent review for STL-502
**Independent:** true

### `STL-503` — Experiment framework

**Objective:** Experiment framework. Acceptance: exposure/outcome/guardrails.
**Type:** agent | **Risk:** medium | **Mode:** approval
**Inputs:** dependency:STL-302, dependency:STL-305, dependency:STL-501, file:experiment definitions, file:exposure/outcome events, file:guardrails
**Outputs:** STL-503-implementation, STL-503-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell
**Permissions:** repository:read, repository:write
**Verification:** exposure/outcome/guardrails
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, exposure/outcome/guardrails, independent review for STL-503
**Independent:** true

### `STL-504` — Final dual-read/write cutover

**Objective:** Final dual-read/write cutover. Acceptance: reconciliation threshold met.
**Type:** subgraph | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G70-CUTOVER-READY, file:feature flags, file:cutover scripts, file:provider endpoint switches, file:production runbook
**Outputs:** STL-504-implementation, STL-504-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex, vercel
**Permissions:** repository:read, repository:write, deployment:write:approval-required, data:migration:approval-required, separate-authorization-required
**Verification:** reconciliation threshold met
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, reconciliation threshold met, independent review for STL-504
**Independent:** true

### `STL-505` — Supabase/Payload/Directus removal

**Objective:** Supabase/Payload/Directus removal. Acceptance: zero runtime dependency.
**Type:** agent | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:G85-ROLLBACK-WINDOW-CLEARED, dependency:STL-506, file:legacy dependency removal, file:archive manifests, file:service cancellation checklist
**Outputs:** STL-505-implementation, STL-505-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required, separate-authorization-required
**Verification:** zero runtime dependency
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, zero runtime dependency, independent review for STL-505
**Independent:** true

### `STL-506` — Restore/decommission runbooks

**Objective:** Restore/decommission runbooks. Acceptance: approved restore drill.
**Type:** subgraph | **Risk:** high | **Mode:** blocked
**Inputs:** dependency:STL-110, dependency:G30-PUBLIC-CMS-READY, dependency:G31-VISITOR-TO-BOOKING, dependency:G40-PROPOSAL-TO-DEPOSIT, dependency:G50-PORTAL-OPS-READY, dependency:G60-MEASUREMENT-READY, file:restore/decommission runbooks, file:drill evidence
**Outputs:** STL-506-implementation, STL-506-verification-evidence
**Tools:** graphifyy/query_graph, filesystem, git, shell, convex
**Permissions:** repository:read, repository:write, data:migration:approval-required, separate-authorization-required
**Verification:** approved restore drill
**Evidence required:** acceptance criterion demonstrated with evidence, required verification profile passed, independent review passed for high-risk or user-facing work, approved restore drill, independent review for STL-506
**Independent:** true

## Budget & Cost Scenarios

| Scenario | AI USD (low/exp/high) | Labor hrs (low/exp/high) | Infra+Ext USD | Contingency USD | Total (if rate set) |
|---|---|---|---:|---:|---:|
| lean | 26.230000000000004 / 48.03999999999999 / 86.59 | 90.27000000000001 / 164.04000000000002 / 297.0899999999999 | 0 | 4.804 | rate not set |
| expected | 40.76000000000001 / 74.50999999999999 / 134.69 | 139.26 / 255 / 460.5000000000001 | 0 | 14.82 | rate not set |
| highConfidence | 71.58000000000001 / 131.11 / 236.6600000000001 | 245.67000000000013 / 448.11 / 809.6099999999999 | 0 | 45.5135 | rate not set |

## Risks

| ID | Tier | Description | Mitigation |
|---|---|---|---|
| r-authz | HIGH | Incorrect identity or authorization migration could expose customer, property, project, or administrative data. | Block protected-surface expansion until independent authorization-matrix tests and approval gate pass. |
| r-data | HIGH | Supabase, Payload, Directus, and file migrations may omit, duplicate, or corrupt business records. | Immutable snapshots, legacy mappings, checksums, shadow reads, dual writes, reconciliation, and rollback drill. |
| r-revenue | HIGH | Lead, estimate, proposal, signature, or deposit failures could lose revenue or acknowledge work that was not persisted. | Fail-closed persistence, idempotency, provider receipts, durable workflows, and conversion E2E gates. |
| r-seo | MEDIUM | Route, canonical, content, or GBP errors could reduce local visibility or violate platform policy. | One route registry, crawl validation, policy-compliant review flow, human approval for GBP publishing. |
| r-cost | MEDIUM | Context duplication, agent fan-out, and failed retries could consume weekly agentic allowance inefficiently. | Graphifyy-bounded context packets, model routing, two-writer maximum, output schema, telemetry, and replan at 50% cost deviation. |
| r-cutover | HIGH | Production cutover or decommissioning could create downtime or destroy the rollback path. | Separate authorization, one active cutover node, tested rollback, observation window, and delayed decommissioning. |

## Execution Policy

- Medium risk requires approval: **true**
- High risk blocked: **true**
- Replan triggers: budget warning, new material dependency, failed verification changes scope, explicit user scope change, actual cost deviates from expected by more than 50%, canonical architecture decision changes, Graphifyy graph is stale or mis-bound

