# Compiled Graph Runtime Policy

`graph.json` and `graph.md` are already compiled and validated outputs from Graph Engineer v2.

## Runtime use

- Copy this `.graph` directory into the integration worktree.
- Use `graph.json` for node dependencies, status, risk, attempts, permissions, evidence, and approval gates.
- Use `EXECUTION_BATCHES.json` to combine compatible nodes into efficient execution sessions.
- Use `NODE_BINDINGS.json` as the pre-audited starting repository scope.
- Use Graphifyy for live symbols, callers, dependencies, affected tests, and blast radius.
- Append execution evidence to `execution-log.jsonl`.

## Do not

- Do not install the Graph Engineer skill.
- Do not rerun its planning, cost, or critical-path scripts during normal execution.
- Do not regenerate the graph merely because implementation begins.
- Do not use generic labor-hour or cost estimates as elapsed-time forecasts.
- Do not bulk-load `graph.md`, the master audit, or the full repository map into every worker.

## Structural replan trigger

Stop and report a structural recompile request only when one of these is proven:

- A required node or dependency is absent.
- A node contract cannot be satisfied without violating another validated node.
- Current `origin/main` has diverged so far that the audited repository map is no longer valid.
- Scope materially expands beyond the approved product.
- A new production-risk or authorization gate is required.

Ordinary implementation discoveries update node evidence and scoped bindings; they do not trigger graph re-engineering.
