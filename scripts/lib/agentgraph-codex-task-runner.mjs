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

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalValue(value[key])]),
  );
}

function sha256Document(value) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalValue(value)))
    .digest('hex');
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
    if (
      node.lifecycle?.authoritative === true &&
      node.lifecycle?.status === 'ready' &&
      node.verification?.independent !== true
    ) {
      throw new Error(
        `authoritative executable node requires independent verification: ${node.id}`,
      );
    }
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
          'The same supervisor serially renews at a configured interval below the lease TTL throughout every unbounded executor and verifier wait; failure stops the same attached task and halts.',
        telemetry:
          'Canonical telemetry comes only from host-derived metrics, and checkpoint completion occurs only after the independent verifier passes.',
        finalization:
          'Persist prepared finalization before DB completion, persist finalized public receipt before successor launch, and reconcile resumeSnapshot by exact checkpoint/node/finalization hash.',
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
  listThreads,
  readThread,
  waitThreads,
  sendMessageToThread,
  loadLaunchMapping,
  saveLaunchMapping,
  timeoutMs = 120_000,
  pollIntervalMs = 250,
  sleep = (delayMs) => new Promise((resolveSleep) => setTimeout(resolveSleep, delayMs)),
  reconciliationAttempts = 3,
}) {
  if (
    typeof createThread !== 'function' ||
    typeof readThread !== 'function' ||
    typeof loadLaunchMapping !== 'function' ||
    typeof saveLaunchMapping !== 'function'
  ) {
    throw new Error(
      'Codex app createThread, readThread, and durable launch callbacks are required',
    );
  }
  const launches = new Map();
  const launchLocks = new Map();
  let listQuerySupported = null;
  const threadIdOf = (value) =>
    value?.threadId || value?.id || value?.thread?.id || null;
  const threadListOf = (value) =>
    value?.threads || value?.items || value?.data?.threads || [];
  const textLeaves = (value, output = []) => {
    if (typeof value === 'string') {
      output.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) textLeaves(item, output);
    } else if (isRecord(value)) {
      for (const item of Object.values(value)) textLeaves(item, output);
    }
    return output;
  };
  const turnItems = (response) =>
    (response?.turns || response?.thread?.turns || [])
      .flatMap((turn) => turn?.items || [])
      .filter(isRecord);
  const latestAssistantText = (response) => {
    const turns = response?.turns || response?.thread?.turns || [];
    for (const turn of turns) {
      for (const item of turn?.items || []) {
        const role = item?.role || item?.message?.role;
        if (
          role === 'assistant' ||
          [
            'agentMessage',
            'assistantMessage',
            'agent_message',
            'assistant_message',
            'output_text',
          ].includes(item?.type)
        ) {
          const text =
            item?.text ||
            item?.message?.text ||
            textLeaves(item?.content || item?.message?.content || []).find(
              (leaf) => leaf.trim(),
            );
          if (text) return text;
        }
      }
      const legacy =
        turn?.assistantMessage?.text ||
        turn?.latestAssistantMessage?.text ||
        turn?.text;
      if (legacy) return legacy;
    }
    return (
      response?.latestAssistantMessage?.text ||
      response?.thread?.latestAssistantMessage?.text ||
      ''
    );
  };
  async function listRecentThreads(tag) {
    if (typeof listThreads !== 'function') return [];
    if (listQuerySupported !== false) {
      try {
        const response = parsedToolResult(
          await listThreads({ query: tag, limit: 50 }),
        );
        listQuerySupported = true;
        return threadListOf(response);
      } catch {
        listQuerySupported = false;
      }
    }
    const response = parsedToolResult(await listThreads({ limit: 50 }));
    return threadListOf(response);
  }
  const turnIdOf = (turn) => turn?.id || turn?.turnId || null;
  const canonicalMessageText = (item) =>
    item?.text ||
    item?.message?.text ||
    textLeaves(item?.content || item?.message?.content || [])
      .filter((leaf) => leaf.trim())
      .join('\n');
  function activationMarkerMatches(response, marker) {
    const turns = response?.turns || response?.thread?.turns || [];
    const matches = [];
    for (const turn of turns) {
      for (const item of turn?.items || []) {
        const role = item?.role || item?.message?.role;
        const isUser =
          role === 'user' ||
          ['userMessage', 'user_message', 'input_text'].includes(item?.type);
        if (!isUser) continue;
        const text = canonicalMessageText(item);
        let offset = 0;
        while (typeof text === 'string' && (offset = text.indexOf(marker, offset)) >= 0) {
          matches.push(turn);
          offset += marker.length;
        }
      }
    }
    return matches;
  }
  function strictMarkedFinalText(turn) {
    const finals = (turn?.items || []).filter((item) => {
      const isAgentMessage = [
        'agentMessage',
        'assistantMessage',
        'agent_message',
        'assistant_message',
      ].includes(item?.type);
      return isAgentMessage && ['final_answer', 'final'].includes(item?.phase);
    });
    if (finals.length !== 1) {
      throw new Error(
        `Codex activation baseline requires exactly one final answer item; found ${finals.length}`,
      );
    }
    const text = canonicalMessageText(finals[0]);
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Codex activation baseline final answer is empty');
    }
    return text;
  }
  async function findByBootstrapTag(tag, target) {
    const recentThreads = await listRecentThreads(tag);
    const matches = [];
    for (const thread of recentThreads) {
      if (
        target?.projectId &&
        thread.projectId &&
        thread.projectId !== target.projectId
      ) {
        continue;
      }
      const threadId = threadIdOf(thread);
      if (!threadId) continue;
      if (typeof readThread !== 'function') {
        throw new Error('Codex bootstrap reconciliation requires readThread');
      }
      const response = parsedToolResult(
        await readThread({
          threadId,
          ...(thread.hostId ? { hostId: thread.hostId } : {}),
        }),
      );
      const markerMatches = activationMarkerMatches(response, tag);
      if (markerMatches.length > 1) {
        throw new Error(`ambiguous Codex assignment bootstrap tag: ${tag}`);
      }
      if (markerMatches.length === 1) {
        const projectId = response?.thread?.projectId || response?.projectId || null;
        if (target?.projectId && projectId !== target.projectId) {
          throw new Error(
            `Codex bootstrap thread project does not match ${target.projectId}`,
          );
        }
        matches.push({
          ...thread,
          projectId,
        });
      }
    }
    if (matches.length > 1) {
      throw new Error(`ambiguous Codex assignment bootstrap tag: ${tag}`);
    }
    if (matches.length === 0) return null;
    const threadId = threadIdOf(matches[0]);
    if (!threadId) throw new Error('matched Codex thread has no threadId');
    return { threadId, hostId: matches[0].hostId || null };
  }
  async function validateMappedThread(mapping, bootstrapTag, target) {
    const response = parsedToolResult(
      await readThread({
        threadId: mapping.threadId,
        ...(mapping.hostId ? { hostId: mapping.hostId } : {}),
      }),
    );
    const markerMatches = activationMarkerMatches(response, bootstrapTag);
    if (markerMatches.length !== 1) {
      throw new Error(
        `durable Codex mapping requires exactly one bootstrap marker: ${bootstrapTag}`,
      );
    }
    const projectId = response?.thread?.projectId || response?.projectId || null;
    if (target?.projectId && projectId !== target.projectId) {
      throw new Error('durable Codex mapping project does not match requested project');
    }
  }
  async function reconcileBootstrapTag(tag, target) {
    for (let attempt = 0; attempt < reconciliationAttempts; attempt += 1) {
      const mapping = await findByBootstrapTag(tag, target);
      if (mapping) return mapping;
      if (attempt + 1 < reconciliationAttempts) await sleep(pollIntervalMs);
    }
    return null;
  }
  return {
    async createTask({
      prompt,
      target,
      idempotencyKey,
      assignment,
      scopeHash,
    }) {
      const key = idempotencyKey || assignment?.id;
      if (typeof key !== 'string' || !key) {
        throw new Error('Codex app task creation requires an assignment idempotency key');
      }
      const localLaunch = launches.get(key);
      if (localLaunch) {
        const requestedScopeHash =
          scopeHash || sha256Document({ key, target: target || {} });
        if (localLaunch.scopeHash !== requestedScopeHash) {
          throw new Error(`local Codex launch scope does not match ${key}`);
        }
        return clone(localLaunch.mapping);
      }
      if (launchLocks.has(key)) return clone(await launchLocks.get(key));
      const pending = (async () => {
        const requestedScopeHash =
          scopeHash || sha256Document({ key, target: target || {} });
        const durable = await loadLaunchMapping(key);
        if (isRecord(durable) && typeof durable.threadId === 'string') {
          if (durable.scopeHash !== requestedScopeHash) {
            throw new Error(`durable Codex launch scope does not match ${key}`);
          }
          const mapped = {
            threadId: durable.threadId,
            hostId: durable.hostId || null,
            bootstrapTag:
              durable.bootstrapTag || `agentgraph-assignment:${key}`,
          };
          await validateMappedThread(
            mapped,
            mapped.bootstrapTag,
            target,
          );
          launches.set(key, {
            mapping: clone(mapped),
            scopeHash: requestedScopeHash,
          });
          return clone(mapped);
        }
        const bootstrapTag = `agentgraph-assignment:${key}`;
        if (isRecord(durable) && durable.status === 'launching') {
          if (durable.scopeHash !== requestedScopeHash) {
            throw new Error(`durable Codex launch scope does not match ${key}`);
          }
          const reconciled = await reconcileBootstrapTag(bootstrapTag, target);
          if (!reconciled) {
            throw new Error(
              `unreconciled durable Codex launch intent for ${key}; refusing duplicate create`,
            );
          }
          const mapped = { ...reconciled, bootstrapTag };
          await saveLaunchMapping(key, {
            ...clone(mapped),
            status: 'mapped',
            scopeHash: requestedScopeHash,
            projectId: target?.projectId || null,
          });
          launches.set(key, {
            mapping: clone(mapped),
            scopeHash: requestedScopeHash,
          });
          return clone(mapped);
        }
        if (isRecord(durable)) {
          throw new Error(`invalid durable Codex launch state for ${key}`);
        }
        let mapping = await findByBootstrapTag(bootstrapTag, target);
        if (!mapping) {
          await saveLaunchMapping(key, {
            schemaVersion: '1.0.0',
            status: 'launching',
            bootstrapTag,
            scopeHash: requestedScopeHash,
            projectId: target?.projectId || null,
          });
          const created = parsedToolResult(
            await createThread({
              prompt: `${bootstrapTag}\n${prompt}`,
              target,
            }),
          );
          const readyThreadId = threadIdOf(created);
          if (readyThreadId && !created?.clientThreadId) {
            mapping = {
              threadId: readyThreadId,
              hostId: created.hostId || null,
              bootstrapTag,
            };
          } else {
            mapping = await reconcileBootstrapTag(bootstrapTag, target);
            if (!mapping) {
              throw new Error(
                'Codex create_thread returned setup-only clientThreadId without a reconciled thread',
              );
            }
            mapping.bootstrapTag = bootstrapTag;
          }
        } else {
          mapping.bootstrapTag = bootstrapTag;
        }
        await saveLaunchMapping(key, {
          ...clone(mapping),
          status: 'mapped',
          scopeHash: requestedScopeHash,
          projectId: target?.projectId || null,
        });
        launches.set(key, {
          mapping: clone(mapping),
          scopeHash: requestedScopeHash,
        });
        return clone(mapping);
      })();
      launchLocks.set(key, pending);
      try {
        return clone(await pending);
      } finally {
        launchLocks.delete(key);
      }
    },
    async reattachTask(args) {
      return this.createTask(args);
    },
    async waitForAny(tasks) {
      if (typeof readThread === 'function') {
        const deadline = Date.now() + timeoutMs;
        do {
          for (const task of tasks) {
            const response = parsedToolResult(
              await readThread({
                threadId: task.threadId,
                ...(task.hostId ? { hostId: task.hostId } : {}),
              }),
            );
            const thread = response?.thread || response;
            const turns = response?.turns || thread?.turns || [];
            let eligibleTurns = turns;
            if (task.baselineTurnId) {
              if (
                typeof task.activationMarker !== 'string' ||
                !task.activationMarker
              ) {
                throw new Error(
                  'Codex activation baseline requires its exact activation marker',
                );
              }
              const baselineIndex = turns.findIndex(
                (turn) => turnIdOf(turn) === task.baselineTurnId,
              );
              if (baselineIndex < 0) {
                throw new Error(
                  `Codex activation baseline turn is missing: ${task.baselineTurnId}`,
                );
              }
              eligibleTurns = [turns[baselineIndex]];
              const markerMatches = activationMarkerMatches(
                { turns: eligibleTurns },
                task.activationMarker,
              );
              if (markerMatches.length !== 1) {
                throw new Error(
                  `Codex activation baseline marker count must be exactly one; found ${markerMatches.length}`,
                );
              }
            }
            const latest =
              eligibleTurns[0] ||
              (!task.baselineTurnId
                ? response?.latestTurn || thread?.latestTurn || null
                : null);
            let assistantText = '';
            if (!task.baselineTurnId) {
              assistantText = latestAssistantText(response);
            } else if (latest?.status === 'completed') {
              try {
                assistantText = strictMarkedFinalText(latest);
              } catch (error) {
                return {
                  assignmentId: task.assignmentId,
                  status: 'failed',
                  error: error.message,
                };
              }
            }
            const status =
              latest?.status ||
              thread?.status?.type ||
              thread?.status ||
              response?.status?.type ||
              response?.status;
            if (
              latest &&
              (latest.status === 'completed' ||
                (status === 'idle' && assistantText))
            ) {
              return {
                assignmentId: task.assignmentId,
                status: 'completed',
                final: assistantText,
                cursor: null,
              };
            }
            if (latest?.error || thread?.error || status === 'failed') {
              return {
                assignmentId: task.assignmentId,
                status: 'failed',
                error: latest?.error || thread?.error || 'Codex thread failed',
              };
            }
          }
          if (Date.now() < deadline) await sleep(pollIntervalMs);
        } while (Date.now() < deadline);
        return {
          assignmentId: tasks[0]?.assignmentId,
          status: 'timed_out',
          error: 'no Codex completion was present in read_thread',
        };
      }
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
    ...(typeof sendMessageToThread === 'function'
      ? {
          async activateTask({
            threadId,
            hostId,
           prompt,
           activationId,
            allowSend = true,
          }) {
            const activationMarker = `agentgraph-activation:${activationId}`;
            let response = parsedToolResult(
              await readThread({
                threadId,
                ...(hostId ? { hostId } : {}),
              }),
            );
            let markerTurns = activationMarkerMatches(response, activationMarker);
            if (markerTurns.length > 1) {
              throw new Error(`ambiguous Codex activation marker: ${activationMarker}`);
            }
            let recovered = markerTurns.length === 1;
            if (markerTurns.length === 0) {
              if (!allowSend) {
                throw new Error(
                  `Codex activation marker was not reconciled and sending is forbidden: ${activationMarker}`,
                );
              }
              await sendMessageToThread({
                threadId,
                ...(hostId ? { hostId } : {}),
                prompt: `${activationMarker}\n${prompt}`,
              });
              for (
                let attempt = 0;
                attempt < reconciliationAttempts && markerTurns.length === 0;
                attempt += 1
              ) {
                response = parsedToolResult(
                  await readThread({
                    threadId,
                    ...(hostId ? { hostId } : {}),
                  }),
                );
                markerTurns = activationMarkerMatches(response, activationMarker);
                if (markerTurns.length > 1) {
                  throw new Error(
                    `ambiguous Codex activation marker: ${activationMarker}`,
                  );
                }
                if (
                  markerTurns.length === 0 &&
                  attempt + 1 < reconciliationAttempts
                ) {
                  await sleep(pollIntervalMs);
                }
              }
            }
            const baselineTurnId = turnIdOf(markerTurns[0]);
            if (!baselineTurnId) {
              throw new Error(
                `Codex activation marker was not reconciled: ${activationMarker}`,
              );
            }
            return {
              activationId,
              activationMarker,
              baselineTurnId,
              recovered,
            };
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
    reconcileAttachedCheckpointCompletion(binding, reconciliation) {
      return request('reconcile', binding, {
        finalization_sha256: reconciliation.finalizationSha256,
      });
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
        assignment: clone(task.assignment),
        role: task.assignment.role,
        nodeId: task.assignment.nodeId,
        status: 'running',
        ...(task.scope ? { scope: clone(task.scope) } : {}),
        ...(task.scopeHash ? { scopeHash: task.scopeHash } : {}),
        ...(task.lifecycleResume ? { lifecycleResume: clone(task.lifecycleResume) } : {}),
        ...(task.activation ? { activation: clone(task.activation) } : {}),
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
        ...(task.assignment ? { assignment: clone(task.assignment) } : {}),
        ...(task.scope ? { scope: clone(task.scope) } : {}),
        ...(task.scopeHash ? { scopeHash: task.scopeHash } : {}),
        ...(task.error ? { error: task.error } : {}),
        ...(task.lifecycleResume ? { lifecycleResume: clone(task.lifecycleResume) } : {}),
        ...(task.activation ? { activation: clone(task.activation) } : {}),
      },
    ]),
  );
  return {
    ...registry,
    ...taskSnapshot(activeTasks),
  };
}

async function saveSnapshot(
  saveState,
  state,
  activeTasks,
  completedTasks = [],
  lifecycleFinalization = null,
) {
  const snapshot = {
    schemaVersion: '1.0.0',
    executionState: clone(state),
    tasks: taskSnapshot(activeTasks),
    taskRegistry: taskRegistrySnapshot(activeTasks, completedTasks),
    completedTasks: clone(completedTasks),
    ...(lifecycleFinalization
      ? { lifecycleFinalization: clone(lifecycleFinalization) }
      : {}),
  };
  if (containsPrivateLifecycleMaterial(snapshot)) {
    throw new Error('task snapshot contained private material');
  }
  await saveState(snapshot);
}

function finalizationHash(document) {
  return createHash('sha256')
    .update(JSON.stringify(document))
    .digest('hex');
}

function lifecycleFinalizationEvidence(journal) {
  return [
    ...clone(journal.lifecycle.completionSpec.evidence || []),
    {
      kind: 'agentgraph-verification',
      assignmentId: journal.verifierAssignment.id,
      artifactId: journal.verification.artifactId,
      evidence: clone(journal.verification.evidence || []),
    },
    {
      kind: 'agentgraph-finalization',
      sha256: journal.sha256,
    },
  ];
}

function parsedReceiptArray(value, field) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`lifecycle completion receipt ${field} is invalid JSON`);
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`lifecycle completion receipt ${field} must be an array`);
  }
  return parsed;
}

function prepareLifecycleFinalization({
  assignment,
  callback,
  candidate,
  lifecycleBinding,
}) {
  if (!isRecord(lifecycleBinding)) {
    throw new Error('lifecycle finalization requires an immutable completion binding');
  }
  if (
    lifecycleBinding.nodeId !== assignment.nodeId ||
    typeof lifecycleBinding.programId !== 'string' ||
    !lifecycleBinding.programId ||
    typeof lifecycleBinding.checkpointId !== 'string' ||
    !lifecycleBinding.checkpointId ||
    !isRecord(lifecycleBinding.completionSpec)
  ) {
    throw new Error('lifecycle finalization completion binding is invalid');
  }
  const successorAssignments = candidate.newAssignments.filter(
    (item) => item.role === 'executor',
  );
  const selectedSuccessor = successorAssignments.find(
    (item) => item.nodeId === lifecycleBinding.completionSpec?.next_node,
  );
  if (successorAssignments.length > 0 && !selectedSuccessor) {
    throw new Error(
      'lifecycle next_node does not match a dependency-unlocked candidate executor',
    );
  }
  const exact = {
    nodeId: assignment.nodeId,
    verifierAssignment: clone(assignment),
    verification: clone(callback),
    lifecycle: clone(lifecycleBinding),
    candidate: {
      state: clone(candidate.state),
      assignments: clone(candidate.newAssignments),
      successorAssignmentIds: candidate.newAssignments
        .filter((item) => item.role === 'executor')
        .map((item) => item.id)
        .sort(),
      successorContract: selectedSuccessor
        ? {
            kind: 'candidate-successor',
            assignmentId: selectedSuccessor.id,
            nodeId: selectedSuccessor.nodeId,
          }
        : {
            kind: 'terminal-no-successor',
            nextNode: lifecycleBinding.completionSpec?.next_node || null,
          },
    },
  };
  return {
    schemaVersion: '1.0.0',
    phase: 'prepared',
    ...exact,
    sha256: finalizationHash(exact),
  };
}

function assertLifecycleFinalization(journal) {
  if (
    !isRecord(journal) ||
    journal.schemaVersion !== '1.0.0' ||
    !['prepared', 'finalized'].includes(journal.phase) ||
    !isRecord(journal.verifierAssignment) ||
    journal.verifierAssignment.role !== 'verifier' ||
    journal.verifierAssignment.nodeId !== journal.nodeId ||
    !isRecord(journal.verification) ||
    journal.verification.kind !== 'verification' ||
    journal.verification.passed !== true ||
    journal.verification.assignmentId !== journal.verifierAssignment.id ||
    journal.verification.workerId !== journal.verifierAssignment.workerId ||
    journal.verification.artifactId !== journal.verifierAssignment.artifactId ||
    !isRecord(journal.candidate) ||
    !isRecord(journal.candidate.state) ||
    !Array.isArray(journal.candidate.assignments) ||
    !Array.isArray(journal.candidate.successorAssignmentIds) ||
    !isRecord(journal.lifecycle) ||
    journal.lifecycle.nodeId !== journal.nodeId ||
    typeof journal.lifecycle.programId !== 'string' ||
    !journal.lifecycle.programId ||
    typeof journal.lifecycle.checkpointId !== 'string' ||
    !journal.lifecycle.checkpointId ||
    !isRecord(journal.lifecycle.completionSpec)
  ) {
    throw new Error('lifecycle finalization journal is invalid');
  }
  const exact = {
    nodeId: journal.nodeId,
    verifierAssignment: clone(journal.verifierAssignment),
    verification: clone(journal.verification),
    lifecycle: clone(journal.lifecycle),
    candidate: clone(journal.candidate),
  };
  if (journal.sha256 !== finalizationHash(exact)) {
    throw new Error('lifecycle finalization journal hash does not match');
  }
  const completionSpec = journal.lifecycle.completionSpec;
  for (const field of [
    'completed_stage',
    'handoff_id',
    'next_node',
    'next_stage',
    'summary',
  ]) {
    if (typeof completionSpec[field] !== 'string' || !completionSpec[field]) {
      throw new Error(`lifecycle finalization completion binding requires ${field}`);
    }
  }
  if (!Array.isArray(completionSpec.blockers)) {
    throw new Error('lifecycle finalization completion binding requires blockers');
  }
  const successorAssignments = journal.candidate.assignments.filter(
    (assignment) => assignment?.role === 'executor',
  );
  const exactSuccessorIds = successorAssignments
    .map((assignment) => assignment.id)
    .sort();
  if (
    JSON.stringify(journal.candidate.successorAssignmentIds) !==
    JSON.stringify(exactSuccessorIds)
  ) {
    throw new Error('lifecycle finalization successor assignment ids do not match');
  }
  const selectedSuccessor = successorAssignments.find(
    (assignment) => assignment.nodeId === completionSpec.next_node,
  );
  const successorContract = journal.candidate.successorContract;
  if (
    successorAssignments.length > 0 &&
    (!selectedSuccessor ||
      successorContract?.kind !== 'candidate-successor' ||
      successorContract.assignmentId !== selectedSuccessor.id ||
      successorContract.nodeId !== selectedSuccessor.nodeId)
  ) {
    throw new Error('lifecycle finalization successor contract does not match');
  }
  if (
    successorAssignments.length === 0 &&
    (successorContract?.kind !== 'terminal-no-successor' ||
      successorContract.nextNode !== completionSpec.next_node)
  ) {
    throw new Error('terminal lifecycle finalization contract does not match');
  }
  if (journal.phase === 'finalized') {
    const receipt = journal.completionReceipt;
    const receiptSha256 = String(journal.completionReceiptSha256 || '');
    const checkpoint = receipt?.checkpoint;
    const handoff = receipt?.handoff;
    const evidence = checkpoint?.payload?.evidence;
    const expectedEvidence = lifecycleFinalizationEvidence(journal);
    let handoffBlockers = null;
    let handoffEvidence = null;
    try {
      handoffBlockers = parsedReceiptArray(
        handoff?.blockers_json,
        'blockers_json',
      );
      handoffEvidence = parsedReceiptArray(
        handoff?.evidence_json,
        'evidence_json',
      );
    } catch {
      throw new Error(
        'finalized lifecycle journal requires an exact public completion receipt',
      );
    }
    if (
      !isRecord(receipt) ||
      !/^[0-9a-f]{64}$/.test(receiptSha256) ||
      receiptSha256 !== finalizationHash(receipt) ||
      checkpoint?.event_type !== 'checkpoint_completed' ||
      checkpoint?.program_id !== journal.lifecycle.programId ||
      checkpoint?.checkpoint_id !== journal.lifecycle.checkpointId ||
      checkpoint?.node_id !== journal.nodeId ||
      checkpoint?.stage_id !== completionSpec.completed_stage ||
      handoff?.handoff_id !== completionSpec.handoff_id ||
      handoff?.program_id !== journal.lifecycle.programId ||
      handoff?.checkpoint_id !== journal.lifecycle.checkpointId ||
      handoff?.node_id !== journal.nodeId ||
      handoff?.stage_id !== completionSpec.completed_stage ||
      handoff?.next_node !== completionSpec.next_node ||
      handoff?.next_stage !== completionSpec.next_stage ||
      handoff?.summary !== completionSpec.summary ||
      (handoff?.to_role ?? null) !== (completionSpec.to_role ?? null) ||
      !Array.isArray(evidence) ||
      sha256Document(evidence) !== sha256Document(expectedEvidence) ||
      sha256Document(handoffBlockers) !==
        sha256Document(completionSpec.blockers || []) ||
      sha256Document(handoffEvidence) !== sha256Document(expectedEvidence)
    ) {
      throw new Error(
        'finalized lifecycle journal requires an exact public completion receipt',
      );
    }
  }
  if (
    journal.candidate.state.nodes?.[journal.nodeId]?.status !== 'completed'
  ) {
    throw new Error('lifecycle finalization candidate is not completed');
  }
  return clone(journal);
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
  executionScope,
  lifecycleFinalization = null,
}) {
  for (const assignment of assignments) {
    if (activeTasks.has(assignment.id)) continue;
    const prompt = createCodexAssignmentPrompt({
        graph,
        state,
        assignment,
        target,
        executionBoundary,
      });
    const scope = {
      ...clone(executionScope || {}),
      target: {
        projectId: target?.projectId || null,
        worktreePath: target?.worktreePath || null,
        repository: target?.repository || null,
        branch: target?.branch || null,
      },
      assignment: {
        nodeId: assignment.nodeId,
        role: assignment.role,
        attempt: assignment.attempt,
      },
    };
    const scopeHash = sha256Document(scope);
    const task = await codex.createTask({
      assignment: clone(assignment),
      prompt,
      target,
      idempotencyKey: `agentgraph-scope:${scopeHash}`,
      scope: clone(scope),
      scopeHash,
    });
    if (!isRecord(task) || typeof task.threadId !== 'string' || !task.threadId) {
      throw new Error(`Codex did not return a threadId for ${assignment.id}`);
    }
    task.assignment = clone(assignment);
    task.scope = clone(scope);
    task.scopeHash = scopeHash;
    task.activationPrompt = prompt;
    activeTasks.set(assignment.id, task);
    await saveSnapshot(
      saveState,
      state,
      activeTasks,
      completedTasks,
      lifecycleFinalization,
    );
    if (task.requiresLifecycleResume) {
      if (typeof codex.resumeTaskLifecycle !== 'function') {
        throw new Error('attached task lifecycle resume capability is required');
      }
      const lifecycleResume = await codex.resumeTaskLifecycle({
        assignmentId: task.assignment.id,
      });
      if (!isRecord(lifecycleResume) || containsPrivateLifecycleMaterial(lifecycleResume)) {
        throw new Error('attached lifecycle resume returned an invalid public receipt');
      }
      task.lifecycleResume = clone(lifecycleResume);
      delete task.requiresLifecycleResume;
      await saveSnapshot(
        saveState,
        state,
        activeTasks,
        completedTasks,
        lifecycleFinalization,
      );
    }
    if (['pending', 'attempted', 'activated'].includes(task.activation?.status)) {
      if (!isRecord(task.lifecycleResume)) {
        throw new Error(
          'attached task activation requires live lifecycle supervisor ownership',
        );
      }
      if (typeof codex.activateTask !== 'function') {
        throw new Error('attached task activation capability is required');
      }
      const previousActivation = clone(task.activation);
      const allowSend = previousActivation.status === 'pending';
      if (allowSend) {
        task.activation = {
          ...previousActivation,
          status: 'attempted',
        };
        await saveSnapshot(
          saveState,
          state,
          activeTasks,
          completedTasks,
          lifecycleFinalization,
        );
      }
      try {
        const receipt = await codex.activateTask({
          assignmentId: task.assignment.id,
          activationId: task.activation.activationId,
          threadId: task.threadId,
          hostId: task.hostId || undefined,
          prompt: task.activationPrompt,
          allowSend,
        });
        const expectedMarker =
          `agentgraph-activation:${task.activation.activationId}`;
        if (
          !isRecord(receipt) ||
          receipt.activationId !== task.activation.activationId ||
          receipt.activationMarker !== expectedMarker ||
          typeof receipt.baselineTurnId !== 'string' ||
          !receipt.baselineTurnId ||
          (previousActivation.status === 'activated' &&
            (previousActivation.receipt?.activationMarker !==
              receipt.activationMarker ||
              previousActivation.receipt?.baselineTurnId !==
                receipt.baselineTurnId))
        ) {
          throw new Error('attached task activation receipt is invalid or stale');
        }
        task.activation = {
          ...task.activation,
          status: 'activated',
          receipt: clone(receipt),
        };
        delete task.activationPrompt;
        await saveSnapshot(
          saveState,
          state,
          activeTasks,
          completedTasks,
          lifecycleFinalization,
        );
      } catch (error) {
        task.activation = {
          ...task.activation,
          status: 'attempted',
          error: error.message,
        };
        delete task.activationPrompt;
        await saveSnapshot(
          saveState,
          state,
          activeTasks,
          completedTasks,
          lifecycleFinalization,
        );
        throw error;
      }
    } else {
      delete task.activationPrompt;
    }
  }
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
    resumeSnapshot = null,
    executionScope = null,
  } = input || {};
  if (!isRecord(codex) || typeof codex.createTask !== 'function' || typeof codex.waitForAny !== 'function') {
    throw new Error('codex.createTask and codex.waitForAny are required');
  }

  const activeTasks = new Map();
  const resolvedExecutionScope = executionScope || {
    source: {
      kind: 'direct-agentgraph',
      graphSha256: sha256Document(graph),
    },
  };
  const completedTasks = clone(resumeSnapshot?.completedTasks || []);
  let lifecycleFinalization = resumeSnapshot?.lifecycleFinalization
    ? assertLifecycleFinalization(resumeSnapshot.lifecycleFinalization)
    : null;
  let dispatched;

  if (lifecycleFinalization) {
    if (lifecycleFinalization.phase === 'prepared') {
      if (typeof codex.reconcilePreparedLifecycleFinalization !== 'function') {
        throw new Error(
          'prepared lifecycle finalization requires public DB reconciliation',
        );
      }
      const reconciliation = await codex.reconcilePreparedLifecycleFinalization(
        clone(lifecycleFinalization),
      );
      if (
        !isRecord(reconciliation) ||
        reconciliation.completed !== true ||
        !isRecord(reconciliation.receipt)
      ) {
        throw new Error('prepared lifecycle finalization is not completed in the lifecycle DB');
      }
      if (containsPrivateLifecycleMaterial(reconciliation.receipt)) {
        throw new Error('lifecycle completion reconciliation returned private material');
      }
      lifecycleFinalization = {
        ...lifecycleFinalization,
        phase: 'finalized',
        completionReceipt: clone(reconciliation.receipt),
        completionReceiptSha256: finalizationHash(reconciliation.receipt),
      };
      assertLifecycleFinalization(lifecycleFinalization);
    }
    dispatched = {
      status: lifecycleFinalization.candidate.state.status,
      state: clone(lifecycleFinalization.candidate.state),
      newAssignments: clone(lifecycleFinalization.candidate.assignments),
      report: lifecycleFinalization.candidate.state.halt || null,
    };
    const byAssignmentId = new Map(
      lifecycleFinalization.candidate.assignments.map((assignment) => [
        assignment.id,
        assignment,
      ]),
    );
    for (const [assignmentId, record] of Object.entries(
      resumeSnapshot?.taskRegistry || {},
    )) {
      const assignment = byAssignmentId.get(assignmentId);
      if (
        assignment &&
        record?.status === 'running' &&
        typeof record.threadId === 'string' &&
        record.threadId
      ) {
        activeTasks.set(assignmentId, {
          assignment: clone(assignment),
          threadId: record.threadId,
          hostId: record.hostId || null,
          cursor: record.cursor || null,
          ...(record.lifecycleResume
            ? { lifecycleResume: clone(record.lifecycleResume) }
            : {}),
          ...(record.activation ? { activation: clone(record.activation) } : {}),
        });
      }
    }
    await saveSnapshot(
      saveState,
      dispatched.state,
      activeTasks,
      completedTasks,
      lifecycleFinalization,
    );
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
      executionScope: resolvedExecutionScope,
      lifecycleFinalization,
    });
  } else if (resumeSnapshot) {
    if (!isRecord(resumeSnapshot.executionState)) {
      throw new Error('resume snapshot requires an executionState');
    }
    const resumedState = clone(resumeSnapshot.executionState);
    dispatched = {
      status: resumedState.status,
      state: resumedState,
      newAssignments: [],
      report: resumedState.halt || null,
    };
    const runningRecords = Object.values(resumeSnapshot.taskRegistry || {})
      .filter((record) => record?.status === 'running');
    const assignments = [];
    for (const record of runningRecords) {
      const assignment = record?.assignment;
      const nodeState = resumedState.nodes?.[record?.nodeId];
      const expected =
        record?.role === 'executor'
          ? nodeState?.executorAssignment
          : nodeState?.verifierAssignment;
      if (
        !isRecord(assignment) ||
        assignment.id !== record.assignmentId ||
        assignment.nodeId !== record.nodeId ||
        assignment.role !== record.role ||
        expected?.id !== assignment.id ||
        typeof record.threadId !== 'string' ||
        !record.threadId
      ) {
        throw new Error('resume snapshot contains an inconsistent running task');
      }
      assignments.push(clone(assignment));
    }
    if (
      !['complete', 'halted'].includes(dispatched.status) &&
      assignments.length === 0
    ) {
      dispatched.state = {
        ...resumedState,
        status: 'halted',
        halt: {
          reason: 'resume_inconsistent_no_active_task',
          error:
            'The durable execution snapshot is nonterminal but has no running task to reattach.',
        },
      };
      dispatched.status = 'halted';
      dispatched.report = dispatched.state.halt;
      await saveSnapshot(
        saveState,
        dispatched.state,
        activeTasks,
        completedTasks,
        lifecycleFinalization,
      );
    } else if (assignments.length > 0) {
      if (typeof codex.reattachTask !== 'function') {
        throw new Error('resume snapshot requires codex.reattachTask');
      }
      const reattachingCodex = {
        ...codex,
        createTask: (args) => codex.reattachTask(args),
      };
      await launchAssignments({
        assignments,
        graph,
        state: dispatched.state,
        codex: reattachingCodex,
        target,
        activeTasks,
        saveState,
        completedTasks,
        executionBoundary,
        executionScope: resolvedExecutionScope,
        lifecycleFinalization,
      });
    }
  } else {
    dispatched = dispatchAgentGraph({
      graph,
      state: initialState,
      workers,
      maxConcurrentExecutors,
      executionBoundary,
      now: now(),
    });
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
      executionScope: resolvedExecutionScope,
      lifecycleFinalization,
    });
  }

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
        baselineTurnId:
          task.activation?.receipt?.baselineTurnId || undefined,
        activationMarker:
          task.activation?.receipt?.activationMarker || undefined,
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
        assignment: clone(active.assignment),
        nodeId: active.assignment.nodeId,
        role: active.assignment.role,
        workerId: active.assignment.workerId,
        threadId: active.threadId,
        hostId: active.hostId || null,
        cursor: active.cursor,
        codexThreadId: outcome.codexThreadId || null,
        status: 'completed',
        ...(active.scope ? { scope: clone(active.scope) } : {}),
        ...(active.scopeHash ? { scopeHash: active.scopeHash } : {}),
        callback: clone(callback),
        ...(active.lifecycleResume
          ? { lifecycleResume: clone(active.lifecycleResume) }
          : {}),
        ...(active.activation ? { activation: clone(active.activation) } : {}),
      });
    } catch (error) {
      callbackInput = terminalCallbackForFailure(active.assignment, error.message);
      completedTasks.push({
        assignmentId: active.assignment.id,
        assignment: clone(active.assignment),
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
        ...(active.scope ? { scope: clone(active.scope) } : {}),
        ...(active.scopeHash ? { scopeHash: active.scopeHash } : {}),
        ...(active.lifecycleResume
          ? { lifecycleResume: clone(active.lifecycleResume) }
          : {}),
        ...(active.activation ? { activation: clone(active.activation) } : {}),
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
      typeof codex.completeVerifiedNodeLifecycle === 'function' &&
      (typeof codex.requiresLifecycleFinalization !== 'function' ||
        (await codex.requiresLifecycleFinalization({
          nodeId: active.assignment.nodeId,
        })))
    ) {
      lifecycleFinalization = prepareLifecycleFinalization({
        assignment: active.assignment,
        callback: parsedCallback,
        candidate,
        lifecycleBinding:
          typeof codex.getLifecycleCompletionBinding === 'function'
            ? await codex.getLifecycleCompletionBinding(
                active.assignment.nodeId,
              )
            : null,
      });
      await saveSnapshot(
        saveState,
        previousState,
        activeTasks,
        completedTasks,
        lifecycleFinalization,
      );
      const completionRequest = {
        assignment: clone(active.assignment),
        callback: clone(parsedCallback),
        finalization: clone(lifecycleFinalization),
      };
      let completionReceipt = null;
      let completionError = null;
      try {
        completionReceipt =
          await codex.completeVerifiedNodeLifecycle(completionRequest);
      } catch (firstError) {
        if (typeof codex.reconcilePreparedLifecycleFinalization === 'function') {
          try {
            const reconciliation =
              await codex.reconcilePreparedLifecycleFinalization(
                clone(lifecycleFinalization),
              );
            if (
              isRecord(reconciliation) &&
              reconciliation.completed === true &&
              isRecord(reconciliation.receipt)
            ) {
              completionReceipt = reconciliation.receipt;
            }
          } catch {
            // The one bounded retry below remains safe under the same private supervisor.
          }
        }
        if (!completionReceipt) {
          try {
            completionReceipt =
              await codex.completeVerifiedNodeLifecycle(completionRequest);
          } catch (retryError) {
            completionError = retryError;
          }
        }
        if (!completionReceipt && !completionError) completionError = firstError;
      }
      if (!completionError) {
        try {
        if (!isRecord(completionReceipt)) {
          throw new Error('lifecycle completion requires a public completion receipt');
        }
        if (containsPrivateLifecycleMaterial(completionReceipt)) {
          throw new Error('lifecycle completion returned private material');
        }
        lifecycleFinalization = {
          ...lifecycleFinalization,
          phase: 'finalized',
          completionReceipt: clone(completionReceipt),
          completionReceiptSha256: finalizationHash(completionReceipt),
        };
        assertLifecycleFinalization(lifecycleFinalization);
        await saveSnapshot(
          saveState,
          candidate.state,
          activeTasks,
          completedTasks,
          lifecycleFinalization,
        );
        } catch (error) {
          if (lifecycleFinalization?.phase === 'finalized') throw error;
          completionError = error;
        }
      }
      if (completionError) {
        callbackInput = terminalCallbackForFailure(
          active.assignment,
          completionError.message,
        );
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
          taskRecord.error = completionError.message;
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
        executionScope: resolvedExecutionScope,
        lifecycleFinalization,
      });
    }
    await saveSnapshot(
      saveState,
      dispatched.state,
      activeTasks,
      completedTasks,
      lifecycleFinalization,
    );
  }

  return {
    ...dispatched,
    tasks: taskSnapshot(activeTasks),
    completedTasks: clone(completedTasks),
    ...(lifecycleFinalization
      ? { lifecycleFinalization: clone(lifecycleFinalization) }
      : {}),
  };
}

export async function runAuthoritativeLedgerWaveWithCodex({
  ledgerInput,
  codex,
  saveState,
  now,
  resumeSnapshot,
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
    executionScope: {
      source: clone(ledgerInput.source),
      ...(ledgerInput.programId ? { programId: ledgerInput.programId } : {}),
      ...(ledgerInput.checkpointId
        ? { checkpointId: ledgerInput.checkpointId }
        : {}),
    },
    saveState,
    now,
    resumeSnapshot,
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

const lifecycleHeartbeatControllers = new WeakMap();

function lifecycleHeartbeatController(lifecycleSupervisor, taskControl) {
  let controller = lifecycleHeartbeatControllers.get(lifecycleSupervisor);
  if (controller) {
    controller.setTaskControl(taskControl);
    return controller;
  }
  const leases = new Map();
  let currentTaskControl = taskControl;
  let timer = null;
  let stopped = false;
  let failure = null;
  let resolveFailure;
  const failureSignal = new Promise((resolve) => {
    resolveFailure = resolve;
  });
  const stopTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const steerOnce = async () => {
    if (typeof currentTaskControl?.steerTask !== 'function') return;
    await Promise.allSettled(
      [...leases.values()]
        .filter((lifecycle) => !lifecycle.stopSteered)
        .map((lifecycle) => {
          lifecycle.stopSteered = true;
          return currentTaskControl.steerTask({
            threadId: lifecycle.threadId,
            ...(lifecycle.hostId ? { hostId: lifecycle.hostId } : {}),
            prompt:
              'Stop: the authoritative lifecycle heartbeat failed. Preserve state and do not continue.',
          });
        }),
    );
  };
  const fail = async (error) => {
    if (failure) return;
    failure = new Error(`lifecycle heartbeat failed: ${error.message}`);
    stopTimer();
    await steerOnce();
    resolveFailure(failure);
  };
  const schedule = () => {
    if (stopped || failure || leases.size === 0 || timer) return;
    const intervalMs = Math.min(
      ...[...leases.values()].map((lifecycle) => lifecycle.heartbeatIntervalMs),
    );
    timer = setTimeout(async () => {
      timer = null;
      try {
        for (const lifecycle of leases.values()) {
          if (typeof lifecycleSupervisor.renewAttachedCheckpoint !== 'function') {
            throw new Error('lifecycle supervisor heartbeat operation is required');
          }
          const renewed = await lifecycleSupervisor.renewAttachedCheckpoint(
            clone(lifecycle.binding),
            { ttlSeconds: lifecycle.leaseTtlSeconds },
          );
          if (containsPrivateLifecycleMaterial(renewed)) {
            throw new Error('lifecycle heartbeat returned private material');
          }
        }
      } catch (error) {
        await fail(error);
        return;
      }
      schedule();
    }, intervalMs);
    timer.unref?.();
  };
  controller = {
    setTaskControl(value) {
      currentTaskControl = value;
    },
    add(assignmentId, lifecycle) {
      if (failure) throw failure;
      leases.set(assignmentId, lifecycle);
      schedule();
    },
    remove(assignmentId) {
      leases.delete(assignmentId);
      if (leases.size === 0) stopTimer();
    },
    assertHealthy() {
      if (failure) throw failure;
    },
    async race(operation) {
      this.assertHealthy();
      const result = await Promise.race([
        Promise.resolve().then(operation),
        failureSignal.then((error) => Promise.reject(error)),
      ]);
      this.assertHealthy();
      return result;
    },
    stop() {
      stopped = true;
      leases.clear();
      stopTimer();
    },
  };
  lifecycleHeartbeatControllers.set(lifecycleSupervisor, controller);
  return controller;
}

export function createInjectedHostTaskControlAdapter({
  taskControl,
  attachedTasks,
  lifecycleSupervisor,
  lifecycleRecovery,
  lifecycleNow = () => new Date().toISOString(),
  resumeSnapshot = null,
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
  const pendingLifecycle = new Map();
  const heartbeats = isRecord(lifecycleSupervisor)
    ? lifecycleHeartbeatController(lifecycleSupervisor, taskControl)
    : null;
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
      if (!attached) {
        return heartbeats
          ? heartbeats.race(() => taskControl.createTask(args))
          : taskControl.createTask(args);
      }
      if (attached.role !== args.assignment.role) {
        throw new Error(`attached task role does not match ${args.assignment.id}`);
      }
      if (attached.status === 'needs-attention') {
        if (typeof taskControl.activateTask !== 'function') {
          throw new Error(
            'attached task activation capability is required before lifecycle resume',
          );
        }
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
          lifecycleRecovery.generation < 1 ||
          (lifecycleRecovery.heartbeatIntervalMs !== undefined &&
            (!Number.isInteger(lifecycleRecovery.heartbeatIntervalMs) ||
              lifecycleRecovery.heartbeatIntervalMs < 1)) ||
          (lifecycleRecovery.leaseTtlSeconds !== undefined &&
            (!Number.isInteger(lifecycleRecovery.leaseTtlSeconds) ||
              lifecycleRecovery.leaseTtlSeconds < 1))
        ) {
          throw new Error('authoritative lifecycle recovery binding is invalid');
        }
        const heartbeatIntervalMs = lifecycleRecovery.heartbeatIntervalMs ?? 60_000;
        const leaseTtlSeconds = lifecycleRecovery.leaseTtlSeconds ?? 1800;
        if (heartbeatIntervalMs >= leaseTtlSeconds * 1000) {
          throw new Error('lifecycle heartbeat interval must be shorter than the lease TTL');
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
        const lifecycle = {
          binding: clone(binding),
          completion: clone(lifecycleRecovery.completion || null),
          threadId: attached.threadId,
          hostId: attached.hostId || null,
          heartbeatIntervalMs,
          leaseTtlSeconds,
        };
        pendingLifecycle.set(args.assignment.id, lifecycle);
        const activationId = createHash('sha256')
          .update(
            JSON.stringify({
              assignmentId: args.assignment.id,
              threadId: attached.threadId,
              recoveryId: lifecycleRecovery.recoveryId,
              generation: lifecycleRecovery.generation,
            }),
          )
          .digest('hex');
        const persistedActivation =
          resumeSnapshot?.taskRegistry?.[args.assignment.id]?.activation || null;
        if (
          persistedActivation &&
          persistedActivation.activationId !== activationId
        ) {
          throw new Error('persisted attached task activation does not match');
        }
        if (typeof taskControl.activateTask === 'function') {
          attached.activation = persistedActivation
            ? clone(persistedActivation)
            : { activationId, status: 'pending' };
        }
      }
      attachments.delete(args.assignment.id);
      return {
        threadId: attached.threadId,
        hostId: attached.hostId || null,
        cursor: attached.cursor || null,
        ...(resumeSnapshot?.taskRegistry?.[args.assignment.id]?.lifecycleResume
          ? {
              lifecycleResume: clone(
                resumeSnapshot.taskRegistry[args.assignment.id].lifecycleResume,
              ),
            }
          : {}),
        ...(pendingLifecycle.has(args.assignment.id)
          ? { requiresLifecycleResume: true }
          : {}),
        ...(attached.activation ? { activation: clone(attached.activation) } : {}),
      };
    },
    async reattachTask(args) {
      return this.createTask(args);
    },
    async activateTask(args) {
      if (pendingLifecycle.has(args.assignmentId)) {
        throw new Error(
          'attached task activation requires live lifecycle supervisor ownership',
        );
      }
      const receipt = await heartbeats.race(() =>
        taskControl.activateTask(clone(args)),
      );
      if (containsPrivateLifecycleMaterial(receipt)) {
        throw new Error('attached task activation returned private material');
      }
      return clone(receipt || { activationId: args.activationId });
    },
    async resumeTaskLifecycle({ assignmentId }) {
      const lifecycle = pendingLifecycle.get(assignmentId);
      if (!lifecycle) return null;
      if (resumedLifecycle.has(assignmentId)) {
        return clone(
          resumeSnapshot?.taskRegistry?.[assignmentId]?.lifecycleResume || null,
        );
      }
      const publicResult = await lifecycleSupervisor.resumeAttachedCheckpoint(
        clone(lifecycle.binding),
      );
      assertPublicLifecycleResume(publicResult, lifecycle.binding);
      const lifecycleResume = {
        recoveryId: lifecycle.binding.recovery_id,
        generation: lifecycle.binding.generation,
        requestSha256: publicResult.request_sha256,
        eventHash: publicResult.event.event_hash,
        registrySha256: lifecycle.binding.registry_sha256,
        recoveryAuditSha256: lifecycle.binding.recovery_audit_sha256,
      };
      resumedLifecycle.set(assignmentId, lifecycle);
      pendingLifecycle.delete(assignmentId);
      heartbeats.add(assignmentId, lifecycle);
      return lifecycleResume;
    },
    async waitForAny(tasks) {
      try {
        return await (heartbeats
          ? heartbeats.race(() => taskControl.waitForAny(tasks))
          : taskControl.waitForAny(tasks));
      } catch (error) {
        if (/lifecycle heartbeat failed/i.test(error.message)) {
          return {
            assignmentId: tasks[0]?.assignmentId,
            status: 'failed',
            error: error.message,
          };
        }
        throw error;
      }
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
      const telemetry = await heartbeats.race(() =>
        lifecycleSupervisor.recordAttachedTelemetryDecision(
          clone(lifecycle.binding),
          telemetryRequest,
        ),
      );
      if (containsPrivateLifecycleMaterial(telemetry)) {
        throw new Error('lifecycle telemetry returned private material');
      }
      lifecycle.telemetryRecorded = true;
      return clone(telemetry);
    },
    requiresLifecycleFinalization({ nodeId }) {
      return [...resumedLifecycle.values()].some(
        (lifecycle) => lifecycle.binding.node_id === nodeId,
      );
    },
    getLifecycleCompletionBinding(nodeId) {
      const lifecycle = [...resumedLifecycle.values()].find(
        (item) => item.binding.node_id === nodeId,
      );
      if (!lifecycle || !isRecord(lifecycle.completion)) {
        throw new Error('host-owned lifecycle completion binding is required');
      }
      const completionSpec = clone(lifecycle.completion);
      for (const field of [
        'completed_stage',
        'handoff_id',
        'next_node',
        'next_stage',
        'summary',
      ]) {
        if (typeof completionSpec[field] !== 'string' || !completionSpec[field]) {
          throw new Error(`lifecycle completion binding requires ${field}`);
        }
      }
      if (!Array.isArray(completionSpec.blockers)) {
        throw new Error('lifecycle completion binding requires blockers');
      }
      return {
        programId: lifecycle.binding.program_id,
        checkpointId: lifecycle.binding.checkpoint_id,
        nodeId,
        completionSpec,
      };
    },
    async completeVerifiedNodeLifecycle({ assignment, callback, finalization }) {
      const entry = [...resumedLifecycle.entries()].find(
        ([, lifecycle]) => lifecycle.binding.node_id === assignment.nodeId,
      );
      if (!entry) return null;
      const [executorAssignmentId, lifecycle] = entry;
      if (
        callback?.kind !== 'verification' ||
        callback.passed !== true ||
        lifecycle.telemetryRecorded !== true ||
        finalization?.phase !== 'prepared' ||
        finalization?.nodeId !== assignment.nodeId ||
        !/^[0-9a-f]{64}$/.test(String(finalization?.sha256 || ''))
      ) {
        throw new Error('verified lifecycle completion requires passing independent verification');
      }
      if (typeof lifecycleSupervisor.completeAttachedCheckpoint !== 'function') {
        throw new Error('lifecycle supervisor completion operation is required');
      }
      const completionInput = {
        ...clone(finalization.lifecycle.completionSpec),
        evidence: [
          ...clone(finalization.lifecycle.completionSpec.evidence || []),
          {
            kind: 'agentgraph-verification',
            assignmentId: assignment.id,
            artifactId: callback.artifactId,
            evidence: clone(callback.evidence || []),
          },
          {
            kind: 'agentgraph-finalization',
            sha256: finalization.sha256,
          },
        ],
      };
      const completion = await heartbeats.race(() =>
        lifecycleSupervisor.completeAttachedCheckpoint(
          clone(lifecycle.binding),
          completionInput,
        ),
      );
      if (containsPrivateLifecycleMaterial(completion)) {
        throw new Error('lifecycle completion returned private material');
      }
      resumedLifecycle.delete(executorAssignmentId);
      heartbeats.remove(executorAssignmentId);
      return clone(completion);
    },
    async reconcilePreparedLifecycleFinalization(journal) {
      assertLifecycleFinalization(journal);
      if (
        !isRecord(lifecycleRecovery) ||
        lifecycleRecovery.assignmentId !==
          journal.candidate.state.nodes?.[journal.nodeId]?.executorAssignment?.id ||
        typeof lifecycleRecovery.programId !== 'string' ||
        !lifecycleRecovery.programId ||
        typeof lifecycleRecovery.checkpointId !== 'string' ||
        !lifecycleRecovery.checkpointId ||
        lifecycleRecovery.programId !== journal.lifecycle.programId ||
        lifecycleRecovery.checkpointId !== journal.lifecycle.checkpointId ||
        journal.lifecycle.nodeId !== journal.nodeId
      ) {
        throw new Error('prepared lifecycle reconciliation binding is invalid');
      }
      const attached = attachments.get(lifecycleRecovery.assignmentId);
      if (!attached || attached.role !== 'executor') {
        throw new Error('prepared lifecycle reconciliation requires the same attached executor');
      }
      if (
        !isRecord(lifecycleSupervisor) ||
        typeof lifecycleSupervisor.reconcileAttachedCheckpointCompletion !==
          'function'
      ) {
        throw new Error('lifecycle supervisor completion reconciliation is required');
      }
      const reconciliation =
        await heartbeats.race(() =>
          lifecycleSupervisor.reconcileAttachedCheckpointCompletion(
          {
            program_id: journal.lifecycle.programId,
            checkpoint_id: journal.lifecycle.checkpointId,
            node_id: journal.nodeId,
          },
          { finalizationSha256: journal.sha256 },
          ),
        );
      if (containsPrivateLifecycleMaterial(reconciliation)) {
        throw new Error('lifecycle completion reconciliation returned private material');
      }
      return clone(reconciliation);
    },
    raceLifecyclePhase(operation) {
      return heartbeats ? heartbeats.race(operation) : Promise.resolve().then(operation);
    },
    assertLifecycleHealthy() {
      heartbeats?.assertHealthy();
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
  resumeSnapshot,
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
    resumeSnapshot,
  });
  const guardedSaveState =
    typeof saveState === 'function'
      ? (snapshot) =>
          snapshot?.executionState?.status === 'halted'
            ? saveState(snapshot)
            : injectedTaskControl.raceLifecyclePhase(() => saveState(snapshot))
      : saveState;
  return runAuthoritativeLedgerWaveWithCodex({
    ledgerInput,
    codex: injectedTaskControl,
    saveState: guardedSaveState,
    now,
    resumeSnapshot,
  });
}

export function createAuthoritativeLedgerWavePythonLifecycleController({
  pythonLifecycle,
  createLifecycleBridge = createPythonLifecycleSupervisorBridge,
  runWave = runAuthoritativeLedgerWaveWithAttachedHostTasks,
  saveState = async () => {},
  ...waveInput
}) {
  if (
    !isRecord(pythonLifecycle) ||
    typeof createLifecycleBridge !== 'function' ||
    typeof runWave !== 'function' ||
    typeof saveState !== 'function'
  ) {
    throw new Error(
      'pythonLifecycle configuration, bridge factory, wave runner, and saveState are required',
    );
  }
  const lifecycleSupervisor = createLifecycleBridge(pythonLifecycle);
  if (!isRecord(lifecycleSupervisor) || typeof lifecycleSupervisor.close !== 'function') {
    throw new Error('Python lifecycle bridge must provide close');
  }
  let latestSnapshot = null;
  let closed = false;
  const preservingSaveState = async (snapshot) => {
    await saveState(snapshot);
    latestSnapshot = clone(snapshot);
  };
  const unresolvedLifecycle = (snapshot) =>
    Object.values(snapshot?.taskRegistry || {}).some(
      (record) => isRecord(record?.lifecycleResume),
    );
  const isTerminalWithoutUnresolvedLifecycle = (snapshot) =>
    ['complete', 'halted'].includes(snapshot?.executionState?.status) &&
    !snapshot?.lifecycleFinalization &&
    !unresolvedLifecycle(snapshot);

  return {
    async run(overrides = {}) {
      if (closed) throw new Error('Python lifecycle controller is closed');
      return runWave({
        ...waveInput,
        ...overrides,
        lifecycleSupervisor,
        saveState: preservingSaveState,
      });
    },
    async close({ terminalPreserved = false } = {}) {
      if (closed) return;
      if (!terminalPreserved || !latestSnapshot) {
        throw new Error('cannot close lifecycle supervisor before terminal preservation');
      }
      let journal = latestSnapshot.lifecycleFinalization || null;
      if (journal?.phase === 'prepared') {
        assertLifecycleFinalization(journal);
        if (
          typeof lifecycleSupervisor.reconcileAttachedCheckpointCompletion !==
          'function'
        ) {
          throw new Error(
            'prepared lifecycle finalization requires completion reconciliation before close',
          );
        }
        const reconciliation =
          await lifecycleSupervisor.reconcileAttachedCheckpointCompletion(
            {
              program_id: journal.lifecycle.programId,
              checkpoint_id: journal.lifecycle.checkpointId,
              node_id: journal.nodeId,
            },
            { finalizationSha256: journal.sha256 },
          );
        if (
          !isRecord(reconciliation) ||
          reconciliation.completed !== true ||
          !isRecord(reconciliation.receipt)
        ) {
          throw new Error(
            'cannot close lifecycle supervisor while prepared completion is unresolved',
          );
        }
        journal = {
          ...journal,
          phase: 'finalized',
          completionReceipt: clone(reconciliation.receipt),
          completionReceiptSha256: finalizationHash(reconciliation.receipt),
        };
        assertLifecycleFinalization(journal);
        const reconciledSnapshot = {
          ...clone(latestSnapshot),
          executionState: clone(journal.candidate.state),
          lifecycleFinalization: clone(journal),
        };
        await preservingSaveState(reconciledSnapshot);
      }
      if (
        journal?.phase !== 'finalized' &&
        !isTerminalWithoutUnresolvedLifecycle(latestSnapshot)
      ) {
        throw new Error('cannot close lifecycle supervisor with unresolved lifecycle state');
      }
      if (journal?.phase === 'finalized') assertLifecycleFinalization(journal);
      lifecycleHeartbeatControllers.get(lifecycleSupervisor)?.stop();
      await lifecycleSupervisor.close();
      closed = true;
    },
  };
}

export function runAuthoritativeLedgerWaveWithPythonLifecycle(options) {
  return createAuthoritativeLedgerWavePythonLifecycleController(options);
}
