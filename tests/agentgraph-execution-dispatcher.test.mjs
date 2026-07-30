import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAgentGraphExecutionState,
  dispatchAgentGraph,
  readyPlanNodeIds,
} from '../scripts/lib/agentgraph-execution-dispatcher.mjs';

const NOW = '2026-07-30T18:00:00.000Z';

function graph() {
  return {
    nodes: [
      {
        id: 'A',
        title: 'Build foundation',
        status: 'pending',
        dependsOn: [],
        objective: 'Build the foundation.',
        inputs: ['plan'],
        outputs: ['foundation-artifact'],
        risk: { tier: 'high' },
        execution: { maxAttempts: 2 },
        verification: {
          independent: true,
          requiredEvidence: ['focused tests'],
          successCondition: 'Focused tests pass.',
        },
      },
      {
        id: 'B',
        title: 'Use foundation',
        status: 'pending',
        dependsOn: ['A'],
        objective: 'Use the verified foundation.',
        inputs: ['foundation-artifact'],
        outputs: ['dependent-artifact'],
        risk: { tier: 'low' },
        execution: { maxAttempts: 1 },
        verification: {
          independent: true,
          requiredEvidence: ['dependent tests'],
          successCondition: 'Dependent tests pass.',
        },
      },
    ],
  };
}

function workers() {
  return [
    { id: 'executor-1', capabilities: ['execute'] },
    { id: 'verifier-1', capabilities: ['verify'] },
  ];
}

test('turns dependency-ready plan nodes into concrete executor assignments', () => {
  const initial = createAgentGraphExecutionState(graph());
  assert.deepEqual(readyPlanNodeIds(graph(), initial), ['A']);

  const result = dispatchAgentGraph({
    graph: graph(),
    state: initial,
    workers: workers(),
    now: NOW,
  });

  assert.equal(result.status, 'dispatched');
  assert.deepEqual(result.newAssignments, [
    {
      id: 'assignment:A:1:executor',
      nodeId: 'A',
      workerId: 'executor-1',
      role: 'executor',
      attempt: 1,
      objective: 'Build the foundation.',
      inputs: ['plan'],
      expectedOutputs: ['foundation-artifact'],
      createdAt: NOW,
    },
  ]);
  assert.equal(result.state.nodes.A.status, 'assigned');
  assert.equal(result.state.nodes.B.status, 'pending');
});

test('keeps dependents locked after an artifact until independent verification passes', () => {
  const first = dispatchAgentGraph({
    graph: graph(),
    state: createAgentGraphExecutionState(graph()),
    workers: workers(),
    now: NOW,
  });
  const completion = {
    nodeId: 'A',
    assignmentId: 'assignment:A:1:executor',
    workerId: 'executor-1',
    artifact: {
      id: 'artifact:A:1',
      evidence: ['focused tests'],
      summary: 'Foundation implemented.',
    },
  };

  const awaitingVerification = dispatchAgentGraph({
    graph: graph(),
    state: first.state,
    workers: workers(),
    completions: [completion],
    now: NOW,
  });

  assert.equal(awaitingVerification.state.nodes.A.status, 'awaiting_verification');
  assert.equal(awaitingVerification.state.nodes.B.status, 'pending');
  assert.deepEqual(readyPlanNodeIds(graph(), awaitingVerification.state), []);
  assert.deepEqual(awaitingVerification.newAssignments, [
    {
      id: 'assignment:A:1:verifier',
      nodeId: 'A',
      workerId: 'verifier-1',
      role: 'verifier',
      attempt: 1,
      artifactId: 'artifact:A:1',
      requiredEvidence: ['focused tests'],
      successCondition: 'Focused tests pass.',
      createdAt: NOW,
    },
  ]);

  const verified = dispatchAgentGraph({
    graph: graph(),
    state: awaitingVerification.state,
    workers: workers(),
    verifications: [
      {
        nodeId: 'A',
        assignmentId: 'assignment:A:1:verifier',
        workerId: 'verifier-1',
        artifactId: 'artifact:A:1',
        passed: true,
        evidence: ['focused tests'],
      },
    ],
    now: NOW,
  });

  assert.equal(verified.state.nodes.A.status, 'completed');
  assert.equal(verified.state.nodes.B.status, 'assigned');
  assert.equal(verified.newAssignments[0].nodeId, 'B');
  assert.equal(verified.newAssignments[0].role, 'executor');
});

test('does not mark a node complete when verification fails', () => {
  const assigned = dispatchAgentGraph({
    graph: graph(),
    state: createAgentGraphExecutionState(graph()),
    workers: workers(),
    now: NOW,
  });
  const awaiting = dispatchAgentGraph({
    graph: graph(),
    state: assigned.state,
    workers: workers(),
    completions: [
      {
        nodeId: 'A',
        assignmentId: 'assignment:A:1:executor',
        artifact: { id: 'artifact:A:1', evidence: ['focused tests'] },
      },
    ],
    now: NOW,
  });

  const result = dispatchAgentGraph({
    graph: graph(),
    state: awaiting.state,
    workers: workers(),
    verifications: [
      {
        nodeId: 'A',
        assignmentId: 'assignment:A:1:verifier',
        workerId: 'verifier-1',
        artifactId: 'artifact:A:1',
        passed: false,
        errors: ['focused tests failed'],
      },
    ],
    now: NOW,
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.state.nodes.A.status, 'verification_failed');
  assert.equal(result.state.nodes.B.status, 'pending');
  assert.equal(result.report.reason, 'verification_failed');
});

test('halts and reports once when an assigned worker returns no completion', () => {
  const assigned = dispatchAgentGraph({
    graph: graph(),
    state: createAgentGraphExecutionState(graph()),
    workers: workers(),
    now: NOW,
  });

  const halted = dispatchAgentGraph({
    graph: graph(),
    state: assigned.state,
    workers: workers(),
    now: '2026-07-30T18:01:00.000Z',
  });

  assert.equal(halted.status, 'halted');
  assert.deepEqual(halted.newAssignments, []);
  assert.deepEqual(halted.report, {
    reason: 'no_completion_arrived',
    nodeIds: ['A'],
    assignmentIds: ['assignment:A:1:executor'],
    reportedAt: '2026-07-30T18:01:00.000Z',
  });

  const repeated = dispatchAgentGraph({
    graph: graph(),
    state: halted.state,
    workers: workers(),
    now: '2026-07-30T18:02:00.000Z',
  });

  assert.equal(repeated.status, 'halted');
  assert.deepEqual(repeated.newAssignments, []);
  assert.deepEqual(repeated.report, halted.report);
  assert.deepEqual(repeated.state, halted.state);
});

test('rejects stale completion artifacts that are not bound to the active assignment', () => {
  const assigned = dispatchAgentGraph({
    graph: graph(),
    state: createAgentGraphExecutionState(graph()),
    workers: workers(),
    now: NOW,
  });

  const result = dispatchAgentGraph({
    graph: graph(),
    state: assigned.state,
    workers: workers(),
    completions: [
      {
        nodeId: 'A',
        assignmentId: 'assignment:A:0:executor',
        artifact: { id: 'artifact:A:stale' },
      },
    ],
    now: NOW,
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.report.reason, 'invalid_completion_artifact');
  assert.equal(result.state.nodes.A.status, 'assigned');
  assert.equal(result.state.nodes.B.status, 'pending');
});

test('reports the exact worker failure instead of reducing it to a missing artifact', () => {
  const assigned = dispatchAgentGraph({
    graph: graph(),
    state: createAgentGraphExecutionState(graph()),
    workers: workers(),
    now: NOW,
  });
  const result = dispatchAgentGraph({
    graph: graph(),
    state: assigned.state,
    workers: workers(),
    completions: [
      {
        nodeId: 'A',
        assignmentId: 'assignment:A:1:executor',
        workerId: 'executor-1',
        artifact: null,
        error: 'Codex CLI could not start',
      },
    ],
    now: NOW,
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.report.reason, 'invalid_completion_artifact');
  assert.deepEqual(result.report.errors, ['Codex CLI could not start']);
});

test('ready-node selection allows local, preview, sandbox, and production-read work but rejects production mutation', () => {
  const boundaryGraph = {
    nodes: [
      {
        id: 'LOCAL',
        dependsOn: [],
        execution: { environment: 'local' },
        permissions: ['repository:write'],
      },
      {
        id: 'PREVIEW',
        dependsOn: [],
        execution: { environment: 'preview' },
        permissions: ['deployment:preview:write'],
      },
      {
        id: 'SANDBOX',
        dependsOn: [],
        execution: { environment: 'sandbox' },
        permissions: ['integration:sandbox:write'],
      },
      {
        id: 'PRODUCTION-READ',
        dependsOn: [],
        execution: { environment: 'production' },
        permissions: ['deployment:production:read'],
      },
      {
        id: 'PRODUCTION-WRITE',
        dependsOn: [],
        execution: { environment: 'production' },
        permissions: ['deployment:production:promote'],
      },
    ],
  };
  const boundary = {
    allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
    allowReadOnlyProductionMetadata: true,
    allowPreviewDeployments: true,
    allowTestSandboxIntegrations: true,
    allowProductionMutations: false,
  };

  assert.deepEqual(
    readyPlanNodeIds(boundaryGraph, createAgentGraphExecutionState(boundaryGraph), {
      executionBoundary: boundary,
    }),
    ['LOCAL', 'PREVIEW', 'PRODUCTION-READ', 'SANDBOX'],
  );
});

test('reports an execution-boundary blocker when the only dependency-ready node mutates production', () => {
  const boundaryGraph = {
    nodes: [
      {
        id: 'PROMOTE-PRODUCTION',
        dependsOn: [],
        execution: { environment: 'production' },
        permissions: ['deployment:production:promote'],
      },
    ],
  };
  const result = dispatchAgentGraph({
    graph: boundaryGraph,
    state: createAgentGraphExecutionState(boundaryGraph),
    workers: [{ id: 'executor-1', capabilities: ['execute'] }],
    executionBoundary: {
      allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
      allowReadOnlyProductionMetadata: true,
      allowPreviewDeployments: true,
      allowTestSandboxIntegrations: true,
      allowProductionMutations: false,
    },
    now: NOW,
  });

  assert.equal(result.status, 'halted');
  assert.equal(result.report.reason, 'execution_boundary_blocked');
  assert.deepEqual(result.report.nodeIds, ['PROMOTE-PRODUCTION']);
});
