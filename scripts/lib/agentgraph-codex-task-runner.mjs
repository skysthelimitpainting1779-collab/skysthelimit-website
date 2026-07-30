import { createHash } from 'node:crypto';
import { spawn as spawnChild } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

import {
  DEFAULT_EXECUTION_BOUNDARY,
  createAgentGraphExecutionState,
  dispatchAgentGraph,
  evaluateNodeExecutionBoundary,
} from './agentgraph-execution-dispatcher.mjs';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function parsedToolResult(value) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function graphNode(graph, nodeId) {
  return graph.nodes.find((node) => node.id === nodeId);
}

function assertSafeNode(node, executionBoundary) {
  if (!node) throw new Error('assignment references an unknown graph node');
  const decision = evaluateNodeExecutionBoundary(node, executionBoundary);
  if (!decision.eligible) {
    if (decision.reason?.includes('production/provider mutation')) {
      throw new Error(`production/provider mutation is forbidden for node ${node.id}`);
    }
    throw new Error(`${decision.reason} for node ${node.id}`);
  }
  return decision;
}

function callbackContract(assignment) {
  if (assignment.role === 'executor') {
    return {
      kind: 'completion',
      nodeId: assignment.nodeId,
      assignmentId: assignment.id,
      workerId: assignment.workerId,
      artifact: {
        id: 'non-empty artifact id',
        evidence: ['evidence labels'],
        summary: 'concise result',
        productionSideEffects: false,
        providerMutations: false,
      },
    };
  }
  return {
    kind: 'verification',
    nodeId: assignment.nodeId,
    assignmentId: assignment.id,
    workerId: assignment.workerId,
    artifactId: assignment.artifactId,
    passed: true,
    evidence: ['independently checked evidence'],
    errors: [],
  };
}

function resourceLocks(node) {
  const explicit = [...(node.resourceLocks || []), ...(node.locks || [])].map(String);
  const match = String(node.risk?.blastRadius || '').match(/resource locks?:\s*([^.;]+)/i);
  const embedded = match ? match[1].split(',').map((item) => item.trim()) : [];
  return [...new Set([...explicit, ...embedded].filter(Boolean))].sort();
}

function fileInputs(node) {
  return [...new Set((node.inputs || [])
    .filter((input) => typeof input === 'string' && input.startsWith('file:'))
    .map((input) => input.slice(5))
    .filter(Boolean))].sort();
}

export function createCodexWorkerAssignmentSpec({
  graph,
  state,
  assignment,
  target,
  executionBoundary = DEFAULT_EXECUTION_BOUNDARY,
}) {
  const node = graphNode(graph, assignment.nodeId);
  const boundaryDecision = assertSafeNode(node, executionBoundary);
  const artifact =
    assignment.role === 'verifier' ? state.nodes[assignment.nodeId].completionArtifact : null;
  const locks = resourceLocks(node);
  const conflicts = graph.nodes
    .filter((candidate) => candidate.id !== node.id)
    .filter((candidate) => resourceLocks(candidate).some((lock) => locks.includes(lock)))
    .map((candidate) => candidate.id)
    .sort();
  return {
    assignmentId: assignment.id,
    nodeId: node.id,
    title: node.title || node.id,
    role: assignment.role,
    workerId: assignment.workerId,
    objective: node.objective || node.title || node.id,
    dependencies: clone(node.dependsOn || []),
    target: {
      ...(target || {}),
      environment: target?.environment || boundaryDecision.environment,
    },
    allowedFiles: fileInputs(node),
    allowedActions: [...new Set((node.permissions || []).map(String))].sort(),
    expectedOutputs: clone(node.outputs || []),
    requiredEvidence: clone(node.verification?.requiredEvidence || []),
    verification: {
      independent: node.verification?.independent === true,
      checks: clone(node.verification?.checks || []),
      successCondition: node.verification?.successCondition || null,
      artifactId: artifact?.id || assignment.artifactId || null,
    },
    resourceLocks: locks,
    conflicts,
    constraints: {
      productionActions: false,
      productionMutations: false,
      productionMetadata: 'read-only',
      previewDeployments: executionBoundary.allowPreviewDeployments === true,
      testSandboxIntegrations: executionBoundary.allowTestSandboxIntegrations === true,
      executeDependents: false,
    },
  };
}

export function buildAuthoritativeLedgerWave(input) {
  if (input?.source?.kind !== 'authoritative-lifecycle-ledger') {
    throw new Error('ready-node input must come from the authoritative lifecycle ledger');
  }
  if (typeof input.source.revision !== 'string' || !input.source.revision.trim()) {
    throw new Error('authoritative lifecycle ledger input requires a revision');
  }
  if (!Array.isArray(input.readyNodes)) throw new Error('readyNodes must be an array');
  const completed = new Set(input.completedNodeIds || []);
  const boundary = { ...DEFAULT_EXECUTION_BOUNDARY, ...(input.boundary || {}) };
  const workers = [...(input.workers || [])]
    .filter((worker) => (worker.capabilities || []).includes('execute'))
    .sort((a, b) => a.id.localeCompare(b.id));
  const capacity = Math.min(
    Number.isInteger(input.maxConcurrentExecutors) && input.maxConcurrentExecutors > 0
      ? input.maxConcurrentExecutors
      : 2,
    workers.length,
  );
  const graph = { nodes: clone(input.readyNodes) };
  const state = {
    nodes: Object.fromEntries(
      input.readyNodes.map((node) => [
        node.id,
        {
          attempt: Number.isInteger(node.lifecycle?.attempt) ? node.lifecycle.attempt : 1,
          completionArtifact: null,
        },
      ]),
    ),
  };
  const assignments = [];
  const deferred = [];
  const blocked = [];
  const heldLocks = new Set();

  for (const node of [...input.readyNodes].sort((a, b) => a.id.localeCompare(b.id))) {
    if (node.lifecycle?.authoritative !== true || node.lifecycle?.status !== 'ready') {
      blocked.push({ nodeId: node.id, reason: 'node is not ledger-authoritative ready' });
      continue;
    }
    if (!(node.dependsOn || []).every((dependency) => completed.has(dependency))) {
      blocked.push({ nodeId: node.id, reason: 'dependency is not completed in the lifecycle ledger' });
      continue;
    }
    const decision = evaluateNodeExecutionBoundary(node, boundary);
    if (!decision.eligible) {
      blocked.push({ nodeId: node.id, reason: decision.reason });
      continue;
    }
    const locks = resourceLocks(node);
    if (locks.some((lock) => heldLocks.has(lock))) {
      deferred.push({ nodeId: node.id, reason: 'resource_lock_conflict', resourceLocks: locks });
      continue;
    }
    if (assignments.length >= capacity) {
      deferred.push({ nodeId: node.id, reason: 'executor_capacity', resourceLocks: locks });
      continue;
    }
    const worker = workers[assignments.length];
    const attempt = Number.isInteger(node.lifecycle?.attempt) ? node.lifecycle.attempt : 1;
    const assignment = {
      id: `assignment:${node.id}:${attempt}:executor`,
      nodeId: node.id,
      workerId: worker.id,
      role: 'executor',
      attempt,
    };
    assignments.push(
      createCodexWorkerAssignmentSpec({
        graph,
        state,
        assignment,
        target: input.target,
        executionBoundary: boundary,
      }),
    );
    for (const lock of locks) heldLocks.add(lock);
  }

  return {
    schemaVersion: '1.0.0',
    source: clone(input.source),
    boundary,
    target: clone(input.target || {}),
    assignments,
    deferred,
    blocked,
  };
}

export function createCodexAssignmentPrompt({
  graph,
  state,
  assignment,
  target,
  executionBoundary = DEFAULT_EXECUTION_BOUNDARY,
}) {
  const spec = createCodexWorkerAssignmentSpec({
    graph,
    state,
    assignment,
    target,
    executionBoundary,
  });
  const payload = {
    assignment: spec,
    artifact:
      assignment.role === 'verifier' ? state.nodes[assignment.nodeId].completionArtifact : null,
    constraints: {
      ...spec.constraints,
      lifecycleTransport: {
        supervisor:
          'The host must use the privileged injected in-process lifecycle supervisor for every capability-bearing lifecycle operation.',
        process:
          'Use one long-lived privileged Python bridge and import the official mcp_server.py module exactly once; do not launch a process per operation.',
        forbidden:
          'Do not use generic or public MCP for capability-bearing lifecycle operations. Do not start an MCP subprocess. Do not edit the lifecycle database manually or directly.',
        capability:
          'The worker never receives the lease capability; the supervisor keeps it in private memory and never prints, persists, evidences, or returns it.',
        recovery:
          'Resume only the same attached task with no duplicate executor. Registry and content-addressed recovery audit must be strict JSON under the trusted dev agentgraph root, the worktree must be clean, and checkpoint head must be an ancestor of current HEAD.',
        heartbeat:
          'The supervisor owns renewal before expiry and before long work, canonical telemetry from host-derived metrics, and checkpoint completion only after the independent verifier passes.',
      },
      output: 'Return exactly one JSON object and no markdown.',
    },
    callback: callbackContract(assignment),
  };
  return [
    'Execute this AgentGraph assignment in the current repository.',
    'Obey the constraints and return exactly one JSON callback object.',
    JSON.stringify(payload, null, 2),
  ].join('\n\n');
}

export function parseCodexAssignmentCallback(text, assignment) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Codex task returned no completion callback');
  }
  let callback;
  try {
    callback = JSON.parse(text);
  } catch {
    throw new Error('Codex task callback must be a single JSON object');
  }
  if (!isRecord(callback)) throw new Error('Codex task callback must be an object');
  if (containsPrivateLifecycleMaterial(callback)) {
    throw new Error('Codex task callback contained private material');
  }
  const expectedKind = assignment.role === 'executor' ? 'completion' : 'verification';
  if (callback.kind !== expectedKind) {
    throw new Error(`Codex task callback kind must be ${expectedKind}`);
  }
  if (
    callback.nodeId !== assignment.nodeId ||
    callback.assignmentId !== assignment.id ||
    callback.workerId !== assignment.workerId
  ) {
    throw new Error('Codex task callback identity does not match its assignment');
  }
  if (expectedKind === 'completion') {
    if (!isRecord(callback.artifact) || !String(callback.artifact.id || '').trim()) {
      throw new Error('Codex executor callback requires a completion artifact');
    }
    if (
      callback.artifact.productionSideEffects !== false ||
      callback.artifact.providerMutations !== false
    ) {
      throw new Error('completion artifact must attest to no production/provider mutation');
    }
  } else if (callback.artifactId !== assignment.artifactId) {
    throw new Error('Codex verifier callback is not bound to the completion artifact');
  }
  return callback;
}

export function createCodexAppTaskBridge({
  createThread,
  waitThreads,
  sendMessageToThread,
  timeoutMs = 120_000,
}) {
  if (typeof createThread !== 'function' || typeof waitThreads !== 'function') {
    throw new Error('Codex app createThread and waitThreads functions are required');
  }
  return {
    async createTask({ prompt, target }) {
      const created = parsedToolResult(await createThread({ prompt, target }));
      if (!isRecord(created) || typeof created.threadId !== 'string' || !created.threadId) {
        throw new Error('Codex create_thread did not return a ready threadId');
      }
      return {
        threadId: created.threadId,
        hostId: created.hostId || null,
      };
    },
    async waitForAny(tasks) {
      const response = parsedToolResult(
        await waitThreads({
          targets: tasks.map((task) => ({
            threadId: task.threadId,
            ...(task.hostId ? { hostId: task.hostId } : {}),
            ...(task.cursor ? { afterCursor: task.cursor } : {}),
          })),
          timeoutMs,
        }),
      );
      if (!isRecord(response)) throw new Error('Codex wait_threads returned an invalid response');
      const threadId = response.wake?.threadId || response.polls?.[0]?.thread?.id;
      const task = tasks.find((candidate) => candidate.threadId === threadId);
      if (!task) throw new Error('Codex wait_threads returned an unknown thread');
      const poll = response.polls?.find((item) => item.thread?.id === threadId) || response.polls?.[0];
      if (response.timedOut) {
        return {
          assignmentId: task.assignmentId,
          status: 'timed_out',
          error: 'no Codex completion arrived before the wait deadline',
        };
      }
      if (poll?.latestTurn?.status !== 'completed' || poll.latestTurn.error) {
        return {
          assignmentId: task.assignmentId,
          status: 'failed',
          error: poll?.latestTurn?.error || `Codex task status: ${poll?.latestTurn?.status || 'unknown'}`,
        };
      }
      return {
        assignmentId: task.assignmentId,
        status: 'completed',
        final: poll.latestAssistantMessage?.text || '',
        cursor: poll.cursor || null,
      };
    },
    ...(typeof sendMessageToThread === 'function'
      ? {
          async steerTask({ threadId, hostId, prompt }) {
            return sendMessageToThread({
              threadId,
              ...(hostId ? { hostId } : {}),
              prompt,
            });
          },
        }
      : {}),
  };
}

export function createPythonLifecycleSupervisorBridge({
  pythonExecutable,
  mcpServerPath,
  databasePath,
  trustedAgentGraphRoot,
  spawnProcess = spawnChild,
}) {
  for (const [name, value] of Object.entries({
    pythonExecutable,
    mcpServerPath,
    databasePath,
    trustedAgentGraphRoot,
  })) {
    if (typeof value !== 'string' || !isAbsolute(value)) {
      throw new Error(`${name} must be an absolute path`);
    }
  }
  if (typeof spawnProcess !== 'function') {
    throw new Error('spawnProcess must be a function');
  }
  const child = spawnProcess(
    pythonExecutable,
    [
      '-u',
      mcpServerPath,
      '--privileged-lifecycle-bridge',
      '--db-path',
      databasePath,
      '--agentgraph-root',
      trustedAgentGraphRoot,
    ],
    {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    },
  );
  if (!child?.stdin || !child?.stdout || typeof child.stdin.write !== 'function') {
    throw new Error('privileged lifecycle bridge did not start');
  }
  let sequence = 0;
  let buffer = '';
  let closed = false;
  const pending = new Map();

  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    while (buffer.includes('\n')) {
      const newline = buffer.indexOf('\n');
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      let response;
      try {
        response = JSON.parse(line);
      } catch {
        for (const request of pending.values()) {
          request.reject(new Error('privileged lifecycle bridge returned invalid JSON'));
        }
        pending.clear();
        continue;
      }
      const request = pending.get(response.id);
      if (!request) continue;
      pending.delete(response.id);
      if (response.ok !== true) {
        request.reject(
          new Error(response.error || 'privileged lifecycle operation failed'),
        );
      } else if (containsPrivateLifecycleMaterial(response.result)) {
        request.reject(
          new Error('privileged lifecycle bridge returned private material'),
        );
      } else {
        request.resolve(response.result);
      }
    }
  });
  child.on('exit', () => {
    closed = true;
    for (const request of pending.values()) {
      request.reject(new Error('privileged lifecycle bridge exited'));
    }
    pending.clear();
  });

  function request(operation, binding, payload = {}) {
    if (closed) return Promise.reject(new Error('privileged lifecycle bridge is closed'));
    const message = {
      id: `lifecycle-${++sequence}`,
      operation,
      ...(binding ? { binding: clone(binding) } : {}),
      ...(Object.keys(payload).length ? { payload: clone(payload) } : {}),
    };
    if (containsPrivateLifecycleMaterial(message)) {
      return Promise.reject(
        new Error('privileged lifecycle request contained private material'),
      );
    }
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(message.id, { resolve: resolveRequest, reject: rejectRequest });
      child.stdin.write(`${JSON.stringify(message)}\n`);
    });
  }

  return {
    resumeAttachedCheckpoint(binding, { ttlSeconds = 1800 } = {}) {
      return request('resume', binding, { ttl_seconds: ttlSeconds });
    },
    renewAttachedCheckpoint(binding, { ttlSeconds = 1800 } = {}) {
      return request('heartbeat', binding, { ttl_seconds: ttlSeconds });
    },
    recordAttachedTelemetryDecision(binding, telemetryRequest) {
      return request('telemetry', binding, { request: telemetryRequest });
    },
    completeAttachedCheckpoint(binding, completion) {
      return request('completion', binding, completion);
    },
    async close() {
      if (closed) return;
      await request('shutdown', null);
      closed = true;
    },
  };
}

function taskSnapshot(activeTasks) {
  return Object.fromEntries(
    [...activeTasks.entries()].map(([assignmentId, task]) => [
      assignmentId,
      {
        assignmentId,
        threadId: task.threadId,
        hostId: task.hostId || null,
        cursor: task.cursor || null,
        role: task.assignment.role,
        nodeId: task.assignment.nodeId,
        status: 'running',
        ...(task.lifecycleResume ? { lifecycleResume: clone(task.lifecycleResume) } : {}),
      },
    ]),
  );
}

function taskRegistrySnapshot(activeTasks, completedTasks) {
  const registry = Object.fromEntries(
    completedTasks.map((task) => [
      task.assignmentId,
      {
        assignmentId: task.assignmentId,
        threadId: task.threadId,
        hostId: task.hostId || null,
        cursor: task.cursor || null,
        role: task.role,
        nodeId: task.nodeId,
        status: task.status,
        ...(task.error ? { error: task.error } : {}),
        ...(task.lifecycleResume ? { lifecycleResume: clone(task.lifecycleResume) } : {}),
      },
    ]),
  );
  return {
    ...registry,
    ...taskSnapshot(activeTasks),
  };
}

async function saveSnapshot(saveState, state, activeTasks, completedTasks = []) {
  const snapshot = {
    schemaVersion: '1.0.0',
    executionState: clone(state),
    tasks: taskSnapshot(activeTasks),
    taskRegistry: taskRegistrySnapshot(activeTasks, completedTasks),
    completedTasks: clone(completedTasks),
  };
  if (containsPrivateLifecycleMaterial(snapshot)) {
    throw new Error('task snapshot contained private material');
  }
  await saveState(snapshot);
}

async function launchAssignments({
  assignments,
  graph,
  state,
  codex,
  target,
  activeTasks,
  saveState,
  completedTasks,
  executionBoundary,
}) {
  const launched = await Promise.all(
    assignments.map(async (assignment) => {
      const prompt = createCodexAssignmentPrompt({
        graph,
        state,
        assignment,
        target,
        executionBoundary,
      });
      const task = await codex.createTask({ assignment: clone(assignment), prompt, target });
      if (!isRecord(task) || typeof task.threadId !== 'string' || !task.threadId) {
        throw new Error(`Codex did not return a threadId for ${assignment.id}`);
      }
      return [assignment.id, { ...task, assignment: clone(assignment) }];
    }),
  );
  for (const [assignmentId, task] of launched) activeTasks.set(assignmentId, task);
  await saveSnapshot(saveState, state, activeTasks, completedTasks);
}

function terminalCallbackForFailure(assignment, error) {
  if (assignment.role === 'executor') {
    return {
      completions: [
        {
          nodeId: assignment.nodeId,
          assignmentId: assignment.id,
          workerId: assignment.workerId,
          artifact: null,
          error,
        },
      ],
    };
  }
  return {
    verifications: [
      {
        nodeId: assignment.nodeId,
        assignmentId: assignment.id,
        workerId: assignment.workerId,
        artifactId: assignment.artifactId,
        passed: false,
        errors: [error],
      },
    ],
  };
}

function dispatcherInputForCallback(callback) {
  if (callback.kind === 'completion') {
    const { kind: _kind, ...completion } = callback;
    return { completions: [completion] };
  }
  const { kind: _kind, ...verification } = callback;
  return { verifications: [verification] };
}

export async function runAgentGraphWithCodex(input) {
  const {
    graph,
    initialState,
    workers,
    codex,
    target,
    maxConcurrentExecutors = 2,
    executionBoundary = DEFAULT_EXECUTION_BOUNDARY,
    saveState = async () => {},
    now = () => new Date().toISOString(),
  } = input || {};
  if (!isRecord(codex) || typeof codex.createTask !== 'function' || typeof codex.waitForAny !== 'function') {
    throw new Error('codex.createTask and codex.waitForAny are required');
  }

  let dispatched = dispatchAgentGraph({
    graph,
    state: initialState,
    workers,
    maxConcurrentExecutors,
    executionBoundary,
    now: now(),
  });
  const activeTasks = new Map();
  const completedTasks = [];
  await launchAssignments({
    assignments: dispatched.newAssignments,
    graph,
    state: dispatched.state,
    codex,
    target,
    activeTasks,
    saveState,
    completedTasks,
    executionBoundary,
  });

  while (dispatched.status !== 'complete' && dispatched.status !== 'halted') {
    if (activeTasks.size === 0) {
      throw new Error('dispatcher is waiting without an active Codex task');
    }
    const outcome = await codex.waitForAny(
      [...activeTasks.values()].map((task) => ({
        assignmentId: task.assignment.id,
        threadId: task.threadId,
        hostId: task.hostId || undefined,
        cursor: task.cursor || undefined,
      })),
    );
    const active = activeTasks.get(outcome?.assignmentId);
    if (!active) throw new Error('Codex returned an outcome for an unknown assignment');
    active.cursor = outcome?.cursor || active.cursor || null;
    activeTasks.delete(active.assignment.id);

    let callbackInput;
    let parsedCallback = null;
    try {
      if (outcome.status !== 'completed') {
        throw new Error(outcome.error || `Codex task ended with status ${outcome.status || 'unknown'}`);
      }
      const callback = parseCodexAssignmentCallback(outcome.final, active.assignment);
      parsedCallback = callback;
      if (
        active.assignment.role === 'executor' &&
        typeof codex.recordExecutorLifecycleTelemetry === 'function'
      ) {
        await codex.recordExecutorLifecycleTelemetry({
          assignment: clone(active.assignment),
          outcome: clone(outcome),
        });
      }
      callbackInput = dispatcherInputForCallback(callback);
      completedTasks.push({
        assignmentId: active.assignment.id,
        nodeId: active.assignment.nodeId,
        role: active.assignment.role,
        workerId: active.assignment.workerId,
        threadId: active.threadId,
        hostId: active.hostId || null,
        cursor: active.cursor,
        codexThreadId: outcome.codexThreadId || null,
        status: 'completed',
        callback: clone(callback),
        ...(active.lifecycleResume
          ? { lifecycleResume: clone(active.lifecycleResume) }
          : {}),
      });
    } catch (error) {
      callbackInput = terminalCallbackForFailure(active.assignment, error.message);
      completedTasks.push({
        assignmentId: active.assignment.id,
        nodeId: active.assignment.nodeId,
        role: active.assignment.role,
        workerId: active.assignment.workerId,
        threadId: active.threadId,
        hostId: active.hostId || null,
        cursor: active.cursor,
        codexThreadId: outcome?.codexThreadId || null,
        status:
          outcome?.status && outcome.status !== 'completed'
            ? outcome.status
            : 'failed',
        error: error.message,
        ...(active.lifecycleResume
          ? { lifecycleResume: clone(active.lifecycleResume) }
          : {}),
      });
    }

    const previousState = dispatched.state;
    let candidate = dispatchAgentGraph({
      graph,
      state: previousState,
      workers,
      maxConcurrentExecutors,
      executionBoundary,
      ...callbackInput,
      now: now(),
    });
    if (
      parsedCallback?.kind === 'verification' &&
      parsedCallback.passed === true &&
      candidate.state.nodes[active.assignment.nodeId]?.status === 'completed' &&
      typeof codex.completeVerifiedNodeLifecycle === 'function'
    ) {
      try {
        await codex.completeVerifiedNodeLifecycle({
          assignment: clone(active.assignment),
          callback: clone(parsedCallback),
        });
      } catch (error) {
        callbackInput = terminalCallbackForFailure(active.assignment, error.message);
        candidate = dispatchAgentGraph({
          graph,
          state: previousState,
          workers,
          maxConcurrentExecutors,
          executionBoundary,
          ...callbackInput,
          now: now(),
        });
        const taskRecord = completedTasks.at(-1);
        if (taskRecord?.assignmentId === active.assignment.id) {
          taskRecord.status = 'failed';
          taskRecord.error = error.message;
          delete taskRecord.callback;
        }
      }
    }
    dispatched = candidate;
    if (dispatched.status === 'halted' && typeof codex.steerTask === 'function') {
      await Promise.all(
        [...activeTasks.values()].map((task) =>
          codex.steerTask({
            threadId: task.threadId,
            hostId: task.hostId || undefined,
            prompt: 'Stop: the AgentGraph execution halted on a genuine blocker. Do not continue.',
          }),
        ),
      );
      activeTasks.clear();
    } else {
      await launchAssignments({
        assignments: dispatched.newAssignments,
        graph,
        state: dispatched.state,
        codex,
        target,
        activeTasks,
        saveState,
        completedTasks,
        executionBoundary,
      });
    }
    await saveSnapshot(saveState, dispatched.state, activeTasks, completedTasks);
  }

  return {
    ...dispatched,
    tasks: taskSnapshot(activeTasks),
    completedTasks: clone(completedTasks),
  };
}

export async function runAuthoritativeLedgerWaveWithCodex({
  ledgerInput,
  codex,
  saveState,
  now,
}) {
  const wave = buildAuthoritativeLedgerWave(ledgerInput);
  if (wave.assignments.length === 0) {
    return {
      status: 'halted',
      report: {
        reason: 'ledger_wave_blocked',
        blocked: clone(wave.blocked),
        deferred: clone(wave.deferred),
        ledgerRevision: wave.source.revision,
      },
      wave,
      completedTasks: [],
    };
  }
  const selected = new Set(wave.assignments.map((assignment) => assignment.nodeId));
  const graph = {
    nodes: ledgerInput.readyNodes
      .filter((node) => selected.has(node.id))
      .map((node) => ({ ...clone(node), dependsOn: [] })),
  };
  const result = await runAgentGraphWithCodex({
    graph,
    initialState: createAgentGraphExecutionState(graph),
    workers: ledgerInput.workers,
    codex,
    target: ledgerInput.target,
    maxConcurrentExecutors: wave.assignments.length,
    executionBoundary: wave.boundary,
    saveState,
    now,
  });
  return { ...result, wave };
}

function containsPrivateLifecycleMaterial(value) {
  if (Array.isArray(value)) return value.some(containsPrivateLifecycleMaterial);
  if (typeof value === 'string') {
    return (
      /\b(?:authorization\s*:\s*)?bearer\s+[a-z0-9._~+/=-]{8,}/i.test(value) ||
      /\bhttps?:\/\/[^/\s:@]+:[^@\s/]+@/i.test(value)
    );
  }
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, item]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (
      normalized.includes('capability') ||
      normalized.includes('secret') ||
      normalized.includes('credential') ||
      normalized.includes('password') ||
      ['token', 'authtoken', 'accesstoken', 'authorization', 'apikey', 'passwd'].includes(
        normalized,
      ) ||
      containsPrivateLifecycleMaterial(item)
    );
  });
}

function assertPublicLifecycleResume(result, binding) {
  if (!isRecord(result) || containsPrivateLifecycleMaterial(result)) {
    throw new Error('lifecycle supervisor returned private lifecycle material');
  }
  const event = result.event;
  const payload = event?.payload;
  const sha256 = /^[0-9a-f]{64}$/;
  if (
    result.generation !== binding.generation ||
    !sha256.test(String(result.request_sha256 || '')) ||
    !isRecord(event) ||
    event.event_type !== 'writer_lease_controller_resumed' ||
    !sha256.test(String(event.event_hash || '')) ||
    !isRecord(payload) ||
    payload.program_id !== binding.program_id ||
    payload.checkpoint_id !== binding.checkpoint_id ||
    payload.node_id !== binding.node_id ||
    payload.assignment_id !== binding.assignment_id ||
    payload.thread_id !== binding.thread_id ||
    payload.worker_id !== binding.worker_id ||
    payload.actor !== binding.actor ||
    payload.session_id !== binding.session_id ||
    payload.registry_sha256 !== binding.registry_sha256 ||
    payload.recovery_audit_sha256 !== binding.recovery_audit_sha256 ||
    payload.recovery_id !== binding.recovery_id ||
    payload.generation !== binding.generation ||
    payload.request_sha256 !== result.request_sha256
  ) {
    throw new Error('lifecycle supervisor resume receipt does not match the attached task');
  }
}

export function createInjectedHostTaskControlAdapter({
  taskControl,
  attachedTasks,
  lifecycleSupervisor,
  lifecycleRecovery,
  lifecycleNow = () => new Date().toISOString(),
}) {
  if (
    !isRecord(taskControl) ||
    typeof taskControl.createTask !== 'function' ||
    typeof taskControl.waitForAny !== 'function'
  ) {
    throw new Error('taskControl.createTask and taskControl.waitForAny are required');
  }
  if (!Array.isArray(attachedTasks) || attachedTasks.length === 0) {
    throw new Error('attachedTasks must contain at least one host task');
  }
  const attachments = new Map();
  const resumedLifecycle = new Map();
  for (const task of attachedTasks) {
    if (
      !isRecord(task) ||
      typeof task.assignmentId !== 'string' ||
      !task.assignmentId ||
      typeof task.threadId !== 'string' ||
      !task.threadId ||
      !['executor', 'verifier'].includes(task.role) ||
      !['running', 'needs-attention'].includes(task.status)
    ) {
      throw new Error(
        'attached host tasks require assignmentId, threadId, role, and running or needs-attention status',
      );
    }
    if (task.status === 'needs-attention' && task.role !== 'executor') {
      throw new Error('only an attached executor can use lifecycle recovery');
    }
    if (attachments.has(task.assignmentId)) {
      throw new Error(`duplicate attached assignment: ${task.assignmentId}`);
    }
    attachments.set(task.assignmentId, clone(task));
  }

  return {
    async createTask(args) {
      const attached = attachments.get(args.assignment.id);
      if (!attached) return taskControl.createTask(args);
      if (attached.role !== args.assignment.role) {
        throw new Error(`attached task role does not match ${args.assignment.id}`);
      }
      let lifecycleResume = null;
      if (attached.status === 'needs-attention') {
        if (
          !isRecord(lifecycleSupervisor) ||
          typeof lifecycleSupervisor.resumeAttachedCheckpoint !== 'function'
        ) {
          throw new Error('privileged in-process lifecycle supervisor is required');
        }
        if (
          !isRecord(lifecycleRecovery) ||
          lifecycleRecovery.assignmentId !== args.assignment.id ||
          typeof lifecycleRecovery.programId !== 'string' ||
          !lifecycleRecovery.programId ||
          typeof lifecycleRecovery.checkpointId !== 'string' ||
          !lifecycleRecovery.checkpointId ||
          typeof lifecycleRecovery.registryPath !== 'string' ||
          !isAbsolute(lifecycleRecovery.registryPath) ||
          typeof lifecycleRecovery.recoveryAuditPath !== 'string' ||
          !isAbsolute(lifecycleRecovery.recoveryAuditPath) ||
          typeof lifecycleRecovery.recoveryId !== 'string' ||
          !lifecycleRecovery.recoveryId ||
          !Number.isInteger(lifecycleRecovery.generation) ||
          lifecycleRecovery.generation < 1
        ) {
          throw new Error('authoritative lifecycle recovery binding is invalid');
        }
        const registryPath = resolve(lifecycleRecovery.registryPath);
        const recoveryAuditPath = resolve(lifecycleRecovery.recoveryAuditPath);
        const registrySha256 = createHash('sha256')
          .update(readFileSync(registryPath))
          .digest('hex');
        const recoveryAuditSha256 = createHash('sha256')
          .update(readFileSync(recoveryAuditPath))
          .digest('hex');
        const binding = {
          program_id: lifecycleRecovery.programId,
          checkpoint_id: lifecycleRecovery.checkpointId,
          node_id: args.assignment.nodeId,
          assignment_id: args.assignment.id,
          thread_id: attached.threadId,
          worker_id: args.assignment.workerId,
          actor: `agent:${args.assignment.workerId}`,
          session_id: args.assignment.id,
          registry_path: registryPath,
          registry_sha256: registrySha256,
          recovery_audit_path: recoveryAuditPath,
          recovery_audit_sha256: recoveryAuditSha256,
          recovery_id: lifecycleRecovery.recoveryId,
          generation: lifecycleRecovery.generation,
        };
        const publicResult = await lifecycleSupervisor.resumeAttachedCheckpoint(
          clone(binding),
        );
        assertPublicLifecycleResume(publicResult, binding);
        lifecycleResume = {
          recoveryId: binding.recovery_id,
          generation: binding.generation,
          requestSha256: publicResult.request_sha256,
          eventHash: publicResult.event.event_hash,
          registrySha256,
          recoveryAuditSha256,
        };
        resumedLifecycle.set(args.assignment.id, {
          binding: clone(binding),
          completion: clone(lifecycleRecovery.completion || null),
        });
      }
      attachments.delete(args.assignment.id);
      return {
        threadId: attached.threadId,
        hostId: attached.hostId || null,
        cursor: attached.cursor || null,
        ...(lifecycleResume ? { lifecycleResume } : {}),
      };
    },
    async waitForAny(tasks) {
      for (const lifecycle of resumedLifecycle.values()) {
        if (typeof lifecycleSupervisor.renewAttachedCheckpoint !== 'function') {
          throw new Error('lifecycle supervisor heartbeat operation is required');
        }
        const renewed = await lifecycleSupervisor.renewAttachedCheckpoint(
          clone(lifecycle.binding),
        );
        if (containsPrivateLifecycleMaterial(renewed)) {
          throw new Error('lifecycle heartbeat returned private material');
        }
      }
      return taskControl.waitForAny(tasks);
    },
    async recordExecutorLifecycleTelemetry({ assignment, outcome }) {
      const lifecycle = resumedLifecycle.get(assignment.id);
      if (!lifecycle) return null;
      if (typeof lifecycleSupervisor.recordAttachedTelemetryDecision !== 'function') {
        throw new Error('lifecycle supervisor telemetry operation is required');
      }
      if (!isRecord(outcome.hostMetrics)) {
        throw new Error('host-derived lifecycle metrics are required');
      }
      if (!isRecord(lifecycle.completion)) {
        throw new Error('host-derived lifecycle completion binding is required');
      }
      const telemetryRequest = {
        schemaVersion: '1.0.0',
        programId: lifecycle.binding.program_id,
        checkpointId: lifecycle.binding.checkpoint_id,
        nodeId: lifecycle.binding.node_id,
        observedAt: lifecycleNow(),
        metrics: clone(outcome.hostMetrics),
      };
      const telemetry = await lifecycleSupervisor.recordAttachedTelemetryDecision(
        clone(lifecycle.binding),
        telemetryRequest,
      );
      if (containsPrivateLifecycleMaterial(telemetry)) {
        throw new Error('lifecycle telemetry returned private material');
      }
      lifecycle.telemetryRecorded = true;
      return clone(telemetry);
    },
    async completeVerifiedNodeLifecycle({ assignment, callback }) {
      const entry = [...resumedLifecycle.entries()].find(
        ([, lifecycle]) => lifecycle.binding.node_id === assignment.nodeId,
      );
      if (!entry) return null;
      const [executorAssignmentId, lifecycle] = entry;
      if (
        callback?.kind !== 'verification' ||
        callback.passed !== true ||
        lifecycle.telemetryRecorded !== true
      ) {
        throw new Error('verified lifecycle completion requires passing independent verification');
      }
      if (typeof lifecycleSupervisor.completeAttachedCheckpoint !== 'function') {
        throw new Error('lifecycle supervisor completion operation is required');
      }
      const completionInput = {
        ...clone(lifecycle.completion),
        evidence: [
          ...clone(lifecycle.completion.evidence || []),
          {
            kind: 'agentgraph-verification',
            assignmentId: assignment.id,
            artifactId: callback.artifactId,
            evidence: clone(callback.evidence || []),
          },
        ],
      };
      const completion = await lifecycleSupervisor.completeAttachedCheckpoint(
        clone(lifecycle.binding),
        completionInput,
      );
      if (containsPrivateLifecycleMaterial(completion)) {
        throw new Error('lifecycle completion returned private material');
      }
      resumedLifecycle.delete(executorAssignmentId);
      return clone(completion);
    },
    ...(typeof taskControl.steerTask === 'function'
      ? {
          async steerTask(args) {
            return taskControl.steerTask(args);
          },
        }
      : {}),
  };
}

export async function runAuthoritativeLedgerWaveWithAttachedHostTasks({
  ledgerInput,
  attachedTasks,
  taskControl,
  lifecycleSupervisor,
  lifecycleRecovery,
  saveState,
  now,
}) {
  const authoritativeAssignments = new Map(
    buildAuthoritativeLedgerWave(ledgerInput).assignments.map((assignment) => [
      assignment.assignmentId,
      assignment,
    ]),
  );
  for (const task of attachedTasks || []) {
    const assignment = authoritativeAssignments.get(task?.assignmentId);
    if (!assignment || assignment.role !== task?.role) {
      throw new Error(
        `attached task is not in the authoritative wave: ${task?.assignmentId || '<missing>'}`,
      );
    }
  }
  const injectedTaskControl = createInjectedHostTaskControlAdapter({
    taskControl,
    attachedTasks,
    lifecycleSupervisor,
    lifecycleRecovery,
    lifecycleNow: now,
  });
  return runAuthoritativeLedgerWaveWithCodex({
    ledgerInput,
    codex: injectedTaskControl,
    saveState,
    now,
  });
}
