---
title: Corrected Execution Process
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [process, execution, governance]
---

# Corrected Execution Process

Step-by-step process for future execution sessions against the STL Convex OS graph.

## Summary

Phase-by-phase corrected process with pre-flight verification and gate-bounded steps for future STL Convex OS execution sessions.

## Phase 0: Pre-Flight

### 0.1 Verify worktree health

`powershell
cd C:\Users\Johnny Cage\DEV\skys-limit-worktrees\agent-skys-limit-convex-os
git branch --show-current   # Expected: agent/skys-limit-convex-os
git status --short          # Expected: empty
git merge-base --is-ancestor b1db201644335acf95a263810bd38e15fbd512f1 HEAD
`

### 0.2 Verify main branch divergence

`powershell
git fetch origin
git merge-base --is-ancestor c7e94605eefdace7a76ce5145808478df8503dbb origin/main
`

If true: perform targeted delta audit. If false: STOP - revalidation required.

### 0.3 Refresh knowledge graph

`powershell
npx graphify update .
`

### 0.4 Run agent health check

`powershell
npm run goal -- status
npm run lint
npm test
`

All must pass before proceeding.

## Phase 1: Session Configuration

1. Open session in the WORKTREE (not main): C:\Users\Johnny Cage\DEV\skys-limit-worktrees\agent-skys-limit-convex-os
2. Set collaboration mode to EXECUTE (not plan). Invocation: Execute
3. Approval policy: low=automatic, medium=on-request, high=blocked. NEVER set never.
4. Enable multi-agent for batches with parallelism.writers > 1.

## Phase 2: Graph Installation

1. Copy .graph directory into the worktree
2. Validate: node scripts/validate-graph.mjs .graph/graph.json
3. Critical path: node scripts/critical-path.mjs .graph/graph.json
4. Cost estimate: node scripts/estimate-cost.mjs .graph/graph.json
5. Verify execution-log.jsonl recovery state

## Phase 3: Execution Order (Post-B20)

`
G20-EVIDENCE-CLOSE -> B25 -> B31 -> B30 -> B50 -> B60
`

### G20 Evidence Closure
- Verify environment isolation, authz matrix, domain event uniqueness
- Verify live source inventory, reconciliation framework
- Commit: docs(g20): close evidence gate

### B25 Design Governance
`
node scripts/apply-design-governance.mjs <pkg> <repo>
node scripts/install-design-skills.mjs <repo>
npm run lint:design && npm run skills:validate && npm run host:compile
npm run lint && npm test && npm run build
`
Commit: feat(b25): install design governance and skill stack

### B31/B30/B50/B60
Per batch: verify dependsOn succeeded, check resource locks, execute nodes, append evidence, run gate, commit.

## Phase 4: Verification and Integration

- Per-node: deterministic checks BEFORE model judgment, independent verification
- Batch gate: npm run lint && npm test && npm run build && npm run goal:verify
- Integration: git push origin agent/skys-limit-convex-os, open ONE PR to main
- NEVER push directly to main

## Anti-Patterns

| Wrong | Correct |
|---|---|
| Session in main worktree | Integration worktree |
| Plan mode for execution | Execute/agent mode |
| approval_policy: never | Risk-tiered policy |
| Skip validation scripts | Run validate/critical-path/estimate-cost |
| No .graph in worktree | Install before first node |
| Global multi-agent suppression | Per-batch parallelism |
| Stale graphify | Refresh before execution |
| Skip health checks | goal:verify as pre-flight |

## Related Concepts & Backlinks

- [[Rollout Failure Analysis: 2026-07-27]] - The failure evidence each phase of this process corrects.
- [[Execution Order: Post-B20 Corrected]] - Concrete batch sequence implementing Phases 0-4.
- [[Gate-Bounded Autonomy]] - Generalizes this preflight/gate discipline into a single control loop.
