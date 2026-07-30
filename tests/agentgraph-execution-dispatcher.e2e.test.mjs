import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import {
  createAgentGraphExecutionState,
  dispatchAgentGraph,
} from '../scripts/lib/agentgraph-execution-dispatcher.mjs';

const NOW = '2026-07-30T20:00:00.000Z';
const AUDIT_PATH =
  '.agents/execution/inputs/audit-baseline-17a53d8155e73ce5505a0a53d62b2356dd6ddd4a3c0e9d1db2c4528943a5afc1.md';

test('executes and verifies the real read-only repository inspection node', () => {
  const compiled = JSON.parse(readFileSync('.graph/graph.json', 'utf8')).graph;
  const node = compiled.nodes.find((candidate) => candidate.id === 'INSPECT-REPOSITORY');
  assert.ok(node, 'compiled graph must contain INSPECT-REPOSITORY');
  const graph = { nodes: [node] };
  const workers = [
    { id: 'local-readonly-executor', capabilities: ['execute'] },
    { id: 'local-independent-verifier', capabilities: ['verify'] },
  ];

  const assigned = dispatchAgentGraph({
    graph,
    state: createAgentGraphExecutionState(graph),
    workers,
    now: NOW,
  });
  assert.equal(assigned.newAssignments[0].id, 'assignment:INSPECT-REPOSITORY:1:executor');

  const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  assert.match(headSha, /^[0-9a-f]{40}$/);
  assert.ok(branch);
  assert.equal(existsSync(AUDIT_PATH), true);

  const artifact = {
    id: `repository-inspection:${headSha}`,
    evidence: ['audit file', 'repository commit', 'deployment evidence'],
    repository: {
      branch,
      headSha,
      auditPath: AUDIT_PATH,
    },
    deployment: {
      projectId: 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m',
      deploymentId: 'dpl_8ZdhJtg9zBjnJ35tx3BfFzoTmNhk',
      state: 'READY',
      target: null,
      source: 'git',
      commitSha: 'd916ca1e207584d4beabc08af6ee8e75f510e5b4',
      commitRef: 'agent/skys-limit-convex-os',
      collectedReadOnly: true,
    },
    productionSideEffects: false,
    providerMutations: false,
    readOnlyProviderEvidence: true,
  };
  const awaitingVerification = dispatchAgentGraph({
    graph,
    state: assigned.state,
    workers,
    completions: [
      {
        nodeId: node.id,
        assignmentId: assigned.newAssignments[0].id,
        workerId: 'local-readonly-executor',
        artifact,
      },
    ],
    now: NOW,
  });
  assert.equal(awaitingVerification.state.nodes[node.id].status, 'awaiting_verification');
  assert.equal(awaitingVerification.newAssignments[0].role, 'verifier');

  const missingEvidence = node.verification.requiredEvidence.filter(
    (required) => !artifact.evidence.includes(required),
  );
  assert.deepEqual(missingEvidence, []);

  const verified = dispatchAgentGraph({
    graph,
    state: awaitingVerification.state,
    workers,
    verifications: [
      {
        nodeId: node.id,
        assignmentId: awaitingVerification.newAssignments[0].id,
        workerId: 'local-independent-verifier',
        artifactId: artifact.id,
        passed: true,
        errors: [],
      },
    ],
    now: NOW,
  });

  assert.equal(verified.status, 'complete');
  assert.equal(verified.state.nodes[node.id].status, 'completed');
  assert.equal(verified.report, null);
  assert.equal(verified.newAssignments.length, 0);
  assert.equal(verified.state.nodes[node.id].completionArtifact.productionSideEffects, false);
  assert.equal(verified.state.nodes[node.id].completionArtifact.providerMutations, false);
  assert.equal(verified.state.nodes[node.id].completionArtifact.deployment.state, 'READY');
  assert.equal(verified.state.nodes[node.id].completionArtifact.deployment.target, null);
});
