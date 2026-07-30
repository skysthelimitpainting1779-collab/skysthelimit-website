import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('prompt requires the official in-process lifecycle fallback and lease heartbeat', () => {
  const graph = proofGraph();
  const state = createAgentGraphExecutionState(graph);
  const assignment = {
    id: 'assignment:READ-PACKAGE:1:executor',
    nodeId: 'READ-PACKAGE',
    workerId: 'codex-executor-1',
    role: 'executor',
  };

  const prompt = createCodexAssignmentPrompt({ graph, state, assignment });

  assert.match(prompt, /app-registry lifecycle MCP exposure is unavailable/i);
  assert.match(prompt, /official in-process .*mcp_server\.py.*function transport/i);
  assert.match(prompt, /import .*mcp_server\.py.*exactly once/i);
  assert.match(prompt, /do not start an MCP subprocess/i);
  assert.match(prompt, /do not edit the lifecycle database/i);
  assert.match(prompt, /lease capability.*memory.*never print.*persist/i);
  assert.match(prompt, /lifecycle_checkpoint_renew.*before.*lease.*expires/i);
  assert.match(prompt, /renewal and recovery.*legitimate dirty execution/i);
  assert.match(prompt, /repository.*branch.*HEAD.*unchanged/i);
  assert.match(prompt, /lifecycle_checkpoint_recover.*actor.*session.*grace/i);
});

test('wave skill carries the in-process lifecycle fallback and heartbeat contract', () => {
  const skill = readFileSync(
    '.agents/skills/agentgraph-wave-execution/SKILL.md',
    'utf8',
  );

  assert.match(skill, /app-registry lifecycle MCP exposure is unavailable/i);
  assert.match(skill, /official in-process .*mcp_server\.py.*function transport/i);
  assert.match(skill, /import .*mcp_server\.py.*exactly once/i);
  assert.match(skill, /do not start an MCP subprocess/i);
  assert.match(skill, /do not edit the lifecycle database/i);
  assert.match(skill, /lease capability.*memory.*never print.*persist/i);
  assert.match(skill, /lifecycle_checkpoint_renew.*before.*lease.*expires/i);
  assert.match(skill, /renewal and recovery.*legitimate dirty execution/i);
  assert.match(skill, /repository.*branch.*HEAD.*unchanged/i);
  assert.match(skill, /lifecycle_checkpoint_recover.*actor.*session.*grace/i);
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
