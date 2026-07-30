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
  assert.match(prompt, /renewal.*telemetry.*completion/i);
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

  assert.match(skill, /privileged.*in-process lifecycle supervisor/i);
  assert.match(skill, /import .*mcp_server\.py.*exactly once/i);
  assert.match(skill, /do not start an MCP subprocess/i);
  assert.match(skill, /do not edit the lifecycle database/i);
  assert.match(skill, /generic.*public MCP.*capability-bearing/i);
  assert.match(skill, /worker never receives.*lease capability/i);
  assert.match(skill, /resume.*same attached task.*no duplicate executor/i);
  assert.match(skill, /renewal.*telemetry.*completion/i);
  assert.match(skill, /one long-lived.*bridge.*not.*per operation/i);
  assert.match(skill, /trusted.*agentgraph root/i);
  assert.match(skill, /clean.*checkpoint head.*ancestor/i);
  assert.match(skill, /host-derived metrics.*completion.*after.*verifier.*passes/i);
});

test('Codex app bridge maps create_thread and wait_threads results to assignment callbacks', async () => {
  const calls = [];
  const bridge = createCodexAppTaskBridge({
    createThread: async (request) => {
      calls.push(['create', request]);
      return JSON.stringify({ threadId: 'thread-live-1', hostId: 'local' });
    },
    waitThreads: async (request) => {
      calls.push(['wait', request]);
      return {
        timedOut: false,
        wake: { reason: 'turnCompleted', threadId: 'thread-live-1', hostId: 'local' },
        polls: [
          {
            cursor: 'cursor-1',
            thread: { id: 'thread-live-1', hostId: 'local', status: { type: 'idle' } },
            latestTurn: { status: 'completed', error: null },
            latestAssistantMessage: { text: '{"kind":"completion"}' },
          },
        ],
      };
    },
  });
  const task = await bridge.createTask({
    prompt: 'assignment prompt',
    target: { type: 'project', projectId: 'project-1', environment: { type: 'local' } },
  });
  const outcome = await bridge.waitForAny([
    {
      assignmentId: 'assignment:A:1:executor',
      threadId: task.threadId,
      hostId: task.hostId,
    },
  ]);

  assert.deepEqual(task, { threadId: 'thread-live-1', hostId: 'local' });
  assert.deepEqual(outcome, {
    assignmentId: 'assignment:A:1:executor',
    status: 'completed',
    final: '{"kind":"completion"}',
    cursor: 'cursor-1',
  });
  assert.equal(calls[0][0], 'create');
  assert.equal(calls[1][0], 'wait');
});

test('Python lifecycle bridge uses one long-lived supervisor process for all operations', async () => {
  let spawnCount = 0;
  const operations = [];
  const child = new EventEmitter();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.stdin = {
    write(line) {
      const request = JSON.parse(line);
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
  await bridge.close();

  assert.equal(spawnCount, 1);
  assert.deepEqual(operations, ['resume', 'heartbeat', 'telemetry', 'completion', 'shutdown']);
  assert.equal(JSON.stringify(operations).includes('capability'), false);
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
  assert.deepEqual(snapshots[0].taskRegistry['assignment:SAFE:1:executor'], {
    assignmentId: 'assignment:SAFE:1:executor',
    threadId: 'thread-existing-executor',
    hostId: 'local',
    cursor: 'cursor-executor-1',
    role: 'executor',
    nodeId: 'SAFE',
    status: 'running',
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

test('rejects private material from the lifecycle supervisor before reusing or creating a task', async () => {
  const root = mkdtempSync(join(tmpdir(), 'agentgraph-controller-secret-'));
  const registryPath = join(root, 'registry.json');
  const recoveryAuditPath = join(root, 'recovery-audit.json');
  writeFileSync(registryPath, '{}');
  writeFileSync(recoveryAuditPath, '{}');
  let creates = 0;
  const adapter = taskRunner.createInjectedHostTaskControlAdapter({
    taskControl: {
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

  await assert.rejects(
    () =>
      adapter.createTask({
        assignment: {
          id: 'assignment:SAFE:1:executor',
          nodeId: 'SAFE',
          workerId: 'executor-1',
          role: 'executor',
        },
        prompt: 'unused',
        target: {},
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
        completion.evidence.at(-1),
      ]);
      return { event: { event_type: 'checkpoint_completed' } };
    },
  };
  let verifierCreates = 0;
  const result = await runAuthoritativeLedgerWaveWithAttachedHostTasks({
    ledgerInput: attachedLedgerInput(),
    attachedTasks: [{ ...attachedExecutor(), status: 'needs-attention' }],
    lifecycleSupervisor: supervisor,
    lifecycleRecovery: {
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
    },
    taskControl: {
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
    now: () => '2026-07-30T23:30:00.000Z',
  });

  assert.equal(result.status, 'complete');
  assert.equal(verifierCreates, 1);
  assert.deepEqual(
    operations.map((operation) => operation[0]),
    ['resume', 'heartbeat', 'telemetry', 'heartbeat', 'completion'],
  );
  assert.deepEqual(operations.at(-1)[3], {
    kind: 'agentgraph-verification',
    assignmentId: 'assignment:SAFE:1:verifier',
    artifactId: 'artifact:SAFE:1',
    evidence: ['independent check'],
  });
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
    snapshots.at(-1).taskRegistry['assignment:SAFE:1:executor'],
    {
      assignmentId: 'assignment:SAFE:1:executor',
      threadId: 'thread-existing-executor',
      hostId: 'local',
      cursor: 'cursor-needs-attention',
      role: 'executor',
      nodeId: 'SAFE',
      status: 'needs_attention',
      error: 'official lifecycle writer lease is unavailable',
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
