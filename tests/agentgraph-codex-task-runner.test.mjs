import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import { createAgentGraphExecutionState } from '../scripts/lib/agentgraph-execution-dispatcher.mjs';
import { createCodexCliTaskBridge } from '../scripts/lib/agentgraph-codex-cli-bridge.mjs';
import {
  createCodexAppTaskBridge,
  createCodexAssignmentPrompt,
  parseCodexAssignmentCallback,
  runAgentGraphWithCodex,
  runAuthoritativeLedgerWaveWithAttachedHostTasks,
} from '../scripts/lib/agentgraph-codex-task-runner.mjs';
import * as taskRunner from '../scripts/lib/agentgraph-codex-task-runner.mjs';

function proofGraph() {
  return {
    nodes: ['READ-PACKAGE', 'READ-GRAPH'].map((id) => ({
      id,
      title: id,
      dependsOn: [],
      objective: `Collect read-only evidence for ${id}.`,
      permissions: ['repository:read'],
      outputs: [`artifact:${id}`],
      verification: {
        independent: true,
        requiredEvidence: ['read-only repository evidence'],
        successCondition: 'Evidence matches the repository.',
      },
    })),
  };
}

function dependentProofGraph() {
  const result = proofGraph();
  result.nodes[0].id = 'A';
  result.nodes[0].title = 'A';
  result.nodes[0].objective = 'Complete A.';
  result.nodes[0].outputs = ['artifact:A'];
  result.nodes[1].id = 'B';
  result.nodes[1].title = 'B';
  result.nodes[1].objective = 'Complete B after A.';
  result.nodes[1].dependsOn = ['A'];
  result.nodes[1].outputs = ['artifact:B'];
  return result;
}

function workers() {
  return [
    { id: 'codex-executor-1', capabilities: ['execute'] },
    { id: 'codex-executor-2', capabilities: ['execute'] },
    { id: 'codex-verifier-1', capabilities: ['verify'] },
    { id: 'codex-verifier-2', capabilities: ['verify'] },
  ];
}

function attachedLedgerInput() {
  return {
    source: {
      kind: 'authoritative-lifecycle-ledger',
      ledgerId: 'governed-execution',
      revision: 'handoff-1@head-1',
    },
    completedNodeIds: ['FOUNDATION'],
    target: {
      worktreePath: 'C:\\repo\\governed-worktree',
      environment: 'local',
    },
    boundary: {
      allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
      allowReadOnlyProductionMetadata: true,
      allowPreviewDeployments: true,
      allowTestSandboxIntegrations: true,
      allowProductionMutations: false,
    },
    workers: [
      { id: 'executor-1', capabilities: ['execute'] },
      { id: 'verifier-1', capabilities: ['verify'] },
    ],
    maxConcurrentExecutors: 1,
    readyNodes: [
      {
        id: 'SAFE',
        title: 'Safe governed node',
        objective: 'Produce and independently verify local evidence.',
        dependsOn: ['FOUNDATION'],
        permissions: ['repository:read', 'repository:write'],
        lifecycle: { authoritative: true, status: 'ready', attempt: 1 },
        verification: {
          independent: true,
          requiredEvidence: ['focused tests'],
          successCondition: 'The local evidence passes.',
        },
      },
    ],
  };
}

function attachedExecutor() {
  return {
    assignmentId: 'assignment:SAFE:1:executor',
    threadId: 'thread-existing-executor',
    hostId: 'local',
    cursor: 'cursor-executor-1',
    role: 'executor',
    status: 'running',
  };
}

function lifecycleResumeReceipt(binding) {
  return {
    request_sha256: '1'.repeat(64),
    generation: binding.generation,
    event: {
      event_type: 'writer_lease_controller_resumed',
      event_hash: '2'.repeat(64),
      payload: {
        program_id: binding.program_id,
        checkpoint_id: binding.checkpoint_id,
        node_id: binding.node_id,
        assignment_id: binding.assignment_id,
        thread_id: binding.thread_id,
        worker_id: binding.worker_id,
        actor: binding.actor,
        session_id: binding.session_id,
        registry_sha256: binding.registry_sha256,
        recovery_audit_sha256: binding.recovery_audit_sha256,
        recovery_id: binding.recovery_id,
        generation: binding.generation,
        request_sha256: '1'.repeat(64),
      },
    },
  };
}

async function activateAttachedTask(args) {
  return {
    activationId: args.activationId,
    activationMarker: `agentgraph-activation:${args.activationId}`,
    baselineTurnId: `turn:${args.activationId}`,
    status: 'activated',
  };
}

function directLifecycleBinding(nodeId = 'A', nextNode = 'B') {
  return {
    programId: 'program-proof',
    checkpointId: `checkpoint-${nodeId}`,
    nodeId,
    completionSpec: {
      evidence: [],
      completed_stage: `stage:${nodeId}:verify`,
      handoff_id: `handoff-${nodeId}`,
      next_node: nextNode,
      next_stage: `stage:${nextNode}:plan`,
      summary: `${nodeId} verified.`,
      blockers: [],
      to_role: nextNode ? 'executor' : null,
    },
  };
}

function completionReceiptFor(finalization) {
  const lifecycle = finalization.lifecycle;
  const spec = lifecycle.completionSpec;
  const evidence = [
    ...(spec.evidence || []),
    {
      kind: 'agentgraph-verification',
      assignmentId: finalization.verifierAssignment.id,
      artifactId: finalization.verification.artifactId,
      evidence: structuredClone(finalization.verification.evidence || []),
    },
    { kind: 'agentgraph-finalization', sha256: finalization.sha256 },
  ];
  return {
    checkpoint: {
      event_type: 'checkpoint_completed',
      program_id: lifecycle.programId,
      checkpoint_id: lifecycle.checkpointId,
      node_id: lifecycle.nodeId,
      stage_id: spec.completed_stage,
      payload: {
        evidence,
      },
    },
    handoff: {
      handoff_id: spec.handoff_id,
      program_id: lifecycle.programId,
      checkpoint_id: lifecycle.checkpointId,
      node_id: lifecycle.nodeId,
      stage_id: spec.completed_stage,
      next_node: spec.next_node,
      next_stage: spec.next_stage,
      summary: spec.summary,
      blockers_json: JSON.stringify(spec.blockers || []),
      evidence_json: JSON.stringify(evidence),
      to_role: spec.to_role ?? null,
    },
  };
}

function emptyAppLaunchPersistence() {
  return {
    loadLaunchMapping: async () => null,
    saveLaunchMapping: async () => {},
  };
}

function cliJobPersistence(store = new Map()) {
  return {
    store,
    loadJobState: async (key) => store.get(key) || null,
    saveJobState: async (key, value) =>
      store.set(key, structuredClone(value)),
  };
}

function preparedFinalizationFor(nodeId = 'A', nextNode = 'B') {
  const state = createAgentGraphExecutionState({
    nodes: [{ id: nodeId, dependsOn: [] }, { id: nextNode, dependsOn: [nodeId] }],
  });
  state.status = 'running';
  state.nodes[nodeId].status = 'completed';
  state.nodes[nextNode].status = 'assigned';
  const verifierAssignment = {
    id: `assignment:${nodeId}:1:verifier`,
    nodeId,
    workerId: 'codex-verifier-1',
    role: 'verifier',
    artifactId: `artifact:${nodeId}:1`,
  };
  const successor = {
    id: `assignment:${nextNode}:1:executor`,
    nodeId: nextNode,
    workerId: 'codex-executor-1',
    role: 'executor',
  };
  const exact = {
    nodeId,
    verifierAssignment,
    verification: {
      kind: 'verification',
      nodeId,
      assignmentId: verifierAssignment.id,
      workerId: verifierAssignment.workerId,
      artifactId: verifierAssignment.artifactId,
      passed: true,
      evidence: ['independent verification'],
      errors: [],
    },
    lifecycle: directLifecycleBinding(nodeId, nextNode),
    candidate: {
      state,
      assignments: [successor],
      successorAssignmentIds: [successor.id],
      successorContract: {
        kind: 'candidate-successor',
        assignmentId: successor.id,
        nodeId: nextNode,
      },
    },
  };
  return {
    schemaVersion: '1.0.0',
    phase: 'prepared',
    ...exact,
    sha256: createHash('sha256').update(JSON.stringify(exact)).digest('hex'),
  };
}

test('authoritative wave rejects executable nodes without mandatory independent verification', () => {
  const ledgerInput = attachedLedgerInput();
  ledgerInput.readyNodes[0].verification.independent = false;

  assert.throws(
    () => taskRunner.buildAuthoritativeLedgerWave(ledgerInput),
    /independent verification/i,
  );
});

test('prompt and callback preserve immutable assignment identity', () => {
  const graph = proofGraph();
  const state = createAgentGraphExecutionState(graph);
  const assignment = {
    id: 'assignment:READ-PACKAGE:1:executor',
    nodeId: 'READ-PACKAGE',
    workerId: 'codex-executor-1',
    role: 'executor',
  };
  const prompt = createCodexAssignmentPrompt({ graph, state, assignment });
  assert.match(prompt, /Return exactly one JSON object and no markdown/);
  assert.match(prompt, /"productionActions": false/);

  const callback = parseCodexAssignmentCallback(
    JSON.stringify({
      kind: 'completion',
      nodeId: assignment.nodeId,
      assignmentId: assignment.id,
      workerId: assignment.workerId,
      artifact: {
        id: 'artifact:READ-PACKAGE:1',
        evidence: ['read-only repository evidence'],
        productionSideEffects: false,
        providerMutations: false,
      },
    }),
    assignment,
  );
  assert.equal(callback.artifact.id, 'artifact:READ-PACKAGE:1');
});

test('prompt requires the privileged in-process lifecycle supervisor', () => {
  const graph = proofGraph();
  const state = createAgentGraphExecutionState(graph);
  const assignment = {
    id: 'assignment:READ-PACKAGE:1:executor',
    nodeId: 'READ-PACKAGE',
    workerId: 'codex-executor-1',
    role: 'executor',
  };

  const prompt = createCodexAssignmentPrompt({ graph, state, assignment });

  assert.match(prompt, /privileged.*in-process lifecycle supervisor/i);
  assert.match(prompt, /import .*mcp_server\.py.*exactly once/i);
  assert.match(prompt, /do not start an MCP subprocess/i);
  assert.match(prompt, /do not edit the lifecycle database/i);
  assert.match(prompt, /generic.*public MCP.*capability-bearing/i);
  assert.match(prompt, /worker never receives.*lease capability/i);
  assert.match(prompt, /resume.*same attached task.*no duplicate executor/i);
  assert.match(prompt, /serially renews.*interval.*lease TTL/i);
  assert.match(prompt, /prepared finalization.*DB completion.*successor launch/i);
  assert.match(prompt, /one long-lived.*bridge.*not.*per operation/i);
  assert.match(prompt, /trusted.*agentgraph root/i);
  assert.match(prompt, /clean.*checkpoint head.*ancestor/i);
  assert.match(prompt, /host-derived metrics.*completion.*after.*verifier.*passes/i);
});

test('wave skill carries the privileged lifecycle supervisor contract', () => {
  const skill = readFileSync(
    '.agents/skills/agentgraph-wave-execution/SKILL.md',
    'utf8',
  );
  const mirror = readFileSync(
    '.github/skills/agentgraph-wave-execution/SKILL.md',
    'utf8',
  );
  const recipe = readFileSync(
    '.agents/skills/agentgraph-wave-execution/scripts/run-governed-wave.mjs',
    'utf8',
  );
  const recipeMirror = readFileSync(
    '.github/skills/agentgraph-wave-execution/scripts/run-governed-wave.mjs',
    'utf8',
  );

  assert.equal(mirror, skill);
  assert.equal(recipeMirror, recipe);
  assert.match(skill, /privileged.*in-process lifecycle supervisor/i);
  assert.match(skill, /import .*mcp_server\.py.*exactly once/i);
  assert.match(skill, /do not start an MCP subprocess/i);
  assert.match(skill, /do not edit the lifecycle database/i);
  assert.match(skill, /generic.*public MCP.*capability-bearing/i);
  assert.match(skill, /worker never receives.*lease capability/i);
  assert.match(skill, /resume.*same attached task.*no duplicate executor/i);
  assert.match(skill, /heartbeatIntervalMs.*leaseTtlSeconds/i);
  assert.match(skill, /Before lifecycle DB completion.*prepared/i);
  assert.match(skill, /phase = "finalized".*successor/i);
  assert.match(skill, /resumeSnapshot.*exact.*finalization hash/i);
  assert.match(recipe, /createAuthoritativeLedgerWavePythonLifecycleController/);
  assert.match(skill, /one long-lived.*bridge.*not.*per operation/i);
  assert.match(skill, /trusted.*agentgraph root/i);
  assert.match(skill, /clean.*checkpoint head.*ancestor/i);
  assert.match(skill, /host-derived metrics.*completion.*after.*verifier.*passes/i);
  assert.match(skill, /list_threads.*limit <= 50/i);
  assert.match(skill, /bootstrap marker.*read_thread/i);
  assert.match(skill, /send_message_to_thread.*idempotency/i);
  assert.match(skill, /baselineTurnId.*exact turn.*completed/i);
  assert.match(skill, /merely prepared journal is not close-safe/i);
  assert.match(skill, /launch intent.*before.*create_thread/i);
  assert.match(skill, /resume.*clean.*persist.*receipt.*before.*activation/i);
  assert.match(skill, /loadJobState.*saveJobState.*fail closed/i);
});

test('governed wave controller retains one bridge until recovery state is durably preserved', async () => {
  const { createGovernedAgentGraphWaveController } = await import(
    '../.agents/skills/agentgraph-wave-execution/scripts/run-governed-wave.mjs'
  );
  let bridgeCreates = 0;
  let closes = 0;
  let runs = 0;
  let failSave = true;
  const controller = createGovernedAgentGraphWaveController({
    pythonLifecycle: {},
    taskControl: { async activateTask() {} },
    createLifecycleBridge() {
      bridgeCreates += 1;
      return {
        async close() {
          closes += 1;
        },
      };
    },
    async runWave({ saveState }) {
      runs += 1;
      await saveState({
        executionState: { status: 'halted' },
        taskRegistry: {},
      });
      return { status: 'halted' };
    },
    async saveState() {
      if (failSave) throw new Error('durable save failed');
    },
  });

  await assert.rejects(() => controller.close({ terminalPreserved: true }), /before terminal/);
  await assert.rejects(() => controller.run(), /durable save failed/);
  assert.equal(closes, 0);
  failSave = false;
  assert.equal((await controller.run()).status, 'halted');
  await controller.close({ terminalPreserved: true });
  await controller.close({ terminalPreserved: true });
  assert.equal(bridgeCreates, 1);
  assert.equal(runs, 2);
  assert.equal(closes, 1);
});

test('retained controller refuses incomplete prepared close and finalizes exact DB reconciliation before closing', async () => {
  const prepared = preparedFinalizationFor();
  const persisted = [];
  let completed = false;
  let failFinalizedSave = true;
  let closes = 0;
  let reconciliations = 0;
  const controller =
    taskRunner.createAuthoritativeLedgerWavePythonLifecycleController({
      pythonLifecycle: {},
      createLifecycleBridge() {
        return {
          async reconcileAttachedCheckpointCompletion(binding, request) {
            reconciliations += 1;
            assert.deepEqual(binding, {
              program_id: prepared.lifecycle.programId,
              checkpoint_id: prepared.lifecycle.checkpointId,
              node_id: prepared.nodeId,
            });
            assert.equal(request.finalizationSha256, prepared.sha256);
            return completed
              ? { completed: true, receipt: completionReceiptFor(prepared) }
              : { completed: false, receipt: null };
          },
          async close() {
            closes += 1;
          },
        };
      },
      async runWave({ saveState }) {
        await saveState({
          executionState: { status: 'halted' },
          taskRegistry: {},
          lifecycleFinalization: prepared,
        });
        return { status: 'halted' };
      },
      async saveState(snapshot) {
        if (
          failFinalizedSave &&
          snapshot.lifecycleFinalization?.phase === 'finalized'
        ) {
          throw new Error('finalized persistence failed');
        }
        persisted.push(structuredClone(snapshot));
      },
    });
  await controller.run();
  await assert.rejects(
    () => controller.close({ terminalPreserved: true }),
    /prepared completion is unresolved/i,
  );
  assert.equal(closes, 0);
  completed = true;
  await assert.rejects(
    () => controller.close({ terminalPreserved: true }),
    /finalized persistence failed/i,
  );
  assert.equal(closes, 0);
  failFinalizedSave = false;
  await controller.close({ terminalPreserved: true });
  assert.equal(closes, 1);
  assert.equal(reconciliations, 3);
  assert.equal(persisted.at(-1).lifecycleFinalization.phase, 'finalized');
  assert.equal(
    persisted.at(-1).lifecycleFinalization.completionReceipt.handoff.next_node,
    'B',
  );
});

test('Codex app bridge maps create_thread and read_thread results to assignment callbacks', async () => {
  const calls = [];
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    createThread: async (request) => {
      calls.push(['create', request]);
      return JSON.stringify({ threadId: 'thread-live-1', hostId: 'local' });
    },
    readThread: async (request) => {
      calls.push(['read', request]);
      return {
        thread: { id: 'thread-live-1', projectId: 'project-1', status: { type: 'idle' } },
        turns: [
          {
            id: 'turn-1',
            status: 'completed',
            items: [{ type: 'agentMessage', text: '{"kind":"completion"}' }],
          },
        ],
      };
    },
  });
  const task = await bridge.createTask({
    prompt: 'assignment prompt',
    target: { type: 'project', projectId: 'project-1', environment: { type: 'local' } },
    idempotencyKey: 'assignment:A:1:executor',
  });
  const outcome = await bridge.waitForAny([
    {
      assignmentId: 'assignment:A:1:executor',
      threadId: task.threadId,
      hostId: task.hostId,
    },
  ]);

  assert.deepEqual(task, {
    threadId: 'thread-live-1',
    hostId: 'local',
    bootstrapTag: 'agentgraph-assignment:assignment:A:1:executor',
  });
  assert.deepEqual(outcome, {
    assignmentId: 'assignment:A:1:executor',
    status: 'completed',
    final: '{"kind":"completion"}',
    cursor: null,
  });
  assert.equal(calls[0][0], 'create');
  assert.equal('idempotencyKey' in calls[0][1], false);
  assert.equal(calls[1][0], 'read');
});

test('Codex app bridge requires read_thread even when wait_threads exists', () => {
  assert.throws(
    () =>
      createCodexAppTaskBridge({
        ...emptyAppLaunchPersistence(),
        async createThread() {},
        async waitThreads() {},
      }),
    /read.*required/i,
  );
});

test('Codex app bridge falls back to bounded recent threads and validates the exact bootstrap marker', async () => {
  const listCalls = [];
  let creates = 0;
  const saved = [];
  const bootstrapTag =
    'agentgraph-assignment:assignment:SAFE:1:executor';
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      creates += 1;
      throw new Error('existing tagged thread must be reused');
    },
    async listThreads(request) {
      listCalls.push(request);
      if ('query' in request) throw new Error('Unrecognized key: query');
      return {
        threads: [
          {
            id: 'thread-existing',
            projectId: 'project-safe',
            hostId: 'local',
            summary: 'untrusted summary without the marker',
          },
        ],
      };
    },
    async readThread() {
      return {
        thread: {
          id: 'thread-existing',
          projectId: 'project-safe',
          status: { type: 'idle' },
        },
        turns: [
          {
            id: 'turn-bootstrap',
            status: 'completed',
            items: [{ type: 'userMessage', text: `${bootstrapTag}\nwork` }],
          },
        ],
      };
    },
    async saveLaunchMapping(key, mapping) {
      saved.push([key, mapping]);
    },
    timeoutMs: 1,
    pollIntervalMs: 0,
  });

  const task = await bridge.createTask({
    prompt: 'work',
    target: { projectId: 'project-safe' },
    idempotencyKey: 'assignment:SAFE:1:executor',
  });

  assert.equal(task.threadId, 'thread-existing');
  assert.equal(creates, 0);
  assert.deepEqual(listCalls, [
    { query: bootstrapTag, limit: 50 },
    { limit: 50 },
  ]);
  assert.equal(saved.length, 1);
});

test('Codex app bridge reconciles setup-only create responses and rejects ambiguous tags', async () => {
  const bootstrapTag =
    'agentgraph-assignment:assignment:SAFE:1:executor';
  let listed = 0;
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread(request) {
      assert.equal('idempotencyKey' in request, false);
      return { clientThreadId: 'client-setup-only' };
    },
    async listThreads(request) {
      listed += 1;
      if ('query' in request) throw new Error('Unrecognized key: query');
      if (listed < 4) return { threads: [] };
      return {
        threads: [
          { id: 'thread-reconciled', projectId: 'project-safe', hostId: 'local' },
        ],
      };
    },
    async readThread() {
      return {
        thread: { id: 'thread-reconciled', projectId: 'project-safe' },
        turns: [
          {
            id: 'turn-bootstrap',
            items: [{ type: 'userMessage', text: bootstrapTag }],
          },
        ],
      };
    },
    timeoutMs: 1,
    pollIntervalMs: 0,
    reconciliationAttempts: 3,
  });
  const task = await bridge.createTask({
    prompt: 'work',
    target: { projectId: 'project-safe' },
    idempotencyKey: 'assignment:SAFE:1:executor',
  });
  assert.equal(task.threadId, 'thread-reconciled');

  const ambiguous = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      throw new Error('must not create');
    },
    async listThreads(request) {
      if ('query' in request) throw new Error('Unrecognized key: query');
      return {
        threads: [
          { id: 'thread-1', projectId: 'project-safe' },
          { id: 'thread-2', projectId: 'project-safe' },
        ],
      };
    },
    async readThread({ threadId }) {
      return {
        thread: { id: threadId, projectId: 'project-safe' },
        turns: [
          {
            id: `turn-${threadId}`,
            items: [{ type: 'userMessage', text: bootstrapTag }],
          },
        ],
      };
    },
    timeoutMs: 1,
    pollIntervalMs: 0,
  });
  await assert.rejects(
    () =>
      ambiguous.createTask({
        prompt: 'work',
        target: { projectId: 'project-safe' },
        idempotencyKey: 'assignment:SAFE:1:executor',
      }),
    /ambiguous.*bootstrap tag/i,
  );
});

test('Codex app bridge never recreates an unreconciled durable launch intent', async () => {
  const durable = new Map();
  let creates = 0;
  const persistence = {
    async loadLaunchMapping(key) {
      return durable.get(key) || null;
    },
    async saveLaunchMapping(key, value) {
      durable.set(key, structuredClone(value));
    },
  };
  const makeBridge = () =>
    createCodexAppTaskBridge({
      ...persistence,
      async createThread() {
        creates += 1;
        throw new Error('create response lost after launch');
      },
      async listThreads() {
        return { threads: [] };
      },
      async readThread() {
        throw new Error('no candidate thread should be read');
      },
      timeoutMs: 1,
      pollIntervalMs: 0,
    });
  const request = {
    prompt: 'work',
    target: { projectId: 'project-safe' },
    idempotencyKey: 'assignment:SAFE:1:executor',
  };
  await assert.rejects(
    () => makeBridge().createTask(request),
    /create response lost after launch/i,
  );
  assert.equal(
    durable.get(request.idempotencyKey).status,
    'launching',
  );
  await assert.rejects(
    () => makeBridge().createTask(request),
    /unreconciled.*launch intent/i,
  );
  assert.equal(creates, 1);
});

test('Codex app durable mapping requires the exact immutable scope and project-bound marked thread', async () => {
  const key = 'agentgraph-scope:scope-safe';
  const marker = `agentgraph-assignment:${key}`;
  const makeBridge = (durable, readThread) =>
    createCodexAppTaskBridge({
      async loadLaunchMapping() {
        return durable;
      },
      async saveLaunchMapping() {},
      async createThread() {
        throw new Error('durable mapping must not create');
      },
      readThread,
    });
  await assert.rejects(
    () =>
      makeBridge(
        {
          status: 'mapped',
          threadId: 'thread-safe',
          bootstrapTag: marker,
          scopeHash: 'scope-old',
        },
        async () => ({}),
      ).createTask({
        prompt: 'work',
        target: { projectId: 'project-safe' },
        idempotencyKey: key,
        scopeHash: 'scope-new',
      }),
    /scope does not match/i,
  );
  await assert.rejects(
    () =>
      makeBridge(
        {
          status: 'mapped',
          threadId: 'thread-safe',
          bootstrapTag: marker,
          scopeHash: 'scope-safe',
        },
        async () => ({
          thread: { id: 'thread-safe' },
          turns: [
            {
              id: 'turn-bootstrap',
              items: [{ type: 'userMessage', text: `${marker}\nwork` }],
            },
          ],
        }),
      ).createTask({
        prompt: 'work',
        target: { projectId: 'project-safe' },
        idempotencyKey: key,
        scopeHash: 'scope-safe',
      }),
    /project does not match/i,
  );
});

test('Codex app activation waits for the marked turn to complete and ignores the stale prior turn', async () => {
  const reads = [];
  const sends = [];
  const responses = [
    {
      turns: [
        {
          id: 'turn-old',
          status: 'completed',
          items: [{ type: 'agentMessage', text: '{"stale":true}' }],
        },
      ],
    },
    {
      turns: [
        {
          id: 'turn-activation',
          status: 'inProgress',
          items: [
            {
              type: 'userMessage',
              text: 'agentgraph-activation:activation-safe\nwork',
            },
          ],
        },
        {
          id: 'turn-old',
          status: 'completed',
          items: [{ type: 'agentMessage', text: '{"stale":true}' }],
        },
      ],
    },
    {
      thread: { id: 'thread-existing', status: { type: 'active' } },
      turns: [
        {
          id: 'turn-activation',
          status: 'inProgress',
          items: [
            {
              type: 'userMessage',
              text: 'agentgraph-activation:activation-safe\nactivation prompt',
            },
          ],
        },
        {
          id: 'turn-old',
          status: 'completed',
          items: [{ type: 'agentMessage', text: '{"stale":true}' }],
        },
      ],
    },
    {
      thread: { id: 'thread-existing', status: { type: 'idle' } },
      turns: [
        {
          id: 'turn-activation',
          status: 'completed',
          items: [
            {
              type: 'userMessage',
              text: 'agentgraph-activation:activation-safe\nactivation prompt',
            },
            { type: 'agentMessage', phase: 'commentary', text: 'still working' },
            {
              type: 'agentMessage',
              phase: 'final_answer',
              text: '{"fresh":true}',
            },
          ],
        },
        {
          id: 'turn-old',
          status: 'completed',
          items: [{ type: 'agentMessage', text: '{"stale":true}' }],
        },
      ],
    },
  ];
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      throw new Error('not used');
    },
    async readThread(request) {
      reads.push(request);
      return responses.shift();
    },
    async sendMessageToThread(request) {
      sends.push(request);
      assert.equal('idempotencyKey' in request, false);
      return { accepted: true };
    },
    timeoutMs: 100,
    pollIntervalMs: 0,
  });
  const activation = await bridge.activateTask({
    threadId: 'thread-existing',
    hostId: 'local',
    prompt: 'work',
    activationId: 'activation-safe',
  });
  assert.equal(activation.baselineTurnId, 'turn-activation');
  assert.equal(sends.length, 1);
  assert.match(sends[0].prompt, /^agentgraph-activation:activation-safe\n/);

  const outcome = await bridge.waitForAny([
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing',
      hostId: 'local',
      baselineTurnId: activation.baselineTurnId,
      activationMarker: activation.activationMarker,
    },
  ]);
  assert.equal(reads.length, 4);
  assert.deepEqual(outcome, {
    assignmentId: 'assignment:SAFE:1:executor',
    status: 'completed',
    final: '{"fresh":true}',
    cursor: null,
  });
});

test('Codex app activation recovery never resends an existing marker', async () => {
  let sends = 0;
  const marker = 'agentgraph-activation:activation-safe';
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      throw new Error('not used');
    },
    async readThread() {
      return {
        turns: [
          {
            id: 'turn-activation',
            items: [{ type: 'userMessage', text: `${marker}\nwork` }],
          },
        ],
      };
    },
    async sendMessageToThread() {
      sends += 1;
    },
    timeoutMs: 1,
  });
  const receipt = await bridge.activateTask({
    threadId: 'thread-existing',
    prompt: 'work',
    activationId: 'activation-safe',
  });
  assert.equal(receipt.recovered, true);
  assert.equal(receipt.baselineTurnId, 'turn-activation');
  assert.equal(sends, 0);
});

test('Codex app activation is reconcile-only after an attempted send and rejects duplicate marker occurrences', async () => {
  let sends = 0;
  const marker = 'agentgraph-activation:activation-safe';
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      throw new Error('not used');
    },
    async readThread() {
      return {
        turns: [
          {
            id: 'turn-activation',
            items: [
              {
                type: 'userMessage',
                text: `${marker}\nwork\n${marker}`,
              },
            ],
          },
        ],
      };
    },
    async sendMessageToThread() {
      sends += 1;
    },
  });
  await assert.rejects(
    () =>
      bridge.activateTask({
        threadId: 'thread-existing',
        prompt: 'work',
        activationId: 'activation-safe',
        allowSend: false,
      }),
    /ambiguous.*activation marker/i,
  );
  assert.equal(sends, 0);
});

test('Codex app marked completion requires exactly one final_answer item on the baseline turn', async () => {
  const marker = 'agentgraph-activation:activation-safe';
  const responses = [
    {
      turns: [
        {
          id: 'turn-activation',
          status: 'completed',
          items: [
            { type: 'userMessage', text: `${marker}\nwork` },
            { type: 'agentMessage', phase: 'commentary', text: 'commentary' },
            { type: 'agentMessage', phase: 'final_answer', text: '{"ok":true}' },
            { type: 'agentMessage', phase: 'final_answer', text: '{"duplicate":true}' },
          ],
        },
      ],
    },
  ];
  const bridge = createCodexAppTaskBridge({
    ...emptyAppLaunchPersistence(),
    async createThread() {
      throw new Error('not used');
    },
    async readThread() {
      return responses.shift();
    },
  });
  const outcome = await bridge.waitForAny([
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing',
      baselineTurnId: 'turn-activation',
      activationMarker: marker,
    },
  ]);
  assert.equal(outcome.status, 'failed');
  assert.match(outcome.error, /exactly one.*final/i);
});

test('Codex CLI bridge reuses one stable assignment process and cached outcome', async () => {
  let spawns = 0;
  let outputPath;
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = { end() {} };
  child.kill = () => true;
  const persistence = cliJobPersistence();
  const bridge = createCodexCliTaskBridge({
    ...persistence,
    cwd: 'C:\\repo',
    command: 'codex',
    commandPrefix: [],
    spawnProcess(_command, args) {
      spawns += 1;
      outputPath = args[args.indexOf('--output-last-message') + 1];
      return child;
    },
  });
  const assignment = { id: 'assignment:SAFE:1:executor' };
  const first = await bridge.createTask({
    assignment,
    prompt: 'work',
    idempotencyKey: assignment.id,
  });
  const second = await bridge.createTask({
    assignment,
    prompt: 'work again',
    idempotencyKey: assignment.id,
  });
  assert.deepEqual(second, first);
  assert.equal(spawns, 1);
  writeFileSync(outputPath, '{"kind":"completion"}');
  child.emit('close', 0);
  const outcome1 = await bridge.waitForAny([
    { assignmentId: assignment.id, threadId: first.threadId },
  ]);
  const outcome2 = await bridge.waitForAny([
    { assignmentId: assignment.id, threadId: first.threadId },
  ]);
  assert.deepEqual(outcome2, outcome1);
});

test('fresh Codex CLI bridge refuses to duplicate a durably running assignment', async () => {
  const persistence = cliJobPersistence();
  let firstSpawns = 0;
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = { end() {} };
  child.kill = () => true;
  const first = createCodexCliTaskBridge({
    ...persistence,
    cwd: 'C:\\repo',
    command: 'codex',
    commandPrefix: [],
    spawnProcess() {
      firstSpawns += 1;
      return child;
    },
  });
  const assignment = { id: 'assignment:SAFE:1:executor' };
  await first.createTask({
    assignment,
    prompt: 'work',
    idempotencyKey: assignment.id,
  });
  assert.equal(firstSpawns, 1);

  let duplicateSpawns = 0;
  const restarted = createCodexCliTaskBridge({
    ...persistence,
    cwd: 'C:\\repo',
    command: 'codex',
    commandPrefix: [],
    spawnProcess() {
      duplicateSpawns += 1;
      throw new Error('duplicate process must not spawn');
    },
  });
  await assert.rejects(
    () =>
      restarted.createTask({
        assignment,
        prompt: 'work',
        idempotencyKey: assignment.id,
      }),
    /durably running.*not locally owned/i,
  );
  assert.equal(duplicateSpawns, 0);
});

test('Python lifecycle bridge uses one long-lived supervisor process for all operations', async () => {
  let spawnCount = 0;
  const operations = [];
  const bridgeRequests = [];
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = {
    write(line) {
      const request = JSON.parse(line);
      bridgeRequests.push(request);
      operations.push(request.operation);
      const results = {
        resume: {
          request_sha256: '1'.repeat(64),
          generation: 1,
          event: {
            event_type: 'writer_lease_controller_resumed',
            event_hash: '2'.repeat(64),
          },
        },
        heartbeat: { event: { event_type: 'writer_lease_renewed' } },
        telemetry: { observation: { allowed: true } },
        completion: { event: { event_type: 'checkpoint_completed' } },
        reconcile: {
          completed: true,
          receipt: { checkpoint: { event_type: 'checkpoint_completed' } },
        },
        shutdown: { status: 'stopped' },
      };
      child.stdout.write(
        `${JSON.stringify({ id: request.id, ok: true, result: results[request.operation] })}\n`,
      );
      if (request.operation === 'shutdown') queueMicrotask(() => child.emit('exit', 0));
      return true;
    },
  };
  const bridge = taskRunner.createPythonLifecycleSupervisorBridge({
    pythonExecutable: 'C:\\Python\\python.exe',
    mcpServerPath: 'C:\\DEV\\dev\\mcp_server.py',
    databasePath: 'C:\\DEV\\dev\\graphify.db',
    trustedAgentGraphRoot: 'C:\\DEV\\dev\\agentgraph',
    spawnProcess() {
      spawnCount += 1;
      return child;
    },
  });

  await bridge.resumeAttachedCheckpoint({});
  await bridge.renewAttachedCheckpoint({});
  await bridge.recordAttachedTelemetryDecision({}, { metrics: { inputTokens: 1 } });
  await bridge.completeAttachedCheckpoint({}, {
    evidence: [],
    completed_stage: 'stage:verify',
    handoff_id: 'handoff-1',
    next_node: 'NODE-2',
    next_stage: 'stage:plan',
    summary: 'Verified.',
    blockers: [],
  });
  await bridge.reconcileAttachedCheckpointCompletion(
    { program_id: 'program-1', checkpoint_id: 'checkpoint-1', node_id: 'NODE-1' },
    { finalizationSha256: 'a'.repeat(64) },
  );
  await bridge.close();

  assert.equal(spawnCount, 1);
  assert.deepEqual(operations, [
    'resume',
    'heartbeat',
    'telemetry',
    'completion',
    'reconcile',
    'shutdown',
  ]);
  assert.deepEqual(
    bridgeRequests.find((request) => request.operation === 'reconcile').payload,
    { finalization_sha256: 'a'.repeat(64) },
  );
  assert.equal(JSON.stringify(operations).includes('capability'), false);
});

test('real Python bridge receives the exact canonical finalization SHA for reconciliation', async () => {
  const pythonExecutable = spawnSync('where.exe', ['python'], {
    encoding: 'utf8',
  }).stdout.trim().split(/\r?\n/)[0];
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-real-python-reconcile-'));
  const bridge = taskRunner.createPythonLifecycleSupervisorBridge({
    pythonExecutable,
    mcpServerPath: join(process.cwd(), '..', '..', 'dev', 'mcp_server.py'),
    databasePath: join(root, 'lifecycle.db'),
    trustedAgentGraphRoot: root,
  });
  const result = await bridge.reconcileAttachedCheckpointCompletion(
    { program_id: 'program-1', checkpoint_id: 'checkpoint-1', node_id: 'NODE-1' },
    { finalizationSha256: 'a'.repeat(64) },
  );
  await bridge.close();

  assert.deepEqual(result, { completed: false, receipt: null });
});

test('concrete Python lifecycle wave wrapper owns one bridge until terminal state is saved', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-python-wave-wrapper-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  const events = [];
  let bridgeCreates = 0;
  const controller =
    taskRunner.runAuthoritativeLedgerWaveWithPythonLifecycle({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        throw new Error('duplicate task must not be created');
      },
      async activateTask(args) {
        assert.match(args.prompt, /assignment:SAFE:1:executor/);
        assert.ok(events.at(-1).startsWith('save:'));
        events.push(`activate:${args.activationId}`);
        return activateAttachedTask(args);
      },
      async waitForAny() {
        return {
          assignmentId: 'assignment:SAFE:1:executor',
          status: 'needs_attention',
          error: 'bounded host stop',
        };
      },
    },
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
      heartbeatIntervalMs: 5,
      leaseTtlSeconds: 60,
    },
    pythonLifecycle: {
      pythonExecutable: 'C:\\Python\\python.exe',
      mcpServerPath: 'C:\\dev\\mcp_server.py',
      databasePath: 'C:\\dev\\graphify.db',
      trustedAgentGraphRoot: 'C:\\dev\\agentgraph',
    },
    createLifecycleBridge() {
      bridgeCreates += 1;
      return {
        async resumeAttachedCheckpoint(binding) {
          events.push('resume');
          return lifecycleResumeReceipt(binding);
        },
        async renewAttachedCheckpoint() {
          events.push('heartbeat');
          return { event: { event_type: 'writer_lease_renewed' } };
        },
        async close() {
          events.push('close');
        },
      };
    },
    saveState: async (snapshot) => {
      events.push(`save:${snapshot.executionState.status}`);
    },
    now: () => '2026-07-30T23:45:00.000Z',
  });
  const result = await controller.run();

  assert.equal(result.status, 'halted');
  assert.equal(bridgeCreates, 1);
  assert.ok(
    events.indexOf('resume') <
      events.findIndex((event) => event.startsWith('activate:')),
  );
  assert.equal(events.includes('close'), false);
  await assert.rejects(
    () => controller.close({ terminalPreserved: true }),
    /unresolved lifecycle/i,
  );
  assert.equal(events.includes('close'), false);
});

test('runner fans out, independently verifies, and completes two ready nodes', async () => {
  const graph = proofGraph();
  const queue = [];
  const launched = [];
  const snapshots = [];
  const codex = {
    async createTask({ assignment }) {
      launched.push(assignment);
      const threadId = `thread:${assignment.id}`;
      if (assignment.role === 'executor') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          final: JSON.stringify({
            kind: 'completion',
            nodeId: assignment.nodeId,
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifact: {
              id: `artifact:${assignment.nodeId}:1`,
              evidence: ['read-only repository evidence'],
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        });
      } else {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: assignment.nodeId,
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifactId: assignment.artifactId,
            passed: true,
            evidence: ['read-only repository evidence'],
            errors: [],
          }),
        });
      }
      return { threadId };
    },
    async waitForAny() {
      return queue.shift();
    },
  };

  const result = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: workers(),
    codex,
    target: { projectId: 'local-proof' },
    now: () => '2026-07-30T22:00:00.000Z',
    saveState: async (snapshot) => snapshots.push(snapshot),
  });

  assert.equal(result.status, 'complete');
  assert.equal(result.state.nodes['READ-PACKAGE'].status, 'completed');
  assert.equal(result.state.nodes['READ-GRAPH'].status, 'completed');
  assert.deepEqual(
    launched.filter((assignment) => assignment.role === 'executor').map((item) => item.nodeId).sort(),
    ['READ-GRAPH', 'READ-PACKAGE'],
  );
  assert.equal(launched.filter((assignment) => assignment.role === 'verifier').length, 2);
  assert.ok(snapshots.some((snapshot) => Object.keys(snapshot.tasks).length === 2));
  assert.equal(result.completedTasks.length, 4);
  assert.equal(result.completedTasks.every((task) => task.status === 'completed'), true);
  assert.equal(snapshots.at(-1).completedTasks.length, 4);
});

test('runner reattaches a durable executor after a controller crash without redispatching it', async () => {
  const graph = { nodes: [proofGraph().nodes[0]] };
  let snapshot;
  let executorCreates = 0;
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph,
        initialState: createAgentGraphExecutionState(graph),
        workers: workers(),
        codex: {
          async createTask({ assignment }) {
            executorCreates += 1;
            return { threadId: `thread:${assignment.id}` };
          },
          async waitForAny() {
            throw new Error('simulated executor controller crash');
          },
        },
        saveState: async (value) => {
          snapshot = structuredClone(value);
        },
      }),
    /simulated executor controller crash/,
  );
  assert.equal(executorCreates, 1);
  let reattachments = 0;
  let verifierCreates = 0;
  const result = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: workers(),
    resumeSnapshot: snapshot,
    codex: {
      async reattachTask({ assignment }) {
        reattachments += 1;
        return { threadId: `thread:${assignment.id}` };
      },
      async createTask({ assignment }) {
        verifierCreates += 1;
        return { threadId: `thread:${assignment.id}` };
      },
      async waitForAny(tasks) {
        const task = tasks[0];
        return task.assignmentId.endsWith(':executor')
          ? {
              assignmentId: task.assignmentId,
              status: 'completed',
              final: JSON.stringify({
                kind: 'completion',
                nodeId: 'READ-PACKAGE',
                assignmentId: task.assignmentId,
                workerId: 'codex-executor-1',
                artifact: {
                  id: 'artifact:READ-PACKAGE:1',
                  evidence: ['read'],
                  summary: 'done',
                  productionSideEffects: false,
                  providerMutations: false,
                },
              }),
            }
          : {
              assignmentId: task.assignmentId,
              status: 'completed',
              final: JSON.stringify({
                kind: 'verification',
                nodeId: 'READ-PACKAGE',
                assignmentId: task.assignmentId,
                workerId: 'codex-verifier-1',
                artifactId: 'artifact:READ-PACKAGE:1',
                passed: true,
                evidence: ['checked'],
                errors: [],
              }),
            };
      },
    },
  });
  assert.equal(result.status, 'complete');
  assert.equal(reattachments, 1);
  assert.equal(verifierCreates, 1);
  assert.equal(executorCreates, 1);
});

test('runner reattaches a durable verifier after a controller crash without replaying executor completion', async () => {
  const graph = { nodes: [proofGraph().nodes[0]] };
  let snapshot;
  let creates = 0;
  let waits = 0;
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph,
        initialState: createAgentGraphExecutionState(graph),
        workers: workers(),
        codex: {
          async createTask({ assignment }) {
            creates += 1;
            return { threadId: `thread:${assignment.id}` };
          },
          async waitForAny(tasks) {
            waits += 1;
            if (waits > 1) throw new Error('simulated verifier controller crash');
            const task = tasks[0];
            return {
              assignmentId: task.assignmentId,
              status: 'completed',
              final: JSON.stringify({
                kind: 'completion',
                nodeId: 'READ-PACKAGE',
                assignmentId: task.assignmentId,
                workerId: 'codex-executor-1',
                artifact: {
                  id: 'artifact:READ-PACKAGE:1',
                  evidence: ['read'],
                  summary: 'done',
                  productionSideEffects: false,
                  providerMutations: false,
                },
              }),
            };
          },
        },
        saveState: async (value) => {
          snapshot = structuredClone(value);
        },
      }),
    /simulated verifier controller crash/,
  );
  assert.equal(creates, 2);
  let reattachments = 0;
  const result = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: workers(),
    resumeSnapshot: snapshot,
    codex: {
      async reattachTask({ assignment }) {
        reattachments += 1;
        assert.equal(assignment.role, 'verifier');
        return { threadId: `thread:${assignment.id}` };
      },
      async createTask() {
        throw new Error('resume must not create another executor or verifier');
      },
      async waitForAny(tasks) {
        const task = tasks[0];
        return {
          assignmentId: task.assignmentId,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'READ-PACKAGE',
            assignmentId: task.assignmentId,
            workerId: 'codex-verifier-1',
            artifactId: 'artifact:READ-PACKAGE:1',
            passed: true,
            evidence: ['checked'],
            errors: [],
          }),
        };
      },
    },
  });
  assert.equal(result.status, 'complete');
  assert.equal(reattachments, 1);
  assert.equal(result.completedTasks.length, 2);
});

test('parallel launch persists each assignment mapping before the next create and retry reuses it', async () => {
  const graph = proofGraph();
  const physicalCreates = new Map();
  const mappings = new Map();
  const snapshots = [];
  let failSecond = true;
  const codex = {
    async createTask({ assignment, idempotencyKey }) {
      if (mappings.has(idempotencyKey)) return mappings.get(idempotencyKey);
      if (failSecond && mappings.size === 1) {
        throw new Error('second create transport failed');
      }
      physicalCreates.set(
        assignment.id,
        (physicalCreates.get(assignment.id) || 0) + 1,
      );
      const mapping = { threadId: `thread:${assignment.id}` };
      mappings.set(idempotencyKey, mapping);
      return mapping;
    },
    async waitForAny(tasks) {
      return {
        assignmentId: tasks[0].assignmentId,
        status: 'failed',
        error: 'bounded retry stop',
      };
    },
  };
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph,
        initialState: createAgentGraphExecutionState(graph),
        workers: workers(),
        codex,
        saveState: async (snapshot) =>
          snapshots.push(structuredClone(snapshot)),
      }),
    /second create transport failed/,
  );
  const [firstAssignmentId] = Object.keys(snapshots.at(-1).tasks);
  assert.equal(Object.keys(snapshots.at(-1).tasks).length, 1);
  assert.equal(
    snapshots.at(-1).tasks[firstAssignmentId].threadId,
    `thread:${firstAssignmentId}`,
  );

  failSecond = false;
  const retried = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: workers(),
    codex,
    saveState: async () => {},
  });
  assert.equal(retried.status, 'halted');
  assert.equal(physicalCreates.size, 2);
  assert.equal([...physicalCreates.values()].every((count) => count === 1), true);
});

test('runner derives different task keys for the same assignment in different immutable scopes', async () => {
  const graph = { nodes: [proofGraph().nodes[0]] };
  const keys = [];
  for (const revision of ['revision-a', 'revision-b']) {
    await runAgentGraphWithCodex({
      graph,
      initialState: createAgentGraphExecutionState(graph),
      workers: workers(),
      executionScope: {
        source: {
          kind: 'authoritative-lifecycle-ledger',
          ledgerId: 'ledger-safe',
          revision,
        },
      },
      target: {
        projectId: `project-${revision}`,
        worktreePath: 'C:\\repo\\safe',
      },
      codex: {
        async createTask({ assignment, idempotencyKey, scopeHash }) {
          keys.push({ idempotencyKey, scopeHash });
          return { threadId: `thread:${assignment.id}:${revision}` };
        },
        async waitForAny(tasks) {
          return {
            assignmentId: tasks[0].assignmentId,
            status: 'needs_attention',
            error: 'bounded scope proof',
          };
        },
      },
    });
  }
  assert.equal(keys.length, 2);
  assert.notEqual(keys[0].scopeHash, keys[1].scopeHash);
  assert.notEqual(keys[0].idempotencyKey, keys[1].idempotencyKey);
  assert.match(keys[0].idempotencyKey, /^agentgraph-scope:[0-9a-f]{64}$/);
});

test('attaches an existing executor and durably advances its cursor before launching a verifier', async () => {
  const created = [];
  const snapshots = [];
  const taskControl = {
    async createTask({ assignment }) {
      created.push(assignment);
      assert.equal(assignment.role, 'verifier');
      return {
        threadId: 'thread-new-verifier',
        hostId: 'local',
        cursor: 'cursor-verifier-1',
      };
    },
    async waitForAny(tasks) {
      const task = tasks[0];
      if (task.assignmentId === 'assignment:SAFE:1:executor') {
        assert.equal(task.threadId, 'thread-existing-executor');
        assert.equal(task.cursor, 'cursor-executor-1');
        return {
          assignmentId: task.assignmentId,
          status: 'completed',
          cursor: 'cursor-executor-2',
          final: JSON.stringify({
            kind: 'completion',
            nodeId: 'SAFE',
            assignmentId: task.assignmentId,
            workerId: 'executor-1',
            artifact: {
              id: 'artifact:SAFE:1',
              evidence: ['focused tests'],
              summary: 'Local implementation complete.',
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        };
      }
      assert.equal(task.assignmentId, 'assignment:SAFE:1:verifier');
      return {
        assignmentId: task.assignmentId,
        status: 'completed',
        cursor: 'cursor-verifier-2',
        final: JSON.stringify({
          kind: 'verification',
          nodeId: 'SAFE',
          assignmentId: task.assignmentId,
          workerId: 'verifier-1',
          artifactId: 'artifact:SAFE:1',
          passed: true,
          evidence: ['focused tests independently rerun'],
          errors: [],
        }),
      };
    },
  };

  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [attachedExecutor()],
    taskControl,
    saveState: async (snapshot) => snapshots.push(snapshot),
    now: () => '2026-07-30T23:00:00.000Z',
  });

  assert.equal(result.status, 'complete');
  assert.equal(created.length, 1);
  assert.equal(created[0].role, 'verifier');
  assert.deepEqual(
    {
      ...snapshots[0].taskRegistry['assignment:SAFE:1:executor'],
      assignment: undefined,
      scope: undefined,
      scopeHash: undefined,
    },
    {
    assignmentId: 'assignment:SAFE:1:executor',
    threadId: 'thread-existing-executor',
    hostId: 'local',
    cursor: 'cursor-executor-1',
    role: 'executor',
    nodeId: 'SAFE',
    status: 'running',
    assignment: undefined,
    scope: undefined,
    scopeHash: undefined,
  });
  assert.equal(
    snapshots.at(-1).taskRegistry['assignment:SAFE:1:executor'].cursor,
    'cursor-executor-2',
  );
  assert.equal(
    snapshots.at(-1).taskRegistry['assignment:SAFE:1:verifier'].status,
    'completed',
  );
  assert.equal(result.completedTasks.length, 2);
});

test('resumes one needs-attention attachment through the privileged supervisor without creating a duplicate executor', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-controller-resume-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{"registry":"host-owned"}');
  writeFileSync(recoveryAuditPath, '{"audit":"host-owned"}');
  let creates = 0;
  const resumes = [];
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        creates += 1;
        return { threadId: 'duplicate-executor' };
      },
      async waitForAny() {
        throw new Error('not used');
      },
    },
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint(binding) {
        resumes.push(binding);
        return {
          request_sha256: '1'.repeat(64),
          generation: 1,
          event: {
            event_type: 'writer_lease_controller_resumed',
            event_hash: '2'.repeat(64),
            payload: {
              program_id: binding.program_id,
              checkpoint_id: binding.checkpoint_id,
              node_id: binding.node_id,
              assignment_id: binding.assignment_id,
              thread_id: binding.thread_id,
              worker_id: binding.worker_id,
              actor: binding.actor,
              session_id: binding.session_id,
              registry_sha256: binding.registry_sha256,
              recovery_audit_sha256: binding.recovery_audit_sha256,
              recovery_id: binding.recovery_id,
              generation: binding.generation,
              request_sha256: '1'.repeat(64),
            },
          },
        };
      },
    },
  });
  const task = await adapter.createTask({
    assignment: {
      id: 'assignment:SAFE:1:executor',
      nodeId: 'SAFE',
      workerId: 'executor-1',
      role: 'executor',
    },
    prompt: 'unused',
    target: {},
  });
  await assert.rejects(
    () =>
      adapter.activateTask({
        assignmentId: 'assignment:SAFE:1:executor',
        activationId: task.activation.activationId,
        threadId: task.threadId,
        prompt: 'exact prompt',
      }),
    /live lifecycle supervisor ownership/i,
  );
  task.lifecycleResume = await adapter.resumeTaskLifecycle({
    assignmentId: 'assignment:SAFE:1:executor',
  });
  await adapter.activateTask({
    assignmentId: 'assignment:SAFE:1:executor',
    activationId: task.activation.activationId,
    threadId: task.threadId,
    prompt: 'exact prompt',
  });

  assert.equal(creates, 0);
  assert.equal(task.threadId, 'thread-existing-executor');
  assert.equal(resumes.length, 1);
  assert.equal(resumes[0].actor, 'agent:executor-1');
  assert.equal(resumes[0].session_id, 'assignment:SAFE:1:executor');
  assert.equal(
    resumes[0].registry_sha256,
    createHash('sha256').update(readFileSync(registryPath)).digest('hex'),
  );
  assert.equal(
    resumes[0].recovery_audit_sha256,
    createHash('sha256').update(readFileSync(recoveryAuditPath)).digest('hex'),
  );
  assert.equal(task.lifecycleResume.eventHash, '2'.repeat(64));
  assert.equal(JSON.stringify(task).includes('lease_capability'), false);
});

test('refuses lifecycle resume when the idle attached host cannot be activated', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-no-activation-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let resumes = 0;
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
      async createTask() {
        throw new Error('must not create');
      },
      async waitForAny() {
        throw new Error('must not wait');
      },
    },
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint() {
        resumes += 1;
      },
    },
  });
  await assert.rejects(
    () =>
      adapter.createTask({
        assignment: {
          id: 'assignment:SAFE:1:executor',
          nodeId: 'SAFE',
          workerId: 'executor-1',
          role: 'executor',
        },
      }),
    /activation capability.*before lifecycle resume/i,
  );
  assert.equal(resumes, 0);
});

test('lifecycle resume failure sends no activation message', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-resume-before-activation-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let activations = 0;
  const snapshots = [];
  await assert.rejects(
    () =>
      runAuthoritativeLedgerWaveWithAttachedHostTasks({
        ledgerInput: attachedLedgerInput(),
        attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
        taskControl: {
          async createTask() {
            throw new Error('duplicate executor must not be created');
          },
          async activateTask() {
            activations += 1;
          },
          async waitForAny() {
            throw new Error('must not wait');
          },
        },
        lifecycleSupervisor: {
          async resumeAttachedCheckpoint() {
            throw new Error('private resume failed');
          },
        },
        lifecycleRecovery: {
          assignmentId: 'assignment:SAFE:1:executor',
          programId: 'program-safe',
          checkpointId: 'checkpoint-safe-1',
          registryPath,
          recoveryAuditPath,
          recoveryId: 'recovery-safe-generation-1',
          generation: 1,
        },
        saveState: async (snapshot) =>
          snapshots.push(structuredClone(snapshot)),
      }),
    /private resume failed/i,
  );
  assert.equal(activations, 0);
  assert.equal(
    snapshots.at(-1).taskRegistry['assignment:SAFE:1:executor'].activation.status,
    'pending',
  );
});

test('failed persistence of the public resume receipt sends no activation message', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-resume-save-before-activation-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let activations = 0;
  let savedPending = false;
  await assert.rejects(
    () =>
      runAuthoritativeLedgerWaveWithAttachedHostTasks({
        ledgerInput: attachedLedgerInput(),
        attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
        taskControl: {
          async createTask() {
            throw new Error('duplicate executor must not be created');
          },
          async activateTask() {
            activations += 1;
          },
          async waitForAny() {
            throw new Error('must not wait');
          },
        },
        lifecycleSupervisor: {
          async resumeAttachedCheckpoint(binding) {
            return lifecycleResumeReceipt(binding);
          },
        },
        lifecycleRecovery: {
          assignmentId: 'assignment:SAFE:1:executor',
          programId: 'program-safe',
          checkpointId: 'checkpoint-safe-1',
          registryPath,
          recoveryAuditPath,
          recoveryId: 'recovery-safe-generation-1',
          generation: 1,
        },
        saveState: async (snapshot) => {
          const record =
            snapshot.taskRegistry['assignment:SAFE:1:executor'];
          if (record.lifecycleResume) {
            throw new Error('resume receipt persistence failed');
          }
          savedPending = record.activation.status === 'pending';
        },
      }),
    /resume receipt persistence failed/i,
  );
  assert.equal(savedPending, true);
  assert.equal(activations, 0);
});

test('background heartbeat covers resume receipt persistence and activation before host wait', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-background-heartbeat-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let renewals = 0;
  let renewalsBeforeActivation = 0;
  let failRenewal = false;
  let activations = 0;
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    taskControl: {
      async createTask() {
        throw new Error('duplicate executor must not be created');
      },
      async activateTask(args) {
        activations += 1;
        renewalsBeforeActivation = renewals;
        await new Promise((resolve) => setTimeout(resolve, 15));
        failRenewal = true;
        return activateAttachedTask(args);
      },
      async waitForAny() {
        return new Promise(() => {});
      },
      async steerTask() {
        return { stopped: true };
      },
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint(binding) {
        return lifecycleResumeReceipt(binding);
      },
      async renewAttachedCheckpoint() {
        renewals += 1;
        if (failRenewal) throw new Error('simulated background renewal failure');
        return { event: { event_type: 'writer_lease_renewed' } };
      },
    },
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
      heartbeatIntervalMs: 2,
      leaseTtlSeconds: 60,
    },
    saveState: async (snapshot) => {
      if (
        snapshot.taskRegistry['assignment:SAFE:1:executor']?.lifecycleResume &&
        snapshot.taskRegistry['assignment:SAFE:1:executor']?.activation?.status ===
          'pending'
      ) {
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    },
  });
  assert.equal(result.status, 'halted');
  assert.match(JSON.stringify(result.report), /background renewal failure/i);
  assert.equal(activations, 1);
  assert.ok(renewalsBeforeActivation > 0);
});

test('activation failure persists attempted and restart reconciles without resending', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-activation-restart-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  const recovery = {
    assignmentId: 'assignment:SAFE:1:executor',
    programId: 'program-safe',
    checkpointId: 'checkpoint-safe-1',
    registryPath,
    recoveryAuditPath,
    recoveryId: 'recovery-safe-generation-1',
    generation: 1,
  };
  let activationCalls = 0;
  let activationSends = 0;
  const supervisor = {
    async resumeAttachedCheckpoint(binding) {
      return lifecycleResumeReceipt(binding);
    },
    async renewAttachedCheckpoint() {
      return { event: { event_type: 'writer_lease_renewed' } };
    },
  };
  const controls = {
    async createTask() {
      throw new Error('duplicate executor must not be created');
    },
    async activateTask(args) {
      activationCalls += 1;
      if (args.allowSend === true) {
        activationSends += 1;
        throw new Error('activation transport failed after send');
      }
      return activateAttachedTask(args);
    },
    async waitForAny() {
      return {
        assignmentId: 'assignment:SAFE:1:executor',
        status: 'needs_attention',
        error: 'bounded stop',
      };
    },
  };
  const firstSnapshots = [];
  await assert.rejects(
    () =>
      runAuthoritativeLedgerWaveWithAttachedHostTasks({
        ledgerInput: attachedLedgerInput(),
        attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
        taskControl: controls,
        lifecycleSupervisor: supervisor,
        lifecycleRecovery: recovery,
        saveState: async (snapshot) => firstSnapshots.push(structuredClone(snapshot)),
      }),
    /activation transport failed after send/,
  );
  assert.equal(
    firstSnapshots.at(-1).taskRegistry['assignment:SAFE:1:executor'].activation.status,
    'attempted',
  );
  assert.ok(
    firstSnapshots.at(-1).taskRegistry['assignment:SAFE:1:executor']
      .lifecycleResume,
  );

  const secondSnapshots = [];
  await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    taskControl: controls,
    lifecycleSupervisor: supervisor,
    lifecycleRecovery: recovery,
    resumeSnapshot: firstSnapshots.at(-1),
    saveState: async (snapshot) => secondSnapshots.push(structuredClone(snapshot)),
  });
  assert.equal(activationCalls, 2);
  assert.equal(activationSends, 1);
  const activatedSnapshot = secondSnapshots.at(-1);
  assert.equal(
    activatedSnapshot.taskRegistry['assignment:SAFE:1:executor'].activation.status,
    'activated',
  );

  await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    taskControl: controls,
    lifecycleSupervisor: supervisor,
    lifecycleRecovery: recovery,
    resumeSnapshot: activatedSnapshot,
    saveState: async () => {},
  });
  assert.equal(activationCalls, 2);
  assert.equal(activationSends, 1);
});

test('periodically serializes lifecycle heartbeats while an attached host task is still waiting', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-periodic-heartbeat-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let resolveWait;
  const hostWait = new Promise((resolve) => {
    resolveWait = resolve;
  });
  let heartbeatCount = 0;
  let heartbeatInFlight = 0;
  let maxHeartbeatInFlight = 0;
  let creates = 0;
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        creates += 1;
        return { threadId: 'duplicate-executor' };
      },
      async waitForAny() {
        return hostWait;
      },
    },
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
      heartbeatIntervalMs: 5,
      leaseTtlSeconds: 60,
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint(binding) {
        return lifecycleResumeReceipt(binding);
      },
      async renewAttachedCheckpoint() {
        heartbeatInFlight += 1;
        maxHeartbeatInFlight = Math.max(maxHeartbeatInFlight, heartbeatInFlight);
        await new Promise((resolve) => setTimeout(resolve, 2));
        heartbeatCount += 1;
        heartbeatInFlight -= 1;
        if (heartbeatCount === 3) {
          resolveWait({
            assignmentId: 'assignment:SAFE:1:executor',
            status: 'failed',
            error: 'bounded test stop',
          });
        }
        return { event: { event_type: 'writer_lease_renewed' } };
      },
    },
  });
  const task = await adapter.createTask({
    assignment: {
      id: 'assignment:SAFE:1:executor',
      nodeId: 'SAFE',
      workerId: 'executor-1',
      role: 'executor',
    },
    prompt: 'unused',
    target: {},
  });
  await adapter.resumeTaskLifecycle({
    assignmentId: 'assignment:SAFE:1:executor',
  });
  await adapter.activateTask({
    assignmentId: 'assignment:SAFE:1:executor',
    activationId: task.activation.activationId,
    threadId: task.threadId,
    prompt: 'exact prompt',
  });
  const safety = setTimeout(
    () =>
      resolveWait({
        assignmentId: 'assignment:SAFE:1:executor',
        status: 'failed',
        error: 'safety timeout',
      }),
    100,
  );
  const outcome = await adapter.waitForAny([
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing-executor',
      hostId: 'local',
    },
  ]);
  clearTimeout(safety);

  assert.equal(outcome.error, 'bounded test stop');
  assert.ok(heartbeatCount >= 3);
  assert.equal(maxHeartbeatInFlight, 1);
  assert.equal(creates, 0);
});

test('heartbeat failure stops the same attached task and returns one terminal failure', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-heartbeat-failure-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  const steers = [];
  let creates = 0;
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        creates += 1;
        return { threadId: 'duplicate-executor' };
      },
      async waitForAny() {
        return new Promise(() => {});
      },
      async steerTask(args) {
        steers.push(args);
      },
    },
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
      heartbeatIntervalMs: 5,
      leaseTtlSeconds: 60,
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint(binding) {
        return lifecycleResumeReceipt(binding);
      },
      async renewAttachedCheckpoint() {
        throw new Error('lease renewal rejected');
      },
    },
  });
  const task = await adapter.createTask({
    assignment: {
      id: 'assignment:SAFE:1:executor',
      nodeId: 'SAFE',
      workerId: 'executor-1',
      role: 'executor',
    },
    prompt: 'unused',
    target: {},
  });
  await adapter.resumeTaskLifecycle({
    assignmentId: 'assignment:SAFE:1:executor',
  });
  await adapter.activateTask({
    assignmentId: 'assignment:SAFE:1:executor',
    activationId: task.activation.activationId,
    threadId: task.threadId,
    prompt: 'exact prompt',
  });

  const outcome = await adapter.waitForAny([
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing-executor',
      hostId: 'local',
    },
  ]);

  assert.equal(outcome.assignmentId, 'assignment:SAFE:1:executor');
  assert.equal(outcome.status, 'failed');
  assert.match(outcome.error, /lifecycle heartbeat failed.*lease renewal rejected/i);
  assert.deepEqual(
    steers.map(({ threadId, hostId }) => ({ threadId, hostId })),
    [{ threadId: 'thread-existing-executor', hostId: 'local' }],
  );
  assert.equal(creates, 0);
});

test('rejects private material from the lifecycle supervisor before reusing or creating a task', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-controller-secret-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let creates = 0;
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        creates += 1;
        return { threadId: 'must-not-create' };
      },
      async waitForAny() {
        throw new Error('not used');
      },
    },
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
    },
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint() {
        return { lease_capability: 'must-never-cross-the-supervisor-boundary' };
      },
    },
  });

  const task = await adapter.createTask({
        assignment: {
          id: 'assignment:SAFE:1:executor',
          nodeId: 'SAFE',
          workerId: 'executor-1',
          role: 'executor',
        },
        prompt: 'unused',
        target: {},
      });
  await assert.rejects(
    () =>
      adapter.resumeTaskLifecycle({
        assignmentId: 'assignment:SAFE:1:executor',
      }),
    /private lifecycle material/,
  );
  assert.equal(creates, 0);
});

test('attached-task controller drives resume heartbeat telemetry and completion on one supervisor', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-controller-lifecycle-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{"registry":"host-owned"}');
  writeFileSync(recoveryAuditPath, '{"audit":"host-owned"}');
  const operations = [];
  const supervisor = {
    async resumeAttachedCheckpoint(binding) {
      operations.push(['resume', binding.assignment_id]);
      return {
        request_sha256: '1'.repeat(64),
        generation: 1,
        event: {
          event_type: 'writer_lease_controller_resumed',
          event_hash: '2'.repeat(64),
          payload: {
            program_id: binding.program_id,
            checkpoint_id: binding.checkpoint_id,
            node_id: binding.node_id,
            assignment_id: binding.assignment_id,
            thread_id: binding.thread_id,
            worker_id: binding.worker_id,
            actor: binding.actor,
            session_id: binding.session_id,
            registry_sha256: binding.registry_sha256,
            recovery_audit_sha256: binding.recovery_audit_sha256,
            recovery_id: binding.recovery_id,
            generation: binding.generation,
            request_sha256: '1'.repeat(64),
          },
        },
      };
    },
    async renewAttachedCheckpoint(binding) {
      operations.push(['heartbeat', binding.assignment_id]);
      return { event: { event_type: 'writer_lease_renewed' } };
    },
    async recordAttachedTelemetryDecision(binding, request) {
      operations.push(['telemetry', binding.assignment_id, request.metrics.toolCalls]);
      return { observation: { allowed: true } };
    },
    async completeAttachedCheckpoint(binding, completion) {
      operations.push([
        'completion',
        binding.assignment_id,
        completion.handoff_id,
        completion.evidence,
      ]);
      const finalization = completion.evidence.find(
        (item) => item.kind === 'agentgraph-finalization',
      );
      return {
        checkpoint: {
          event_type: 'checkpoint_completed',
          program_id: binding.program_id,
          checkpoint_id: binding.checkpoint_id,
          node_id: binding.node_id,
          stage_id: completion.completed_stage,
          payload: { evidence: completion.evidence },
        },
        handoff: {
          handoff_id: completion.handoff_id,
          program_id: binding.program_id,
          checkpoint_id: binding.checkpoint_id,
          node_id: binding.node_id,
          stage_id: completion.completed_stage,
          next_node: completion.next_node,
          next_stage: completion.next_stage,
          summary: completion.summary,
          blockers_json: JSON.stringify(completion.blockers),
          evidence_json: JSON.stringify(completion.evidence),
          to_role: completion.to_role ?? null,
        },
        finalization,
      };
    },
  };
  let verifierCreates = 0;
  const lifecycleRecovery = {
    assignmentId: 'assignment:SAFE:1:executor',
    programId: 'program-safe',
    checkpointId: 'checkpoint-safe-1',
    registryPath,
    recoveryAuditPath,
    recoveryId: 'recovery-safe-generation-1',
    generation: 1,
    completion: {
      evidence: [{ kind: 'focused-test', sha256: '3'.repeat(64) }],
      completed_stage: 'stage:SAFE:verify',
      handoff_id: 'handoff-safe-1',
      next_node: 'NEXT',
      next_stage: 'stage:NEXT:plan',
      summary: 'SAFE verified.',
      blockers: [],
    },
  };
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleSupervisor: supervisor,
    lifecycleRecovery,
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask({ assignment }) {
        assert.equal(assignment.role, 'verifier');
        assert.equal(
          operations.some((operation) => operation[0] === 'completion'),
          false,
          'checkpoint completion must wait for independent verification',
        );
        verifierCreates += 1;
        return { threadId: 'thread-verifier', hostId: 'local' };
      },
      async waitForAny(tasks) {
        const task = tasks[0];
        if (task.assignmentId.endsWith(':executor')) {
          return {
            assignmentId: task.assignmentId,
            status: 'completed',
            hostMetrics: {
              inputTokens: 10,
              outputTokens: 5,
              toolCalls: 2,
              retries: 0,
              waitMilliseconds: 0,
              agentSpawns: 0,
              externalProviderCalls: 0,
              elapsedMilliseconds: 100,
              aiUsd: 0,
              infrastructureUsd: 0,
              externalUsd: 0,
            },
            final: JSON.stringify({
              kind: 'completion',
              nodeId: 'SAFE',
              assignmentId: task.assignmentId,
              workerId: 'executor-1',
              artifact: {
                id: 'artifact:SAFE:1',
                evidence: ['focused tests'],
                summary: 'Completed.',
                productionSideEffects: false,
                providerMutations: false,
              },
            }),
          };
        }
        return {
          assignmentId: task.assignmentId,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'SAFE',
            assignmentId: task.assignmentId,
            workerId: 'verifier-1',
            artifactId: 'artifact:SAFE:1',
            passed: true,
            evidence: ['independent check'],
            errors: [],
          }),
        };
      },
    },
    saveState: async (snapshot) => {
      if (snapshot.lifecycleFinalization?.phase === 'prepared') {
        lifecycleRecovery.completion.next_node = 'MUTATED-AFTER-PREPARE';
        lifecycleRecovery.completion.next_stage =
          'stage:MUTATED-AFTER-PREPARE:plan';
      }
    },
    now: () => '2026-07-30T23:30:00.000Z',
  });

  assert.equal(result.status, 'complete');
  assert.equal(verifierCreates, 1);
  assert.equal(operations.at(-1)[2], 'handoff-safe-1');
  assert.equal(result.lifecycleFinalization.completionReceipt.handoff.next_node, 'NEXT');
  const operationKinds = operations.map((operation) => operation[0]);
  assert.equal(operationKinds[0], 'resume');
  assert.ok(operationKinds.indexOf('telemetry') > operationKinds.indexOf('resume'));
  assert.ok(operationKinds.indexOf('completion') > operationKinds.indexOf('telemetry'));
  assert.deepEqual(
    operations
      .at(-1)[3].find((item) => item.kind === 'agentgraph-verification'),
    {
      kind: 'agentgraph-verification',
      assignmentId: 'assignment:SAFE:1:verifier',
      artifactId: 'artifact:SAFE:1',
      evidence: ['independent check'],
    },
  );
  assert.match(
    operations
      .at(-1)[3].find((item) => item.kind === 'agentgraph-finalization')
      .sha256,
    /^[0-9a-f]{64}$/,
  );
});

test('failed independent verification leaves the resumed lease active without completion or successor', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-controller-verify-fail-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let completions = 0;
  let creates = 0;
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleSupervisor: {
      async resumeAttachedCheckpoint(binding) {
        return lifecycleResumeReceipt(binding);
      },
      async renewAttachedCheckpoint() {
        return { event: { event_type: 'writer_lease_renewed' } };
      },
      async recordAttachedTelemetryDecision() {
        return { observation: { allowed: true } };
      },
      async completeAttachedCheckpoint() {
        completions += 1;
        return { event: { event_type: 'checkpoint_completed' } };
      },
    },
    lifecycleRecovery: {
      assignmentId: 'assignment:SAFE:1:executor',
      programId: 'program-safe',
      checkpointId: 'checkpoint-safe-1',
      registryPath,
      recoveryAuditPath,
      recoveryId: 'recovery-safe-generation-1',
      generation: 1,
      completion: {
        evidence: [],
        completed_stage: 'stage:SAFE:verify',
        handoff_id: 'handoff-safe-1',
        next_node: 'NEXT',
        next_stage: 'stage:NEXT:plan',
        summary: 'SAFE verified.',
        blockers: [],
      },
    },
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask({ assignment }) {
        assert.equal(assignment.role, 'verifier');
        creates += 1;
        return { threadId: 'thread-verifier-failure' };
      },
      async waitForAny(tasks) {
        const task = tasks[0];
        if (task.assignmentId.endsWith(':executor')) {
          return {
            assignmentId: task.assignmentId,
            status: 'completed',
            hostMetrics: {
              inputTokens: 1,
              outputTokens: 1,
              toolCalls: 1,
              retries: 0,
              waitMilliseconds: 0,
              agentSpawns: 0,
              externalProviderCalls: 0,
              elapsedMilliseconds: 1,
              aiUsd: 0,
              infrastructureUsd: 0,
              externalUsd: 0,
            },
            final: JSON.stringify({
              kind: 'completion',
              nodeId: 'SAFE',
              assignmentId: task.assignmentId,
              workerId: 'executor-1',
              artifact: {
                id: 'artifact:SAFE:1',
                evidence: ['focused tests'],
                productionSideEffects: false,
                providerMutations: false,
              },
            }),
          };
        }
        return {
          assignmentId: task.assignmentId,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'SAFE',
            assignmentId: task.assignmentId,
            workerId: 'verifier-1',
            artifactId: 'artifact:SAFE:1',
            passed: false,
            evidence: ['failed independent check'],
            errors: ['verification failed'],
          }),
        };
      },
    },
    now: () => '2026-07-30T23:32:00.000Z',
  });

  assert.equal(result.status, 'halted');
  assert.equal(creates, 1);
  assert.equal(completions, 0);
  assert.notEqual(result.state.nodes.SAFE.status, 'completed');
});

test('prepared lifecycle journal must persist before DB completion or successor launch', async () => {
  const executionGraph = dependentProofGraph();
  const queue = [];
  const launched = [];
  let lifecycleCompletions = 0;
  const codex = {
    async createTask({ assignment }) {
      launched.push(assignment);
      if (assignment.nodeId === 'A' && assignment.role === 'executor') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          hostMetrics: {},
          final: JSON.stringify({
            kind: 'completion',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifact: {
              id: 'artifact:A:1',
              evidence: ['focused tests'],
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        });
      } else if (assignment.nodeId === 'A' && assignment.role === 'verifier') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifactId: 'artifact:A:1',
            passed: true,
            evidence: ['independent verification'],
            errors: [],
          }),
        });
      } else {
        throw new Error('successor launched before prepared lifecycle journal');
      }
      return { threadId: `thread:${assignment.id}` };
    },
    async waitForAny() {
      return queue.shift();
    },
    requiresLifecycleFinalization({ nodeId }) {
      return nodeId === 'A';
    },
    getLifecycleCompletionBinding() {
      return directLifecycleBinding();
    },
    async completeVerifiedNodeLifecycle({ finalization }) {
      lifecycleCompletions += 1;
      return { event: { event_type: 'checkpoint_completed' } };
    },
  };

  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: executionGraph,
        initialState: createAgentGraphExecutionState(executionGraph),
        workers: workers(),
        codex,
        saveState: async (snapshot) => {
          if (snapshot.lifecycleFinalization?.phase === 'prepared') {
            throw new Error('prepared journal save failed');
          }
        },
        now: () => '2026-07-30T23:40:00.000Z',
      }),
    /prepared journal save failed/,
  );

  assert.equal(lifecycleCompletions, 0);
  assert.deepEqual(
    launched.map(({ nodeId, role }) => `${nodeId}:${role}`),
    ['A:executor', 'A:verifier'],
  );
});

test('lifecycle next_node must match a dependency-unlocked candidate executor', async () => {
  const executionGraph = dependentProofGraph();
  const queue = [];
  let lifecycleCompletions = 0;
  const codex = {
    async createTask({ assignment }) {
      if (assignment.nodeId !== 'A') {
        throw new Error('mismatched successor must not launch');
      }
      queue.push(
        assignment.role === 'executor'
          ? {
              assignmentId: assignment.id,
              status: 'completed',
              final: JSON.stringify({
                kind: 'completion',
                nodeId: 'A',
                assignmentId: assignment.id,
                workerId: assignment.workerId,
                artifact: {
                  id: 'artifact:A:1',
                  evidence: ['focused tests'],
                  productionSideEffects: false,
                  providerMutations: false,
                },
              }),
            }
          : {
              assignmentId: assignment.id,
              status: 'completed',
              final: JSON.stringify({
                kind: 'verification',
                nodeId: 'A',
                assignmentId: assignment.id,
                workerId: assignment.workerId,
                artifactId: 'artifact:A:1',
                passed: true,
                evidence: ['independent verification'],
                errors: [],
              }),
            },
      );
      return { threadId: `thread:${assignment.id}` };
    },
    async waitForAny() {
      return queue.shift();
    },
    requiresLifecycleFinalization({ nodeId }) {
      return nodeId === 'A';
    },
    getLifecycleCompletionBinding() {
      return directLifecycleBinding('A', 'NOT-UNLOCKED');
    },
    async completeVerifiedNodeLifecycle() {
      lifecycleCompletions += 1;
    },
  };
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: executionGraph,
        initialState: createAgentGraphExecutionState(executionGraph),
        workers: workers(),
        codex,
        saveState: async () => {},
      }),
    /next_node.*dependency-unlocked candidate executor/i,
  );
  assert.equal(lifecycleCompletions, 0);
});

test('reconciles then retries one incomplete prepared DB completion before successor launch', async () => {
  const executionGraph = dependentProofGraph();
  const queue = [];
  const events = [];
  let completionAttempts = 0;
  const codex = {
    async createTask({ assignment }) {
      if (assignment.nodeId === 'B') {
        assert.equal(events.at(-1), 'save:finalized');
        throw new Error('bounded stop after retried completion');
      }
      if (assignment.role === 'executor') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          hostMetrics: {},
          final: JSON.stringify({
            kind: 'completion',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifact: {
              id: 'artifact:A:1',
              evidence: ['focused tests'],
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        });
      } else {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifactId: 'artifact:A:1',
            passed: true,
            evidence: ['independent verification'],
            errors: [],
          }),
        });
      }
      return { threadId: `thread:${assignment.id}` };
    },
    async waitForAny() {
      return queue.shift();
    },
    requiresLifecycleFinalization({ nodeId }) {
      return nodeId === 'A';
    },
    getLifecycleCompletionBinding() {
      return directLifecycleBinding();
    },
    async completeVerifiedNodeLifecycle({ finalization }) {
      completionAttempts += 1;
      events.push(`completion:${completionAttempts}`);
      if (completionAttempts === 1) throw new Error('transient DB completion failure');
      return completionReceiptFor(finalization);
    },
    async reconcilePreparedLifecycleFinalization() {
      events.push('reconcile:incomplete');
      return { completed: false, receipt: null };
    },
  };

  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: executionGraph,
        initialState: createAgentGraphExecutionState(executionGraph),
        workers: workers(),
        codex,
        saveState: async (snapshot) => {
          if (snapshot.lifecycleFinalization) {
            events.push(`save:${snapshot.lifecycleFinalization.phase}`);
          }
        },
        now: () => '2026-07-30T23:40:30.000Z',
      }),
    /bounded stop after retried completion/,
  );

  assert.equal(completionAttempts, 2);
  assert.deepEqual(events.slice(-5), [
    'save:prepared',
    'completion:1',
    'reconcile:incomplete',
    'completion:2',
    'save:finalized',
  ]);
});

test('persistent DB completion failure returns a durable resumable prepared journal', async () => {
  const executionGraph = dependentProofGraph();
  const queue = [];
  const snapshots = [];
  let completionAttempts = 0;
  let successorCreates = 0;
  const result = await runAgentGraphWithCodex({
    graph: executionGraph,
    initialState: createAgentGraphExecutionState(executionGraph),
    workers: workers(),
    codex: {
      async createTask({ assignment }) {
        if (assignment.nodeId === 'B') {
          successorCreates += 1;
          throw new Error('successor must remain locked');
        }
        queue.push(
          assignment.role === 'executor'
            ? {
                assignmentId: assignment.id,
                status: 'completed',
                hostMetrics: {},
                final: JSON.stringify({
                  kind: 'completion',
                  nodeId: 'A',
                  assignmentId: assignment.id,
                  workerId: assignment.workerId,
                  artifact: {
                    id: 'artifact:A:1',
                    evidence: ['focused tests'],
                    productionSideEffects: false,
                    providerMutations: false,
                  },
                }),
              }
            : {
                assignmentId: assignment.id,
                status: 'completed',
                final: JSON.stringify({
                  kind: 'verification',
                  nodeId: 'A',
                  assignmentId: assignment.id,
                  workerId: assignment.workerId,
                  artifactId: 'artifact:A:1',
                  passed: true,
                  evidence: ['independent verification'],
                  errors: [],
                }),
              },
        );
        return { threadId: `thread:${assignment.id}` };
      },
      async waitForAny() {
        return queue.shift();
      },
      requiresLifecycleFinalization({ nodeId }) {
        return nodeId === 'A';
      },
      getLifecycleCompletionBinding() {
        return directLifecycleBinding();
      },
      async completeVerifiedNodeLifecycle() {
        completionAttempts += 1;
        throw new Error('persistent DB completion failure');
      },
      async reconcilePreparedLifecycleFinalization() {
        return { completed: false, receipt: null };
      },
    },
    saveState: async (snapshot) => snapshots.push(structuredClone(snapshot)),
    now: () => '2026-07-30T23:40:45.000Z',
  });

  assert.equal(result.status, 'halted');
  assert.equal(completionAttempts, 2);
  assert.equal(successorCreates, 0);
  assert.equal(result.lifecycleFinalization.phase, 'prepared');
  assert.equal(snapshots.at(-1).lifecycleFinalization.phase, 'prepared');
  assert.notEqual(result.state.nodes.A.status, 'completed');
});

test('finalized restart requires an exact completion receipt bound to its finalization hash', async () => {
  const executionGraph = { nodes: [proofGraph().nodes[0]] };
  const state = createAgentGraphExecutionState(executionGraph);
  state.status = 'complete';
  state.nodes['READ-PACKAGE'].status = 'completed';
  const verifierAssignment = {
    id: 'assignment:READ-PACKAGE:1:verifier',
    nodeId: 'READ-PACKAGE',
    workerId: 'codex-verifier-1',
    role: 'verifier',
    artifactId: 'artifact:READ-PACKAGE:1',
  };
  const verification = {
    kind: 'verification',
    nodeId: 'READ-PACKAGE',
    assignmentId: verifierAssignment.id,
    workerId: verifierAssignment.workerId,
    artifactId: verifierAssignment.artifactId,
    passed: true,
  };
  const exact = {
    nodeId: 'READ-PACKAGE',
    verifierAssignment,
    verification,
    lifecycle: directLifecycleBinding('READ-PACKAGE', 'NEXT'),
    candidate: {
      state,
      assignments: [],
      successorAssignmentIds: [],
      successorContract: { kind: 'terminal-no-successor', nextNode: 'NEXT' },
    },
  };
  const sha256 = createHash('sha256').update(JSON.stringify(exact)).digest('hex');
  const completionReceipt = completionReceiptFor({ ...exact, sha256 });
  const valid = {
    schemaVersion: '1.0.0',
    phase: 'finalized',
    ...exact,
    sha256,
    completionReceipt,
    completionReceiptSha256: createHash('sha256')
      .update(JSON.stringify(completionReceipt))
      .digest('hex'),
  };
  const baseInput = {
    graph: executionGraph,
    initialState: createAgentGraphExecutionState(executionGraph),
    workers: workers(),
    codex: {
      async createTask() {
        throw new Error('completed finalization must not relaunch');
      },
      async waitForAny() {
        throw new Error('completed finalization must not wait');
      },
    },
    saveState: async () => {},
  };
  for (const journal of [
    { ...valid, completionReceipt: undefined },
    { ...valid, completionReceiptSha256: '0'.repeat(64) },
    {
      ...valid,
      completionReceipt: {
        checkpoint: { event_type: 'checkpoint_completed', payload: { evidence: [] } },
      },
    },
    (() => {
      const wrongReceipt = structuredClone(completionReceipt);
      wrongReceipt.handoff.next_node = 'WRONG-NEXT';
      return {
        ...valid,
        completionReceipt: wrongReceipt,
        completionReceiptSha256: createHash('sha256')
          .update(JSON.stringify(wrongReceipt))
          .digest('hex'),
      };
    })(),
  ]) {
    await assert.rejects(
      () =>
        runAgentGraphWithCodex({
          ...baseInput,
          resumeSnapshot: { completedTasks: [], taskRegistry: {}, lifecycleFinalization: journal },
        }),
      /exact public completion receipt/,
    );
  }
  const recomputedContractTamper = structuredClone(valid);
  delete recomputedContractTamper.completionReceipt;
  delete recomputedContractTamper.completionReceiptSha256;
  recomputedContractTamper.phase = 'prepared';
  recomputedContractTamper.candidate.successorContract.nextNode = 'WRONG-NEXT';
  const {
    schemaVersion: _schemaVersion,
    phase: _phase,
    sha256: _oldSha,
    ...tamperedExact
  } = recomputedContractTamper;
  recomputedContractTamper.sha256 = createHash('sha256')
    .update(JSON.stringify(tamperedExact))
    .digest('hex');
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        ...baseInput,
        resumeSnapshot: {
          completedTasks: [],
          taskRegistry: {},
          lifecycleFinalization: recomputedContractTamper,
        },
      }),
    /terminal lifecycle finalization contract does not match/i,
  );
  const result = await runAgentGraphWithCodex({
    ...baseInput,
    resumeSnapshot: { completedTasks: [], taskRegistry: {}, lifecycleFinalization: valid },
  });
  assert.equal(result.status, 'complete');
});

test('reconciles a durable prepared journal after DB completion before launching a successor', async () => {
  const executionGraph = dependentProofGraph();
  const queue = [];
  const launched = [];
  const durableSnapshots = [];
  let lifecycleCompletions = 0;
  const firstCodex = {
    async createTask({ assignment }) {
      launched.push(assignment);
      if (assignment.nodeId === 'A' && assignment.role === 'executor') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          hostMetrics: {},
          final: JSON.stringify({
            kind: 'completion',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifact: {
              id: 'artifact:A:1',
              evidence: ['focused tests'],
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        });
      } else if (assignment.nodeId === 'A' && assignment.role === 'verifier') {
        queue.push({
          assignmentId: assignment.id,
          status: 'completed',
          final: JSON.stringify({
            kind: 'verification',
            nodeId: 'A',
            assignmentId: assignment.id,
            workerId: assignment.workerId,
            artifactId: 'artifact:A:1',
            passed: true,
            evidence: ['independent verification'],
            errors: [],
          }),
        });
      } else {
        throw new Error('successor must not launch before finalized snapshot');
      }
      return { threadId: `thread:${assignment.id}` };
    },
    async waitForAny() {
      return queue.shift();
    },
    requiresLifecycleFinalization({ nodeId }) {
      return nodeId === 'A';
    },
    getLifecycleCompletionBinding() {
      return directLifecycleBinding();
    },
    async completeVerifiedNodeLifecycle({ finalization }) {
      lifecycleCompletions += 1;
      return completionReceiptFor(finalization);
    },
  };

  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: executionGraph,
        initialState: createAgentGraphExecutionState(executionGraph),
        workers: workers(),
        codex: firstCodex,
        saveState: async (snapshot) => {
          if (snapshot.lifecycleFinalization?.phase === 'finalized') {
            throw new Error('finalized journal save failed');
          }
          durableSnapshots.push(structuredClone(snapshot));
        },
        now: () => '2026-07-30T23:41:00.000Z',
      }),
    /finalized journal save failed/,
  );

  const prepared = durableSnapshots.at(-1);
  assert.equal(prepared.lifecycleFinalization.phase, 'prepared');
  assert.equal(lifecycleCompletions, 1);
  assert.deepEqual(
    launched.map(({ nodeId, role }) => `${nodeId}:${role}`),
    ['A:executor', 'A:verifier'],
  );

  const restartEvents = [];
  let reconciliations = 0;
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: executionGraph,
        initialState: createAgentGraphExecutionState(executionGraph),
        resumeSnapshot: prepared,
        workers: workers(),
        codex: {
          async reconcilePreparedLifecycleFinalization(journal) {
            reconciliations += 1;
            assert.equal(journal.phase, 'prepared');
            return {
              completed: true,
              receipt: completionReceiptFor(journal),
            };
          },
          async createTask({ assignment, idempotencyKey }) {
            assert.equal(
              restartEvents.at(-1),
              'saved:finalized',
              'successor creation must follow the durable finalized snapshot',
            );
            assert.match(idempotencyKey, /^agentgraph-scope:[0-9a-f]{64}$/);
            restartEvents.push(`created:${assignment.id}`);
            throw new Error('bounded stop after successor creation');
          },
          async waitForAny() {
            throw new Error('not reached');
          },
        },
        saveState: async (snapshot) => {
          restartEvents.push(`saved:${snapshot.lifecycleFinalization?.phase || 'none'}`);
        },
        now: () => '2026-07-30T23:42:00.000Z',
      }),
    /bounded stop after successor creation/,
  );

  assert.equal(reconciliations, 1);
  assert.equal(lifecycleCompletions, 1);
  assert.deepEqual(restartEvents, [
    'saved:finalized',
    'created:assignment:B:1:executor',
  ]);
});

test('prepared restart rejects a recomputed DB receipt with the wrong handoff successor', async () => {
  const prepared = preparedFinalizationFor();
  const wrongReceipt = completionReceiptFor(prepared);
  wrongReceipt.handoff.next_node = 'WRONG-NEXT';
  let creates = 0;
  await assert.rejects(
    () =>
      runAgentGraphWithCodex({
        graph: dependentProofGraph(),
        initialState: createAgentGraphExecutionState(dependentProofGraph()),
        workers: workers(),
        codex: {
          async createTask() {
            creates += 1;
            throw new Error('wrong reconciliation must not launch');
          },
          async waitForAny() {
            throw new Error('wrong reconciliation must not wait');
          },
          async reconcilePreparedLifecycleFinalization() {
            return { completed: true, receipt: wrongReceipt };
          },
        },
        resumeSnapshot: {
          completedTasks: [],
          taskRegistry: {},
          lifecycleFinalization: prepared,
        },
        saveState: async () => {},
      }),
    /exact public completion receipt/i,
  );
  assert.equal(creates, 0);
});

test('real injected adapter reconciles the same checkpoint and prepared journal hash', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-adapter-reconcile-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  const lifecycleRecovery = {
    assignmentId: 'assignment:SAFE:1:executor',
    programId: 'program-safe',
    checkpointId: 'checkpoint-safe-1',
    registryPath,
    recoveryAuditPath,
    recoveryId: 'recovery-safe-generation-1',
    generation: 1,
    heartbeatIntervalMs: 5,
    leaseTtlSeconds: 60,
    completion: {
      evidence: [],
      completed_stage: 'stage:SAFE:verify',
      handoff_id: 'handoff-safe-1',
      next_node: 'NEXT',
      next_stage: 'stage:NEXT:plan',
      summary: 'SAFE verified.',
      blockers: [],
    },
  };
  const durableSnapshots = [];
  let completionPayload;
  let verifierCreates = 0;
  await assert.rejects(
    () =>
      runAuthoritativeLedgerWaveWithAttachedHostTasks({
        ledgerInput: attachedLedgerInput(),
        attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
        lifecycleRecovery,
        lifecycleSupervisor: {
          async resumeAttachedCheckpoint(binding) {
            return lifecycleResumeReceipt(binding);
          },
          async renewAttachedCheckpoint() {
            return { event: { event_type: 'writer_lease_renewed' } };
          },
          async recordAttachedTelemetryDecision() {
            return { observation: { allowed: true } };
          },
          async completeAttachedCheckpoint(binding, payload) {
            completionPayload = payload;
            return {
              checkpoint: {
                event_type: 'checkpoint_completed',
                event_hash: '9'.repeat(64),
                program_id: binding.program_id,
                checkpoint_id: binding.checkpoint_id,
                node_id: binding.node_id,
                stage_id: payload.completed_stage,
                payload: { evidence: payload.evidence },
              },
              handoff: {
                handoff_id: payload.handoff_id,
                program_id: binding.program_id,
                checkpoint_id: binding.checkpoint_id,
                node_id: binding.node_id,
                stage_id: payload.completed_stage,
                next_node: payload.next_node,
                next_stage: payload.next_stage,
                summary: payload.summary,
                blockers_json: JSON.stringify(payload.blockers),
                evidence_json: JSON.stringify(payload.evidence),
                to_role: payload.to_role ?? null,
              },
            };
          },
        },
        taskControl: {
          activateTask: activateAttachedTask,
          async createTask({ assignment }) {
            verifierCreates += 1;
            return { threadId: `thread:${assignment.id}` };
          },
          async waitForAny(tasks) {
            const task = tasks[0];
            if (task.assignmentId.endsWith(':executor')) {
              return {
                assignmentId: task.assignmentId,
                status: 'completed',
                hostMetrics: {},
                final: JSON.stringify({
                  kind: 'completion',
                  nodeId: 'SAFE',
                  assignmentId: task.assignmentId,
                  workerId: 'executor-1',
                  artifact: {
                    id: 'artifact:SAFE:1',
                    evidence: ['focused tests'],
                    productionSideEffects: false,
                    providerMutations: false,
                  },
                }),
              };
            }
            return {
              assignmentId: task.assignmentId,
              status: 'completed',
              final: JSON.stringify({
                kind: 'verification',
                nodeId: 'SAFE',
                assignmentId: task.assignmentId,
                workerId: 'verifier-1',
                artifactId: 'artifact:SAFE:1',
                passed: true,
                evidence: ['independent verification'],
                errors: [],
              }),
            };
          },
        },
        saveState: async (snapshot) => {
          if (snapshot.lifecycleFinalization?.phase === 'finalized') {
            throw new Error('simulated crash after DB completion');
          }
          durableSnapshots.push(structuredClone(snapshot));
        },
        now: () => '2026-07-30T23:43:00.000Z',
      }),
    /simulated crash after DB completion/,
  );
  const prepared = durableSnapshots.at(-1);
  const finalizationEvidence = completionPayload.evidence.find(
    (item) => item.kind === 'agentgraph-finalization',
  );
  assert.equal(finalizationEvidence.sha256, prepared.lifecycleFinalization.sha256);
  assert.equal(verifierCreates, 1);

  const reconcileCalls = [];
  const finalizedSnapshots = [];
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleRecovery,
    resumeSnapshot: prepared,
    lifecycleSupervisor: {
      async reconcileAttachedCheckpointCompletion(binding, options) {
        reconcileCalls.push({ binding, options });
        return {
          completed: true,
          receipt: completionReceiptFor(prepared.lifecycleFinalization),
        };
      },
    },
    taskControl: {
      activateTask: activateAttachedTask,
      async createTask() {
        throw new Error('completed node must not relaunch');
      },
      async waitForAny() {
        throw new Error('completed node must not wait');
      },
    },
    saveState: async (snapshot) => finalizedSnapshots.push(snapshot),
    now: () => '2026-07-30T23:44:00.000Z',
  });

  assert.equal(result.status, 'complete');
  assert.deepEqual(reconcileCalls, [
    {
      binding: {
        program_id: 'program-safe',
        checkpoint_id: 'checkpoint-safe-1',
        node_id: 'SAFE',
      },
      options: { finalizationSha256: prepared.lifecycleFinalization.sha256 },
    },
  ]);
  assert.equal(finalizedSnapshots[0].lifecycleFinalization.phase, 'finalized');
});

test('rejects private callback material before any snapshot can persist it', async () => {
  const graph = { nodes: [proofGraph().nodes[0]] };
  const snapshots = [];
  let creates = 0;
  const result = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: [{ id: 'codex-executor-1', capabilities: ['execute'] }],
    codex: {
      async createTask() {
        creates += 1;
        return { threadId: 'thread-private-callback' };
      },
      async waitForAny(tasks) {
        return {
          assignmentId: tasks[0].assignmentId,
          status: 'completed',
          final: JSON.stringify({
            kind: 'completion',
            nodeId: 'READ-PACKAGE',
            assignmentId: tasks[0].assignmentId,
            workerId: 'codex-executor-1',
            artifact: {
              id: 'artifact-private',
              evidence: ['Authorization: Bearer abcdefghijklmnopqrstuvwxyz'],
              productionSideEffects: false,
              providerMutations: false,
            },
          }),
        };
      },
    },
    saveState: async (snapshot) => snapshots.push(snapshot),
    now: () => '2026-07-30T23:31:00.000Z',
  });

  assert.equal(result.status, 'halted');
  assert.equal(creates, 1);
  assert.equal(JSON.stringify(snapshots).includes('abcdefghijklmnopqrstuvwxyz'), false);
  assert.match(result.report.errors[0], /private material/i);
});

test('halts once when an attached executor needs attention and does not launch a verifier', async () => {
  let waits = 0;
  let creates = 0;
  const snapshots = [];
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [attachedExecutor()],
    taskControl: {
      async createTask() {
        creates += 1;
        throw new Error('verifier must not launch');
      },
      async waitForAny() {
        waits += 1;
        return {
          assignmentId: 'assignment:SAFE:1:executor',
          status: 'needs_attention',
          cursor: 'cursor-needs-attention',
          error: 'official lifecycle writer lease is unavailable',
        };
      },
    },
    saveState: async (snapshot) => snapshots.push(snapshot),
    now: () => '2026-07-30T23:01:00.000Z',
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.report.reason, 'invalid_completion_artifact');
  assert.equal(waits, 1);
  assert.equal(creates, 0);
  assert.deepEqual(
    {
      ...snapshots.at(-1).taskRegistry['assignment:SAFE:1:executor'],
      assignment: undefined,
      scope: undefined,
      scopeHash: undefined,
    },
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing-executor',
      hostId: 'local',
      cursor: 'cursor-needs-attention',
      role: 'executor',
      nodeId: 'SAFE',
      status: 'needs_attention',
      error: 'official lifecycle writer lease is unavailable',
      assignment: undefined,
      scope: undefined,
      scopeHash: undefined,
    },
  );
});

test('halts once on a missing attached executor callback', async () => {
  let waits = 0;
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [attachedExecutor()],
    taskControl: {
      async createTask() {
        throw new Error('verifier must not launch');
      },
      async waitForAny() {
        waits += 1;
        return {
          assignmentId: 'assignment:SAFE:1:executor',
          status: 'completed',
          cursor: 'cursor-missing-callback',
          final: '',
        };
      },
    },
    now: () => '2026-07-30T23:02:00.000Z',
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.report.reason, 'invalid_completion_artifact');
  assert.equal(waits, 1);
  assert.match(result.report.errors[0], /no completion callback/);
});

test('rejects an attachment outside the authoritative wave before creating a duplicate task', async () => {
  let creates = 0;
  await assert.rejects(
    () =>
      runAuthoritativeLedgerWaveWithAttachedHostTasks({
        ledgerInput: attachedLedgerInput(),
        attachedTasks: [
          {
            ...attachedExecutor(),
            assignmentId: 'assignment:STALE:1:executor',
          },
        ],
        taskControl: {
          async createTask() {
            creates += 1;
            return { threadId: 'duplicate-task' };
          },
          async waitForAny() {
            throw new Error('must not wait');
          },
        },
      }),
    /attached task is not in the authoritative wave/,
  );
  assert.equal(creates, 0);
});

test('rejects production/provider mutation assignments before task creation', () => {
  const graph = proofGraph();
  graph.nodes[0].permissions = ['deployment:write'];
  const state = createAgentGraphExecutionState(graph);
  const assignment = {
    id: 'assignment:READ-PACKAGE:1:executor',
    nodeId: 'READ-PACKAGE',
    workerId: 'codex-executor-1',
    role: 'executor',
  };
  assert.throws(
    () => createCodexAssignmentPrompt({ graph, state, assignment }),
    /production\/provider mutation is forbidden/,
  );
});

test('builds a self-contained worker spec with target, files, evidence, and locks', () => {
  assert.equal(typeof taskRunner.createCodexWorkerAssignmentSpec, 'function');
  const graph = {
    nodes: [
      {
        id: 'STL-104',
        title: 'Verified dependency 104',
        dependsOn: [],
        permissions: ['repository:read'],
      },
      {
        id: 'STL-105',
        title: 'Verified dependency 105',
        dependsOn: [],
        permissions: ['repository:read'],
      },
      {
        id: 'STL-301',
        title: 'Design tokens/shadcn baseline',
        dependsOn: ['STL-104', 'STL-105'],
        objective: 'Establish the local design-token baseline.',
        inputs: ['file:components.json', 'file:src/index.css', 'dependency:STL-104'],
        outputs: ['STL-301-implementation'],
        permissions: ['repository:read', 'repository:write'],
        risk: {
          tier: 'medium',
          blastRadius: 'Local UI files; resource locks: design-tokens',
        },
        execution: { environment: 'local' },
        verification: {
          independent: true,
          requiredEvidence: ['typecheck', 'visual-regression'],
          successCondition: 'WCAG/visual-regression baseline',
        },
      },
    ],
  };
  const state = createAgentGraphExecutionState(graph);
  state.nodes['STL-301'].attempt = 1;
  const assignment = {
    id: 'assignment:STL-301:1:executor',
    nodeId: 'STL-301',
    workerId: 'codex-executor-1',
    role: 'executor',
    attempt: 1,
  };
  const spec = taskRunner.createCodexWorkerAssignmentSpec({
    graph,
    state,
    assignment,
    target: {
      projectId: 'project-local',
      worktreePath: 'C:\\repo\\worktree',
      environment: 'local',
    },
    executionBoundary: {
      allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
      allowReadOnlyProductionMetadata: true,
      allowPreviewDeployments: true,
      allowTestSandboxIntegrations: true,
      allowProductionMutations: false,
    },
  });

  assert.deepEqual(spec.allowedFiles, ['components.json', 'src/index.css']);
  assert.deepEqual(spec.allowedActions, ['repository:read', 'repository:write']);
  assert.deepEqual(spec.requiredEvidence, ['typecheck', 'visual-regression']);
  assert.deepEqual(spec.resourceLocks, ['design-tokens']);
  assert.equal(spec.target.worktreePath, 'C:\\repo\\worktree');
  assert.equal(spec.verification.independent, true);
  assert.equal(spec.constraints.productionMutations, false);
});

test('builds a deterministic non-conflicting wave only from authoritative ledger-ready input', () => {
  assert.equal(typeof taskRunner.buildAuthoritativeLedgerWave, 'function');
  const result = taskRunner.buildAuthoritativeLedgerWave({
    schemaVersion: '1.0.0',
    source: {
      kind: 'authoritative-lifecycle-ledger',
      ledgerId: 'governed-execution',
      revision: 'rev-42',
    },
    completedNodeIds: ['FOUNDATION'],
    target: {
      projectId: 'project-local',
      worktreePath: 'C:\\repo\\worktree',
      environment: 'local',
    },
    boundary: {
      allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
      allowReadOnlyProductionMetadata: true,
      allowPreviewDeployments: true,
      allowTestSandboxIntegrations: true,
      allowProductionMutations: false,
    },
    workers: [
      { id: 'codex-executor-2', capabilities: ['execute'] },
      { id: 'codex-executor-1', capabilities: ['execute'] },
    ],
    maxConcurrentExecutors: 2,
    readyNodes: [
      {
        id: 'A',
        title: 'Local A',
        dependsOn: ['FOUNDATION'],
        permissions: ['repository:write'],
        inputs: ['file:src/a.js'],
        resourceLocks: ['shared-ui'],
        lifecycle: { authoritative: true, status: 'ready' },
        verification: { independent: true, requiredEvidence: ['tests'] },
      },
      {
        id: 'B',
        title: 'Local B',
        dependsOn: ['FOUNDATION'],
        permissions: ['repository:write'],
        inputs: ['file:src/b.js'],
        resourceLocks: ['shared-ui'],
        lifecycle: { authoritative: true, status: 'ready' },
        verification: { independent: true, requiredEvidence: ['tests'] },
      },
      {
        id: 'C',
        title: 'Production promotion',
        dependsOn: ['FOUNDATION'],
        execution: { environment: 'production' },
        permissions: ['deployment:production:promote'],
        lifecycle: { authoritative: true, status: 'ready' },
        verification: { independent: true, requiredEvidence: ['deployment'] },
      },
    ],
  });

  assert.equal(result.source.revision, 'rev-42');
  assert.deepEqual(result.assignments.map((assignment) => assignment.nodeId), ['A']);
  assert.equal(result.assignments[0].workerId, 'codex-executor-1');
  assert.deepEqual(result.deferred, [
    { nodeId: 'B', reason: 'resource_lock_conflict', resourceLocks: ['shared-ui'] },
  ]);
  assert.deepEqual(result.blocked, [
    {
      nodeId: 'C',
      reason: 'production/provider mutation is outside the execution boundary',
    },
  ]);
});

test('rejects compiled-graph input as a ready-node authority', () => {
  assert.equal(typeof taskRunner.buildAuthoritativeLedgerWave, 'function');
  assert.throws(
    () =>
      taskRunner.buildAuthoritativeLedgerWave({
        source: { kind: 'compiled-graph', revision: 'stale' },
        readyNodes: [],
      }),
    /authoritative lifecycle ledger/,
  );
});

test('repository skill script deterministically converts ledger input to wave specs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agentgraph-wave-'));
  const inputPath = join(directory, 'ledger.json');
  const outputPath = join(directory, 'wave.json');
  writeFileSync(
    inputPath,
    JSON.stringify({
      source: {
        kind: 'authoritative-lifecycle-ledger',
        ledgerId: 'governed-execution',
        revision: 'rev-script',
      },
      completedNodeIds: [],
      target: { worktreePath: 'C:\\repo', environment: 'local' },
      workers: [{ id: 'executor-1', capabilities: ['execute'] }],
      readyNodes: [
        {
          id: 'SAFE',
          dependsOn: [],
          permissions: ['repository:read'],
          lifecycle: { authoritative: true, status: 'ready' },
          verification: { independent: true, requiredEvidence: ['evidence'] },
        },
      ],
    }),
  );
  const result = spawnSync(
    process.execPath,
    [
      '.agents/skills/agentgraph-wave-execution/scripts/build-wave-specs.mjs',
      '--input',
      inputPath,
      '--output',
      outputPath,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.equal(output.source.revision, 'rev-script');
  assert.deepEqual(output.assignments.map((assignment) => assignment.nodeId), ['SAFE']);
});

test('governed host entry point refuses compiled-graph readiness before creating workers', async () => {
  assert.equal(typeof taskRunner.runAuthoritativeLedgerWaveWithCodex, 'function');
  let launches = 0;
  await assert.rejects(
    () =>
      taskRunner.runAuthoritativeLedgerWaveWithCodex({
        ledgerInput: {
          source: { kind: 'compiled-graph', revision: 'stale' },
          readyNodes: [],
        },
        codex: {
          async createTask() {
            launches += 1;
          },
          async waitForAny() {
            throw new Error('must not wait');
          },
        },
      }),
    /authoritative lifecycle ledger/,
  );
  assert.equal(launches, 0);
});
