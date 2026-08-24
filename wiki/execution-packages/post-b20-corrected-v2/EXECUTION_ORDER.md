---
title: Execution Order: Post-B20 Corrected
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [execution, runbook, batches]
---

# Execution Order: Post-B20 Corrected

Branch: agent/skys-limit-convex-os
Worktree: C:/Users/Johnny Cage/DEV/skys-limit-worktrees/agent-skys-limit-convex-os
Current HEAD: 3c9da083 (docs(g20): assemble approval packet)
B20 checkpoint: b1db2016 (verified ancestor)

## Summary

Blocking-gate sequence G20-EVIDENCE-CLOSE -> B25 -> B31 -> B30 -> B50 -> B60 for the Post-B20 corrected rollout.

## Sequence

G20-EVIDENCE-CLOSE -> B25 -> B31 -> B30 -> B50 -> B60

Each step is a blocking gate. Do not proceed until exit criteria met.

## Step 1: G20 Evidence Closure (Low risk)

1. Verify environment isolation (preview vs production env vars)
2. Verify authz matrix document exists and is current
3. Verify domain event uniqueness tests pass
4. Verify live source inventory (Supabase/Payload/Directus exports)
5. Verify reconciliation framework compiles
Exit: docs(g20): close evidence gate

## Step 2: B25 Design Governance (Medium risk, 1W/1R)

1. Install DESIGN.md and all design artifacts (51 wireframes)
2. node scripts/install-design-skills.mjs <repo>
3. Install design-md-governance and anti-slop-ui-review
4. node scripts/apply-design-governance.mjs <pkg> <repo>
5. npm run lint:design (all 51 templates pass)
6. npm run skills:validate && npm run host:compile
7. npm run lint && npm test && npm run build
Exit: feat(b25): install design governance and skill stack

## Step 3: B31 Visitor-to-Booking (High risk, 2W/1R)

Nodes: STL-201 through STL-209
Dependency: STL-004, STL-103, STL-106, STL-107, STL-301
Per node: read DESIGN.md + spec, load skills, implement, lint, verify, evidence
Exit: G31 + G40 pass in preview/test mode

## Step 4: B30 Public Site/CMS/SEO (High risk, 2W/1R)

Nodes: STL-301 through STL-309
Dependency: B25 complete
UI contract: DESIGN.md -> spec -> wireframe -> implement -> lint:design -> screenshots -> evidence -> design:gate
Exit: G30-PUBLIC-CMS-READY passes

## Step 5: B50 Portal/Operator (High risk, 2W/1R)

Nodes: STL-401 through STL-408
Dependency: STL-103, STL-106
Constraints: DTO contracts (not raw DB), customer isolation, private file boundaries
Exit: G50-PORTAL-OPS-READY passes

## Step 6: B60 Measurement/Cutover (High risk, 1W/2R)

Nodes: STL-501 through STL-506
Dependency: All prior gates succeeded
Actions: attribution reconcile, dashboard verify, migration export, rollback docs, G70 packet
Exit: G60-MEASUREMENT-READY + G70 approval packet complete

## Integration

git push origin agent/skys-limit-convex-os
Open ONE PR: agent/skys-limit-convex-os -> main
NEVER push directly to main. NEVER force-push. NEVER squash B20.

## Recovery

If session terminates mid-execution:
1. Read .graph/execution-log.jsonl from last node_succeeded
2. Set those nodes to succeeded
3. Re-verify running/waiting nodes from evidence
4. Resume from next pending node
5. Do NOT re-execute succeeded nodes

## Related Concepts & Backlinks

- [[Execution Package: Post-B20 Corrected (v2)]] - Package overview and invariants governing this sequence.
- [[Corrected Execution Process]] - Full process context surrounding these steps.
- [[Gate-Bounded Autonomy]] - Each step here is a blocking gate in the synthesized control loop.
