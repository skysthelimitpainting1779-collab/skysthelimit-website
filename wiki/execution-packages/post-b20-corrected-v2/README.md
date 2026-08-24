---
title: Execution Package: Post-B20 Corrected (v2)
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [execution-package, governance, runbook]
---

# Execution Package: Post-B20 Corrected (v2)

Supersedes: skys-limit-post-b20-design-governed-execute (2026-07-27 rollout)
Graph Engineer: v2.0.0 (graph-engineer-codex-windows-v2)
Target worktree: C:/Users/Johnny Cage/DEV/skys-limit-worktrees/agent-skys-limit-convex-os
Target branch: agent/skys-limit-convex-os
B20 checkpoint: b1db201644335acf95a263810bd38e15fbd512f1 (verified ancestor)

## Summary

Governed v2 package superseding the failed 2026-07-27 rollout, defining gates, preflight validation, and reading order for the corrected run.

## What Changed vs. Original Package

| Area | Original (failed) | Corrected |
|------|-------------------|-----------|
| Session cwd | Main worktree | Integration worktree |
| Collaboration mode | Plan (read-only) | Execute (mutating) |
| Approval policy | never | Risk-tiered |
| Pre-flight gate | None | Mandatory preflight.mjs |
| Graph installation | Not copied | Automated copy + validation |
| Knowledge graph | Stale (78a865c7) | Refreshed to HEAD |
| Multi-agent | Globally suppressed | Per-batch config |
| Execution log | 1 entry only | Full lifecycle |
| Health check | Skipped | Blocking requirement |

## Usage

1. Run preflight.mjs from integration worktree (BLOCKING)
2. Apply session-bootstrap.json settings
3. Invoke with: Execute
4. Follow EXECUTION_ORDER.md

## Invariants

1. All work in integration worktree, never main
2. High-risk nodes require explicit per-node authorization
3. execution-log.jsonl is append-only
4. No node complete without independent verification
5. One integration PR to main after all gates pass
6. Graphify current (max 3 commits stale)
7. npm run goal:verify passes before batch gate

## Related Concepts & Backlinks

- [[Rollout Failure Analysis: 2026-07-27]] - Failure evidence motivating every correction tabulated above.
- [[Execution Order: Post-B20 Corrected]] - The concrete batch sequence to execute.
- [[Gate-Bounded Autonomy]] - The seven invariants instantiate gate-open/evidence-close discipline.
