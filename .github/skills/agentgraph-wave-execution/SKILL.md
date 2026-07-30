---
name: agentgraph-wave-execution
description: Build and run repeatable AgentGraph worker waves from ready-node input supplied by the authoritative governed lifecycle ledger. Use when coordinating real Codex executor/verifier tasks, enforcing local/preview-only mutation policy, serializing resource conflicts, collecting assignment-bound artifacts, or halting on missing/failed callbacks. Never use a compiled graph alone to infer product-node readiness.
---

# AgentGraph Wave Execution

Use the lifecycle ledger as the sole authority for product-node state. Treat `.graph/graph.json`, JSONL plans, reports, and repository status fields as descriptive inputs only.

## Build a wave

Require a ledger export matching this contract:

```json
{
  "source": {
    "kind": "authoritative-lifecycle-ledger",
    "ledgerId": "governed-execution",
    "revision": "opaque-revision"
  },
  "completedNodeIds": ["dependency-id"],
  "target": {
    "worktreePath": "absolute path",
    "environment": "local",
    "sandbox": "workspace-write"
  },
  "boundary": {
    "allowedEnvironments": ["local", "preview", "test", "sandbox"],
    "allowReadOnlyProductionMetadata": true,
    "allowPreviewDeployments": true,
    "allowTestSandboxIntegrations": true,
    "allowProductionMutations": false
  },
  "workers": [
    {"id": "executor-1", "capabilities": ["execute"]},
    {"id": "verifier-1", "capabilities": ["verify"]}
  ],
  "maxConcurrentExecutors": 2,
  "readyNodes": [
    {
      "id": "node-id",
      "title": "title",
      "dependsOn": ["dependency-id"],
      "permissions": ["repository:write"],
      "inputs": ["file:path"],
      "outputs": ["artifact"],
      "resourceLocks": ["lock"],
      "lifecycle": {"authoritative": true, "status": "ready", "attempt": 1},
      "verification": {
        "independent": true,
        "requiredEvidence": ["focused tests"],
        "successCondition": "tests pass"
      }
    }
  ]
}
```

Generate deterministic, conflict-free assignment specs:

```powershell
node .agents/skills/agentgraph-wave-execution/scripts/build-wave-specs.mjs `
  --input .agents/execution/ledger-ready.json `
  --output .agents/execution/wave.json
```

Reject the input if `source.kind` is not `authoritative-lifecycle-ledger`. Never substitute compiled-graph readiness.

## Launch and collect

1. Run `execution_graph_preflight`, `execution_graph_cursor`, `execution_graph_next`, and `execution_graph_node` against the authoritative governed thread.
2. Stop if the worktree is dirty/stale relative to the ledger revision or if the node is no longer ready.
3. Acquire every assignment `resourceLocks` and file lock before launch. Defer conflicting nodes.
4. Launch each assignment with `createCodexAppTaskBridge` when host task controls are injected. Use `createCodexCliTaskBridge` only from the exact target worktree when the host bridge is unavailable.
5. Pass the ledger boundary to `runAgentGraphWithCodex`. Use `workspace-write` only for local files named by `allowedFiles`; use read-only mode for inspection/verifier work.
6. Use host app-registry lifecycle MCP tools when exposed. If app-registry lifecycle MCP exposure is unavailable, use the authorized official in-process `mcp_server.py` function transport: keep one long-lived Python control process, import the official `mcp_server.py` module exactly once, and call its lifecycle functions directly.
7. Do not start an MCP subprocess. Do not edit the lifecycle database manually or directly. Keep the lease capability only in memory; never print it, persist it, include it in evidence, or return it in a callback.
8. Call `lifecycle_checkpoint_renew` before the active lease expires and before any long-running test or build could cross its expiry.
9. Accept only a strict JSON completion callback bound to the node, assignment, and worker IDs. Require a non-empty artifact ID and explicit `productionSideEffects: false` plus `providerMutations: false`.
10. Launch a separate verifier worker for the emitted verifier assignment. Require its callback to bind the completion artifact ID.
11. Mark the node complete and unlock successors only after verification passes.
12. On missing callback, invalid identity, failed verification, or platform failure, halt once, persist the exact report, and steer remaining workers to stop.

## Boundary

- Allow local repository mutation within the assignment file locks.
- Allow preview deployment only when the ledger node explicitly grants preview deployment permission.
- Allow test/sandbox integration mutation only when explicitly granted.
- Allow production metadata reads for evidence.
- Forbid production mutation, promotion, deletion, provider reconfiguration, and inferred authorization.

## Verify control-plane changes

```powershell
node --test `
  tests/agentgraph-execution-dispatcher.test.mjs `
  tests/agentgraph-codex-task-runner.test.mjs `
  tests/agentgraph-execution-dispatcher.e2e.test.mjs
```
