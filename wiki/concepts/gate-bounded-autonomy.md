---
title: Gate-Bounded Autonomy
type: synthesis
created: 2026-08-23
updated: 2026-08-23
tags: [synthesis, governance, automation, execution]
---

# Gate-Bounded Autonomy

## Summary
Synthesis uncovered by the 2026-08-23 Dream Loop pass: knowledge compilation under the [[Karpathy LLM Wiki Pattern]] and governed code execution under the [[Corrected Execution Process]] are the same control loop applied to two different substrates - knowledge state and process state. Every autonomous cycle opens behind machine-checkable gates and closes with append-only evidence, which is what makes repeated autonomous sessions compound instead of drift.

## Key Principles & Mechanisms
- **Open Behind Gates**: On the execution substrate, the mandatory `preflight.mjs` check verifies worktree health, branch ancestry, and main-branch divergence before any node runs - codifying Failures 1 and 5 of [[Rollout Failure Analysis: 2026-07-27]] into a blocking script. On the knowledge substrate, the `lint` operation defined by [[Karpathy LLM Wiki: Compiler Specification]] blocks catalog publication until broken links and orphan nodes are resolved.
- **Immutable Inputs, Superseding Outputs**: The `/raw` inbox is never edited and corrections land as new compiled artifacts: the failed package is superseded by the corrected one (`post-b20-corrected-v2` supersedes the original 2026-07-27 package), and contradictory notes are reconciled by new synthesis pages while the originals persist verbatim.
- **Bounded Context on Both Substrates**: A stale knowledge graph broke the rollout (Failure 6: graph built from commit `78a865c7` vs session HEAD three days newer), while bulk-loading graphs breaks attention - hence the hard denial on reading `graphify-out/wiki/**` or `GRAPH_REPORT.md` in the host kernel. Compiled, bounded packets (bootstrap settings, `INDEX.md` summaries, curated architecture maps) are the shared remedy; see also [[Second Brain Neocortex]].
- **Append-Only Evidence Closure**: Execution closes with lifecycle events in append-only `execution-log.jsonl`; knowledge closes with frontmatter `updated:` bumps and the INDEX "Compiled at" stamp. Recovery replays from the last succeeded event ([[Execution Order: Post-B20 Corrected]], Recovery section) exactly as the wiki rebuilds deterministically from raw sources plus graph.
- **Host Kernel Alignment**: The "Behavior (Karpathy)" rules in the project kernel - think before coding, simplicity first, surgical changes, goal-driven verification - instantiate the same gates at agent level, and [[DeepSeek Harness]] provides the live telemetry that makes each gate observable.

## Related Concepts & Backlinks
- [[Rollout Failure Analysis: 2026-07-27]] - Empirical evidence that ungated autonomy produced zero implementation progress.
- [[Corrected Execution Process]] - Process-substrate instance of the gate-open/evidence-close loop.
- [[Execution Order: Post-B20 Corrected]] - Gated batch sequence with recovery semantics.
- [[Karpathy LLM Wiki: Compiler Specification]] - Knowledge-substrate instance: compile and lint as gates.
- [[Karpathy LLM Wiki Pattern]] - Parent pattern for the compiled-knowledge side of the loop.
- [[Dream Loop Synthesis]] - Scheduled traversal that enforces the knowledge-side gates automatically.
- [[Second Brain Neocortex]] - Memory substrate the loop protects from amnesia and drift.
- [[DeepSeek Harness]] - Runtime host exposing gate telemetry across sessions.
- [[Graphify AST Engine]] - Structural graph engine whose staleness and bulk-load risks motivate bounded context.
