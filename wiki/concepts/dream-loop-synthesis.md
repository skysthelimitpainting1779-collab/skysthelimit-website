---
title: Dream Loop Synthesis
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [synthesis, automation, memory]
---

# Dream Loop Synthesis

## Summary
The Dream Loop is an autonomous background traversal engine that inspects knowledge graphs, uncovers hidden connections, and reconciles contradictory notes across sessions.

## Key Principles & Mechanisms
- **Multi-Layer Traversal**: Combines Zep graph entities, relational records, and Obsidian markdown notes.
- **Contradiction Resolution**: Flags stale facts and proposes atomic updates to wiki pages, never history rewrites - precedent: the 2026-07-27 rollout reconciliation, where [[Rollout Failure Analysis: 2026-07-27]] preserved the failed session verbatim while [[Corrected Execution Process]] superseded the procedure.
- **Compiler-Governed Operation**: Each pass runs the `compile` and `lint` operations defined by [[Karpathy LLM Wiki: Compiler Specification]], so graph changes land only behind a clean lint gate.

## Related Concepts & Backlinks
- [[Second Brain Neocortex]] - The cognitive model utilizing dream loops.
- [[Karpathy LLM Wiki Pattern]] - The structured format updated by dream loops.
- [[Karpathy LLM Wiki: Compiler Specification]] - The directive set each pass executes under.
- [[Gate-Bounded Autonomy]] - Synthesis uniting the loop's knowledge gates with execution preflight gates.
