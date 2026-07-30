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
6. Inject one privileged in-process lifecycle supervisor through one long-lived Python bridge. Import the official `mcp_server.py` module exactly once; do not launch a process per operation.
7. Do not use generic or public MCP for capability-bearing lifecycle operations. Do not start an MCP subprocess. Do not edit the lifecycle database manually or directly. The worker never receives the lease capability; the supervisor keeps it in private memory and never prints, persists, evidences, or returns it.
8. For a recoverable needs-attention executor, derive assignment/thread/worker/actor/session from the authoritative wave plus attached host task. Require strict JSON registry and content-addressed recovery audit paths under the trusted agentgraph root (`dev/agentgraph`), exact current-registry binding, a clean governed worktree, and checkpoint head as an ancestor of current HEAD.
9. Resume the same attached task with no duplicate executor and preserve the same lease/base head. Rotate only the capability hash and expiry and append the public controller-resume event.
10. Configure `heartbeatIntervalMs` below `leaseTtlSeconds * 1000`. The same supervisor serially renews throughout every unbounded host wait, including verifier waits. A renewal failure steers the same attached task to stop and produces one terminal halt; never create a replacement executor.
    Canonical telemetry uses host-derived metrics, and completion occurs only after the independent verifier passes.
11. Accept only a strict JSON completion callback bound to the node, assignment, and worker IDs. Require a non-empty artifact ID and explicit `productionSideEffects: false` plus `providerMutations: false`.
12. Launch a separate verifier worker for the emitted verifier assignment. Require its callback to bind the completion artifact ID.
13. Before lifecycle DB completion, persist `lifecycleFinalization.phase = "prepared"` with the exact verifier assignment, callback, completed candidate state, successor assignments, and SHA-256. Add that SHA-256 as `agentgraph-finalization` completion evidence.
14. After idempotent DB completion, persist `phase = "finalized"` with the public completion receipt. Launch successors only after that finalized snapshot succeeds. On restart, pass `resumeSnapshot`; reconcile the exact program/checkpoint/node/finalization hash through the same Python bridge and never re-release a completed node.
15. An incomplete completion is reconciled and retried once through the same live private supervisor. Persistent failure stays halted with a durable prepared journal, active lease, and zero successor. A fresh controller cannot rotate an unexpired resumed lease; takeover requires expiry within the governed recovery grace.
16. On missing callback, invalid identity, failed verification, heartbeat failure, or platform failure, halt once, persist the exact report, and steer remaining workers to stop.

Use the executable host recipe with injected task controls; it never calls Codex app tools from repository code:

```js
import { createGovernedAgentGraphWaveController } from
  './.agents/skills/agentgraph-wave-execution/scripts/run-governed-wave.mjs';

const controller = createGovernedAgentGraphWaveController({
  pythonLifecycle: {
    pythonExecutable,
    mcpServerPath,
    databasePath,
    trustedAgentGraphRoot,
  },
  ledgerInput,
  attachedTasks,
  taskControl,
  lifecycleRecovery: {
    ...hostOwnedRecovery,
    heartbeatIntervalMs: 60_000,
    leaseTtlSeconds: 1_800,
  },
  resumeSnapshot,
  saveState: persistAuthoritativeSnapshot,
});
const result = await controller.run();
await controller.close({ terminalPreserved: true });
```

The controller concretely creates one `createPythonLifecycleSupervisorBridge` and passes it with host-owned recovery into `runAuthoritativeLedgerWaveWithAttachedHostTasks`. A thrown run retains that same bridge for retry/reconciliation. `close({terminalPreserved: true})` is rejected until `saveState` durably records complete, halted, prepared, or finalized recovery state.

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
