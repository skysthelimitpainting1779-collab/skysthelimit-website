---
name: execution-graph-gate
description: Validate the canonical execution DAG, print its critical path, and estimate scenario cost before graph installation, session resume, batch execution, or recovery. Use for .graph/graph.json; do not use for graphify-out/graph.json.
---

# Execution Graph Gate

## Prerequisites

- Run from the integration worktree.
- Treat `.graph/graph.json` as the canonical input.
- Keep every check read-only.
- Never repair, reorder, or mark nodes complete from this workflow.

## Gate

```bash
python .agents/skills/hardened-validation/scripts/run.py node scripts/validate-graph.mjs .graph/graph.json
python .agents/skills/hardened-validation/scripts/run.py node scripts/critical-path.mjs .graph/graph.json
python .agents/skills/hardened-validation/scripts/run.py node scripts/estimate-cost.mjs .graph/graph.json --scenario expected
```

Stop on any nonzero exit. Record the graph SHA-256, repository HEAD, command,
timestamp, and JSON output as evidence.

Do not resume execution when validation reports an unknown dependency, a cycle,
invalid cost data, or a hard-budget breach.

Apply budget thresholds to base expected cost and labor. Report contingency and
retry reserves separately as planning exposure; do not silently fold reserves
into actual expected spend.

## Recovery

Fix the source graph or restore the manifest-verified graph, then rerun all three
commands. Never edit the installed graph merely to make the gate pass.
