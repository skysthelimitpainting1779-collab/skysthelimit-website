import { selectAgentAssignments } from './orchestration-policy.mjs';

const RISK_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const DEFAULT_EXECUTION_BOUNDARY = Object.freeze({
  allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
  allowReadOnlyProductionMetadata: true,
  allowPreviewDeployments: true,
  allowTestSandboxIntegrations: true,
  allowProductionMutations: false,
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function graphNodes(graph) {
  if (!isRecord(graph) || !Array.isArray(graph.nodes)) {
    throw new Error('graph.nodes must be an array');
  }
  const ids = new Set();
  for (const node of graph.nodes) {
    if (!isRecord(node) || typeof node.id !== 'string' || !node.id.trim()) {
      throw new Error('every graph node must have a non-empty id');
    }
    if (ids.has(node.id)) throw new Error(`duplicate graph node id: ${node.id}`);
    ids.add(node.id);
  }
  for (const node of graph.nodes) {
    for (const dependency of node.dependsOn || []) {
      if (!ids.has(dependency)) {
        throw new Error(`${node.id} depends on unknown node: ${dependency}`);
      }
    }
  }
  return graph.nodes;
}

function normalizedNow(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.valueOf())) throw new Error('now must be a valid timestamp');
  return date.toISOString();
}

function nodeRisk(node) {
  const tier = typeof node.risk === 'string' ? node.risk : node.risk?.tier;
  return RISK_RANK[tier] || 1;
}

function executionEnvironment(node) {
  const explicit = node.execution?.environment || node.environment;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim().toLowerCase();
  const permissions = (node.permissions || []).map((permission) => String(permission).toLowerCase());
  if (permissions.some((permission) => permission.includes('production'))) return 'production';
  if (permissions.some((permission) => permission.includes('preview'))) return 'preview';
  if (permissions.some((permission) => permission.includes('sandbox'))) return 'sandbox';
  if (permissions.some((permission) => permission.includes('test'))) return 'test';
  return 'local';
}

function mutatingPermission(permission) {
  return /(^|:)(write|mutate|delete|promote|publish|send|deploy)(:|$)/i.test(permission);
}

export function evaluateNodeExecutionBoundary(
  node,
  executionBoundary = DEFAULT_EXECUTION_BOUNDARY,
) {
  const boundary = { ...DEFAULT_EXECUTION_BOUNDARY, ...(executionBoundary || {}) };
  const environment = executionEnvironment(node);
  const permissions = (node.permissions || []).map(String);
  const mutations = permissions.filter(mutatingPermission);
  const productionScoped = permissions.some((permission) => /production/i.test(permission));
  const ambiguousProviderMutation = mutations.some(
    (permission) =>
      /provider|deploy(?:ment)?/i.test(permission) &&
      !/preview|test|sandbox/i.test(permission) &&
      !/production/i.test(permission),
  );

  if (
    node.productionSideEffects === true ||
    (environment === 'production' && mutations.length > 0 && !boundary.allowProductionMutations) ||
    (productionScoped && mutations.length > 0 && !boundary.allowProductionMutations) ||
    (ambiguousProviderMutation && !boundary.allowProductionMutations)
  ) {
    return {
      eligible: false,
      environment,
      reason: 'production/provider mutation is outside the execution boundary',
    };
  }
  if (environment === 'production') {
    return {
      eligible: boundary.allowReadOnlyProductionMetadata === true && mutations.length === 0,
      environment,
      reason:
        boundary.allowReadOnlyProductionMetadata === true && mutations.length === 0
          ? null
          : 'production access is limited to read-only metadata',
    };
  }
  if (
    environment === 'preview' &&
    mutations.some((permission) => /deploy(?:ment)?/i.test(permission)) &&
    boundary.allowPreviewDeployments !== true
  ) {
    return { eligible: false, environment, reason: 'preview deployments are disabled' };
  }
  if (
    ['test', 'sandbox'].includes(environment) &&
    mutations.some((permission) => /integration/i.test(permission)) &&
    boundary.allowTestSandboxIntegrations !== true
  ) {
    return { eligible: false, environment, reason: 'test/sandbox integrations are disabled' };
  }
  const allowed = new Set(boundary.allowedEnvironments || []);
  return {
    eligible: allowed.has(environment),
    environment,
    reason: allowed.has(environment) ? null : `environment is not allowed: ${environment}`,
  };
}

function sortedWorkers(workers, capability) {
  return [...(workers || [])]
    .filter(
      (worker) =>
        isRecord(worker) &&
        typeof worker.id === 'string' &&
        worker.id.trim() &&
        worker.available !== false &&
        (worker.capabilities || []).includes(capability),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

function activeAssignments(state) {
  return Object.values(state.nodes)
    .flatMap((node) => [node.executorAssignment, node.verifierAssignment])
    .filter(Boolean)
    .filter((assignment) => {
      const node = state.nodes[assignment.nodeId];
      if (assignment.role === 'executor') return node.status === 'assigned';
      return node.status === 'awaiting_verification';
    });
}

function activeAssignmentsByRole(state, role) {
  return activeAssignments(state).filter((assignment) => assignment.role === role);
}

function result(state, newAssignments = []) {
  return {
    status: state.status,
    state,
    newAssignments,
    report: state.halt,
  };
}

function halt(state, report) {
  state.status = 'halted';
  state.halt = report;
  return result(state);
}

function completionArtifact(completion) {
  if (!isRecord(completion?.artifact)) return null;
  if (typeof completion.artifact.id !== 'string' || !completion.artifact.id.trim()) return null;
  return completion.artifact;
}

function verificationIsImported(record) {
  return (
    isRecord(record) &&
    typeof record.nodeId === 'string' &&
    completionArtifact(record) !== null &&
    isRecord(record.verification) &&
    record.verification.passed === true
  );
}

export function createAgentGraphExecutionState(graph, options = {}) {
  const nodes = graphNodes(graph);
  const state = {
    schemaVersion: '1.0.0',
    status: 'idle',
    nodes: Object.fromEntries(
      nodes.map((node) => [
        node.id,
        {
          status: 'pending',
          attempt: 0,
          executorAssignment: null,
          completionArtifact: null,
          verifierAssignment: null,
          verification: null,
        },
      ]),
    ),
    halt: null,
  };

  for (const imported of options.verifiedCompletions || []) {
    if (!verificationIsImported(imported) || !state.nodes[imported.nodeId]) {
      throw new Error('imported completions require a known node, an artifact, and passing verification');
    }
    const runtime = state.nodes[imported.nodeId];
    runtime.status = 'completed';
    runtime.completionArtifact = clone(imported.artifact);
    runtime.verification = clone(imported.verification);
  }
  return state;
}

function assertStateMatchesGraph(graph, state) {
  if (!isRecord(state) || state.schemaVersion !== '1.0.0' || !isRecord(state.nodes)) {
    throw new Error('state must be an AgentGraph execution state');
  }
  const expected = graphNodes(graph)
    .map((node) => node.id)
    .sort((a, b) => a.localeCompare(b));
  const actual = Object.keys(state.nodes).sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error('state nodes do not match graph nodes');
  }
}

export function readyPlanNodeIds(graph, state, options = {}) {
  assertStateMatchesGraph(graph, state);
  const completed = new Set(
    Object.entries(state.nodes)
      .filter(([, runtime]) => runtime.status === 'completed')
      .map(([nodeId]) => nodeId),
  );
  return graphNodes(graph)
    .filter((node) => state.nodes[node.id].status === 'pending')
    .filter((node) => node.blocked !== true && node.status !== 'blocked')
    .filter((node) => (node.dependsOn || []).every((dependency) => completed.has(dependency)))
    .filter(
      (node) =>
        evaluateNodeExecutionBoundary(node, options.executionBoundary || DEFAULT_EXECUTION_BOUNDARY)
          .eligible,
    )
    .map((node) => node.id)
    .sort((a, b) => a.localeCompare(b));
}

function invalidCompletionReport(completion, reportedAt, error) {
  return {
    reason: 'invalid_completion_artifact',
    nodeIds: completion?.nodeId ? [completion.nodeId] : [],
    errors: [error],
    reportedAt,
  };
}

function applyCompletions(state, completions, reportedAt) {
  for (const completion of completions) {
    const runtime = state.nodes[completion?.nodeId];
    const artifact = completionArtifact(completion);
    if (!runtime) {
      return invalidCompletionReport(completion, reportedAt, 'completion references an unknown node');
    }
    if (runtime.status !== 'assigned' || !runtime.executorAssignment) {
      return invalidCompletionReport(completion, reportedAt, 'node has no active executor assignment');
    }
    if (completion.assignmentId !== runtime.executorAssignment.id) {
      return invalidCompletionReport(completion, reportedAt, 'completion is not bound to the active assignment');
    }
    if (completion.workerId && completion.workerId !== runtime.executorAssignment.workerId) {
      return invalidCompletionReport(completion, reportedAt, 'completion worker does not own the active assignment');
    }
    if (typeof completion.error === 'string' && completion.error.trim()) {
      return invalidCompletionReport(completion, reportedAt, completion.error.trim());
    }
    if (!artifact) {
      return invalidCompletionReport(completion, reportedAt, 'completion requires an artifact with a non-empty id');
    }
    runtime.completionArtifact = clone(artifact);
    runtime.status = 'awaiting_verification';
  }
  return null;
}

function assignVerifiers(graph, state, workers, createdAt) {
  const byId = new Map(graphNodes(graph).map((node) => [node.id, node]));
  const usedWorkers = new Set(activeAssignments(state).map((assignment) => assignment.workerId));
  const verifierWorkers = sortedWorkers(workers, 'verify');
  const assignments = [];

  const awaiting = Object.entries(state.nodes)
    .filter(([, runtime]) => runtime.status === 'awaiting_verification' && !runtime.verifierAssignment)
    .sort(([a], [b]) => nodeRisk(byId.get(b)) - nodeRisk(byId.get(a)) || a.localeCompare(b));

  for (const [nodeId, runtime] of awaiting) {
    const node = byId.get(nodeId);
    const worker = verifierWorkers.find(
      (candidate) =>
        !usedWorkers.has(candidate.id) &&
        candidate.id !== runtime.executorAssignment.workerId,
    );
    if (!worker) {
      return {
        assignments,
        blocker: {
          reason: 'no_verifier_available',
          nodeIds: [nodeId],
          artifactIds: [runtime.completionArtifact.id],
          reportedAt: createdAt,
        },
      };
    }
    const assignment = {
      id: `assignment:${nodeId}:${runtime.attempt}:verifier`,
      nodeId,
      workerId: worker.id,
      role: 'verifier',
      attempt: runtime.attempt,
      artifactId: runtime.completionArtifact.id,
      requiredEvidence: clone(node.verification?.requiredEvidence || []),
      successCondition: node.verification?.successCondition || null,
      createdAt,
    };
    runtime.verifierAssignment = assignment;
    assignments.push(assignment);
    usedWorkers.add(worker.id);
  }
  return { assignments, blocker: null };
}

function invalidVerificationReport(verification, reportedAt, error) {
  return {
    reason: 'invalid_verification',
    nodeIds: verification?.nodeId ? [verification.nodeId] : [],
    errors: [error],
    reportedAt,
  };
}

function applyVerifications(state, verifications, reportedAt) {
  for (const verification of verifications) {
    const runtime = state.nodes[verification?.nodeId];
    if (!runtime || runtime.status !== 'awaiting_verification' || !runtime.verifierAssignment) {
      return invalidVerificationReport(
        verification,
        reportedAt,
        'node has no active verifier assignment',
      );
    }
    if (verification.assignmentId !== runtime.verifierAssignment.id) {
      return invalidVerificationReport(
        verification,
        reportedAt,
        'verification is not bound to the active assignment',
      );
    }
    if (verification.workerId !== runtime.verifierAssignment.workerId) {
      return invalidVerificationReport(
        verification,
        reportedAt,
        'verification worker does not own the active assignment',
      );
    }
    if (verification.workerId === runtime.executorAssignment?.workerId) {
      return invalidVerificationReport(
        verification,
        reportedAt,
        'verification must be independent from the executor worker',
      );
    }
    if (verification.artifactId !== runtime.completionArtifact.id) {
      return invalidVerificationReport(
        verification,
        reportedAt,
        'verification is not bound to the completion artifact',
      );
    }
    if (verification.passed !== true) {
      runtime.status = 'verification_failed';
      runtime.verification = clone(verification);
      return {
        reason: 'verification_failed',
        nodeIds: [verification.nodeId],
        errors: clone(verification.errors || ['verification did not pass']),
        reportedAt,
      };
    }
    runtime.verification = clone(verification);
    runtime.status = 'completed';
  }
  return null;
}

function assignExecutors(
  graph,
  state,
  workers,
  createdAt,
  maxConcurrentExecutors,
  executionBoundary,
) {
  const byId = new Map(graphNodes(graph).map((node) => [node.id, node]));
  const activeExecutors = activeAssignmentsByRole(state, 'executor');
  const capacity = Math.max(0, maxConcurrentExecutors - activeExecutors.length);
  if (capacity === 0) return { assignments: [], blocker: null };

  const usedWorkers = new Set(activeAssignments(state).map((assignment) => assignment.workerId));
  const ready = readyPlanNodeIds(graph, state, { executionBoundary })
    .map((nodeId) => byId.get(nodeId))
    .sort((a, b) => nodeRisk(b) - nodeRisk(a) || a.id.localeCompare(b.id));
  const completed = new Set(
    Object.entries(state.nodes)
      .filter(([, runtime]) => runtime.status === 'completed')
      .map(([nodeId]) => nodeId),
  );
  const boundaryBlocked = graphNodes(graph)
    .filter((node) => state.nodes[node.id].status === 'pending')
    .filter((node) => node.blocked !== true && node.status !== 'blocked')
    .filter((node) => (node.dependsOn || []).every((dependency) => completed.has(dependency)))
    .filter((node) => !evaluateNodeExecutionBoundary(node, executionBoundary).eligible);
  const assignments = [];
  const policyAssignments = selectAgentAssignments({
    agents: (workers || []).filter((worker) => !usedWorkers.has(worker?.id)),
    readyNodes: ready.slice(0, capacity).map((node) => ({
      id: node.id,
      risk: typeof node.risk === 'string' ? node.risk : node.risk?.tier,
    })),
    verifierQueueDepth: 0,
  }).assignments.filter((assignment) => assignment.role === 'executor');

  if (ready.length === 0 && boundaryBlocked.length > 0 && activeExecutors.length === 0) {
    return {
      assignments,
      blocker: {
        reason: 'execution_boundary_blocked',
        nodeIds: boundaryBlocked.map((node) => node.id).sort(),
        errors: boundaryBlocked
          .map((node) => evaluateNodeExecutionBoundary(node, executionBoundary).reason)
          .filter(Boolean),
        reportedAt: createdAt,
      },
    };
  }
  if (ready.length > 0 && policyAssignments.length === 0 && activeExecutors.length === 0) {
    return {
      assignments,
      blocker: {
        reason: 'no_executor_available',
        nodeIds: ready.map((item) => item.id),
        reportedAt: createdAt,
      },
    };
  }

  for (const selected of policyAssignments) {
    const node = byId.get(selected.nodeId);
    const runtime = state.nodes[node.id];
    runtime.attempt += 1;
    const assignment = {
      id: `assignment:${node.id}:${runtime.attempt}:executor`,
      nodeId: node.id,
      workerId: selected.agentId,
      role: 'executor',
      attempt: runtime.attempt,
      objective: node.objective || node.title || node.id,
      inputs: clone(node.inputs || []),
      expectedOutputs: clone(node.outputs || []),
      createdAt,
    };
    runtime.executorAssignment = assignment;
    runtime.status = 'assigned';
    assignments.push(assignment);
  }
  return { assignments, blocker: null };
}

function allCompleted(state) {
  return Object.values(state.nodes).every((node) => node.status === 'completed');
}

export function dispatchAgentGraph(input) {
  const { graph, workers = [] } = input || {};
  const createdAt = normalizedNow(input?.now);
  assertStateMatchesGraph(graph, input?.state);

  if (input.state.status === 'halted' || input.state.status === 'complete') {
    return result(clone(input.state));
  }

  const state = clone(input.state);
  const nonIndependentNodeIds = graphNodes(graph)
    .filter(
      (node) =>
        state.nodes[node.id]?.status !== 'completed' &&
        node.verification?.independent !== true,
    )
    .map((node) => node.id)
    .sort();
  if (nonIndependentNodeIds.length > 0) {
    return halt(state, {
      reason: 'independent_verification_required',
      nodeIds: nonIndependentNodeIds,
      errors: ['every executable node requires independent verification'],
      reportedAt: createdAt,
    });
  }
  const completions = input.completions || [];
  const verifications = input.verifications || [];
  if (!Array.isArray(completions)) throw new Error('completions must be an array');
  if (!Array.isArray(verifications)) throw new Error('verifications must be an array');

  const executorsAtStart = activeAssignmentsByRole(state, 'executor');
  const verifiersAtStart = activeAssignmentsByRole(state, 'verifier');
  if (completions.length === 0 && verifications.length === 0 && executorsAtStart.length > 0) {
    return halt(state, {
      reason: 'no_completion_arrived',
      nodeIds: executorsAtStart.map((assignment) => assignment.nodeId).sort(),
      assignmentIds: executorsAtStart.map((assignment) => assignment.id).sort(),
      reportedAt: createdAt,
    });
  }
  if (completions.length === 0 && verifications.length === 0 && verifiersAtStart.length > 0) {
    return halt(state, {
      reason: 'no_verification_arrived',
      nodeIds: verifiersAtStart.map((assignment) => assignment.nodeId).sort(),
      assignmentIds: verifiersAtStart.map((assignment) => assignment.id).sort(),
      reportedAt: createdAt,
    });
  }

  const completionFailure = applyCompletions(state, completions, createdAt);
  if (completionFailure) return halt(state, completionFailure);

  const verifierDispatch = assignVerifiers(graph, state, workers, createdAt);
  if (verifierDispatch.blocker) return halt(state, verifierDispatch.blocker);

  const verificationFailure = applyVerifications(state, verifications, createdAt);
  if (verificationFailure) return halt(state, verificationFailure);

  if (allCompleted(state)) {
    state.status = 'complete';
    state.halt = null;
    return result(state, verifierDispatch.assignments);
  }

  const executorDispatch = assignExecutors(
    graph,
    state,
    workers,
    createdAt,
    Number.isInteger(input.maxConcurrentExecutors) && input.maxConcurrentExecutors > 0
      ? input.maxConcurrentExecutors
      : 2,
    input.executionBoundary || DEFAULT_EXECUTION_BOUNDARY,
  );
  if (executorDispatch.blocker) return halt(state, executorDispatch.blocker);

  const newAssignments = [...verifierDispatch.assignments, ...executorDispatch.assignments];
  if (newAssignments.length > 0) state.status = 'dispatched';
  else if (activeAssignments(state).length > 0) state.status = 'waiting';
  else {
    const pending = Object.entries(state.nodes)
      .filter(([, node]) => node.status === 'pending')
      .map(([nodeId]) => nodeId)
      .sort();
    return halt(state, {
      reason: 'dependency_deadlock',
      nodeIds: pending,
      reportedAt: createdAt,
    });
  }
  state.halt = null;
  return result(state, newAssignments);
}
