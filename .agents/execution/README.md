# Audited Execution Graph

`skys-limit-sequential-tdd-execution-graph-audited.jsonl` is the sole
authoritative execution plan for program `stl-post-g20-sequential-tdd-v1`.
Its immutable SHA-256 is pinned in
`.agents/governance/development-lifecycle.json`.

Validate it from the repository root:

```bash
npm run lifecycle:verify
python scripts/execution/validate_execution_graph.py \
  .agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl \
  --schema .agents/execution/skys-limit-sequential-tdd-execution-graph-audited.schema.json
```

Both commands must pass. The current resume point is
`stage:AUDIT-SECURITY-REMEDIATION:write_red_test`. The PR remains draft and
production mutation remains blocked until the graph's G70 approval gate is
explicitly satisfied.

Runtime progress, evidence, leases, handoffs, and deployments belong in the
shared control-plane SQLite database. They are not written back into this
audited source artifact.
