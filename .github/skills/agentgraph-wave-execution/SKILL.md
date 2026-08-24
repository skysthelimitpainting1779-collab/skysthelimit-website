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
4. Launch each assignment with `createCodexAppTaskBridge` when host task controls are injected. Durable `loadLaunchMapping`/`saveLaunchMapping` callbacks are mandatory. Derive the task key from an immutable scope hash binding ledger ID/revision/program/checkpoint when present, exact project/worktree/repository/branch, and node/role/attempt; assignment ID alone is forbidden. Persist its bootstrap marker and launch intent before `create_thread`, then persist the exact scope, `threadId`, and `hostId` after every individual create before attempting the next assignment. Reconcile every bootstrap marker through `read_thread`; require the exact requested project ID and reject a missing project ID. An intent without a thread mapping must reconcile exactly from a bounded recent listing (`limit <= 50`); if absent, halt rather than create again. Never trust a list summary. Neither `create_thread` nor `send_message_to_thread` accepts an idempotency argument. A setup-only `clientThreadId` must reconcile to exactly one marked thread; ambiguity halts. Use `createCodexCliTaskBridge` only with durable `loadJobState`/`saveJobState` callbacks from the exact target worktree. Persist scope-bound launching before spawn and running/terminal afterward; a fresh process seeing launching/running without a locally owned job must fail closed and never respawn.
5. Pass the ledger boundary to `runAgentGraphWithCodex`. Use `workspace-write` only for local files named by `allowedFiles`; use read-only mode for inspection/verifier work.
6. Inject one privileged in-process lifecycle supervisor through one long-lived Python bridge. Import the official `mcp_server.py` module exactly once; do not launch a process per operation.
7. Do not use generic or public MCP for capability-bearing lifecycle operations. Do not start an MCP subprocess. Do not edit the lifecycle database manually or directly. The worker never receives the lease capability; the supervisor keeps it in private memory and never prints, persists, evidences, or returns it.
8. For a recoverable needs-attention executor, derive assignment/thread/worker/actor/session from the authoritative wave plus attached host task. Require strict JSON registry and content-addressed recovery audit paths under the trusted agentgraph root (`dev/agentgraph`), exact current-registry binding, a clean governed worktree, and checkpoint head as an ancestor of current HEAD.
9. Resume the same attached task with no duplicate executor and preserve the same lease/base head. Rotate only the capability hash and expiry and append the public controller-resume event.
    A needs-attention attachment requires injected `activateTask`, but the worker must not be activated yet. Persist its opaque activation ID as `pending`, privately resume the lifecycle while the worktree is clean, and persist the public lifecycle resume receipt before activation. If resume or that save fails, send zero messages. Before the only permitted send, persist activation as `attempted`; any restart from `attempted` is reconcile-only and never resends. A same-process retry reuses the owned supervisor receipt; a new process blocked by the unexpired lease halts and never activates. Only with live supervisor ownership may the host prefix the exact generated prompt with `agentgraph-activation:<activationId>` and send it to the same thread/host. Count exact marker occurrences in canonical user-message text: exactly one means activated, zero during reconcile-only halts, and more than one is ambiguous and halts. Persist the marker turn as `baselineTurnId`; every restart reconciles that exact marker and turn before waiting. Collection watches that exact turn until completed and accepts exactly one `agentMessage` with phase `final_answer`; commentary and stale terminal turns are never callbacks.
10. Configure `heartbeatIntervalMs` below `leaseTtlSeconds * 1000`. One controller-owned, serialized, unref'd background loop renews continuously from private resume through public receipt persistence, activation, executor wait, telemetry, verifier create/persistence/wait, finalization, and final snapshot save. Every phase races the heartbeat failure signal. A renewal failure steers the same attached task once, durably records one terminal halt, and never creates a replacement executor.
    Canonical telemetry uses host-derived metrics, and completion occurs only after the independent verifier passes.
11. Accept only a strict JSON completion callback bound to the node, assignment, and worker IDs. Require a non-empty artifact ID and explicit `productionSideEffects: false` plus `providerMutations: false`.
12. Launch a separate verifier worker for the emitted verifier assignment. Require its callback to bind the completion artifact ID.
13. Before lifecycle DB completion, persist `lifecycleFinalization.phase = "prepared"` with the exact program/checkpoint/node, host-owned completion and handoff specification, verifier assignment/callback, completed candidate state, dependency-unlocked successor assignment IDs (or explicit terminal-no-successor contract), and SHA-256. Add that SHA-256 as `agentgraph-finalization` completion evidence. Completion must use the immutable journal-bound specification, never a later mutable recovery object.
14. After idempotent DB completion, validate that the public receipt matches the exact program/checkpoint/node, completed checkpoint and handoff stages, handoff/next-node/next-stage, summary, normalized blockers, exact prepared plus verification/finalization evidence, `to_role`, and finalization hash; then persist `phase = "finalized"`. Launch successors only after that finalized snapshot succeeds. On restart, pass `resumeSnapshot`; restore the saved execution state and completed tasks, reattach only durable running executor/verifier assignments, and never redispatch, replay completion/telemetry, or create a replacement worker. A nonterminal snapshot without an active assignment halts as inconsistent. Reconcile prepared completion by exact program/checkpoint/node/finalization hash through the same Python bridge and never re-release a completed node.
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

The controller concretely creates one long-lived Python lifecycle bridge and passes it with host-owned recovery into the attached-host runner. A thrown run retains that same bridge: do not close on exception; retry or reconcile through the same controller first. `close({terminalPreserved: true})` accepts an exact finalized journal, or complete/halted state with no unresolved lifecycle. A merely prepared journal is not close-safe: the controller must reconcile exact DB completion, validate the receipt, and durably persist the finalized journal before closing. Incomplete reconciliation or persistence failure keeps the same bridge open for retry.

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
