# Legacy Planning Graph Policy

`graph.json` and `graph.md` are retained as historical planning and cost-model
inputs. They are not execution authority and do not contain the live cursor.

## Allowed use

- Use the legacy graph only for read-only critical-path or cost analysis.
- Use Graphifyy for live symbols, callers, dependencies, affected tests, and blast radius.
- Use `.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl`
  for node order, gates, status, and the resume cursor.
- Store progress and evidence through the shared lifecycle MCP tools.

## Do not

- Do not resume work, mark status, authorize production, or create handoffs from
  `.graph/graph.json`.
- Do not append runtime evidence under `.graph/`.
- Do not regenerate this legacy graph during normal execution.
- Do not use generic labor-hour or cost estimates as elapsed-time forecasts.
- Do not bulk-load `graph.md`, the master audit, or the full repository map into every worker.

## Structural replan trigger

Stop and report a structural recompile request only when one of these is proven:

- A required node or dependency is absent.
- A node contract cannot be satisfied without violating another validated node.
- Current `origin/main` has diverged so far that the audited repository map is no longer valid.
- Scope materially expands beyond the approved product.
- A new production-risk or authorization gate is required.

Ordinary implementation discoveries update the lifecycle ledger and scoped
bindings; they do not trigger graph re-engineering.
