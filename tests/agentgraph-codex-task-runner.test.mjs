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
