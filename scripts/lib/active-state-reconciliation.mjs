import { createHash } from 'node:crypto';

const STATUSES = new Set(['RECONCILED', 'QUARANTINED', 'NO_LIFECYCLE_PROGRESS']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function timestamp(value) {
  const parsed = new Date(value || 0).valueOf();
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareByNewest(a, b) {
  return (
    timestamp(b.acceptedAt || b.createdAt || b.acquiredAt) -
      timestamp(a.acceptedAt || a.createdAt || a.acquiredAt) ||
    String(b.handoffId || b.checkpointId || '').localeCompare(String(a.handoffId || a.checkpointId || ''))
  );
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function stateResult(fields) {
  if (!STATUSES.has(fields.status)) {
    throw new Error(`invalid reconciliation status: ${fields.status}`);
  }
  return {
    status: fields.status,
    authority: fields.authority || null,
    reason: fields.reason || null,
    effectiveCursor: fields.effectiveCursor || null,
    activeCheckpoint: fields.activeCheckpoint || null,
    readyNodeIds: fields.readyNodeIds || [],
  };
}

function quarantine(reason, details = {}) {
  return stateResult({
    status: 'QUARANTINED',
    authority: details.authority || null,
    reason,
    effectiveCursor: null,
    activeCheckpoint: details.activeCheckpoint || null,
    readyNodeIds: [],
  });
}

function completedNodeIds(state) {
  const ids = new Set(state.graph?.historicalCompleteNodeIds || []);
  for (const checkpoint of state.lifecycle?.checkpoints || []) {
    if (checkpoint?.eventType === 'checkpoint_completed' && checkpoint.nodeId) {
      ids.add(checkpoint.nodeId);
    }
  }
  return ids;
}

function readyNodeIds(state, completed = completedNodeIds(state)) {
  return Object.entries(state.graph?.nodes || {})
    .filter(([nodeId]) => !completed.has(nodeId))
    .filter(([, node]) => (node.dependsOn || []).every((dependency) => completed.has(dependency)))
    .map(([nodeId]) => nodeId)
    .sort((a, b) => a.localeCompare(b));
}

function missingDependencies(state, nodeId) {
  const completed = completedNodeIds(state);
  const node = state.graph?.nodes?.[nodeId];
  if (!node) return [`unknown node: ${nodeId}`];
  return (node.dependsOn || []).filter((dependency) => !completed.has(dependency));
}

function checkpointsById(state) {
  return new Map((state.lifecycle?.checkpoints || []).map((checkpoint) => [checkpoint.checkpointId, checkpoint]));
}

function unexpiredLeases(state, now) {
  return (state.lifecycle?.activeLeases || [])
    .filter((lease) => timestamp(lease.expiresAt) >= now.valueOf())
    .sort(compareByNewest);
}

function validateLease(state, lease) {
  const checkpoint = checkpointsById(state).get(lease.checkpointId);
  if (!checkpoint) {
    return quarantine(`active lease points to missing checkpoint: ${lease.checkpointId}`, {
      authority: 'active_lease',
    });
  }
  if (lease.branch && lease.branch !== state.integrationBranch) {
    return quarantine(`active lease branch ${lease.branch} does not match ${state.integrationBranch}`, {
      authority: 'active_lease',
      activeCheckpoint: checkpoint,
    });
  }
  if (state.worktree?.branch && state.worktree.branch !== state.integrationBranch) {
    return quarantine(`worktree branch ${state.worktree.branch} does not match ${state.integrationBranch}`, {
      authority: 'active_lease',
      activeCheckpoint: checkpoint,
    });
  }
  const ancestors = new Set(state.worktree?.ancestorShas || []);
  if (state.worktree?.headSha) ancestors.add(state.worktree.headSha);
  if (!ancestors.has(lease.headSha)) {
    return quarantine(`active lease head ${lease.headSha} is not ancestral to current worktree head`, {
      authority: 'active_lease',
      activeCheckpoint: checkpoint,
    });
  }
  return stateResult({
    status: 'RECONCILED',
    authority: 'active_lease',
    effectiveCursor: {
      nodeId: lease.nodeId,
      stageId: lease.stageId,
      headSha: lease.headSha,
    },
    activeCheckpoint: checkpoint,
  });
}

function validateAcceptedHandoff(state, handoff) {
  const checkpoint = checkpointsById(state).get(handoff.checkpointId);
  if (!checkpoint) {
    return quarantine(`accepted handoff points to missing checkpoint: ${handoff.checkpointId}`, {
      authority: 'accepted_handoff',
    });
  }
  const missing = missingDependencies(state, handoff.nextNode);
  if (missing.length) {
    return quarantine(`accepted handoff has unsatisfied dependencies: ${missing.join(', ')}`, {
      authority: 'accepted_handoff',
      activeCheckpoint: checkpoint,
    });
  }
  return stateResult({
    status: 'RECONCILED',
    authority: 'accepted_handoff',
    effectiveCursor: {
      nodeId: handoff.nextNode,
      stageId: handoff.nextStage,
      headSha: handoff.headSha,
    },
    activeCheckpoint: checkpoint,
  });
}

function reconcileFromCheckpoint(state) {
  const checkpoints = (state.lifecycle?.checkpoints || [])
    .filter((checkpoint) => checkpoint?.eventType === 'checkpoint_completed')
    .sort(compareByNewest);
  const latest = checkpoints[0];
  if (!latest) return null;
  return stateResult({
    status: 'RECONCILED',
    authority: 'latest_completed_checkpoint',
    activeCheckpoint: latest,
    readyNodeIds: readyNodeIds(state),
  });
}

export function reconcileActiveState(state, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (!isRecord(state)) return quarantine('reconciliation state must be an object');

  const activeLeases = unexpiredLeases(state, now);
  if (activeLeases.length > 1) {
    return quarantine('contradictory active lifecycle records: multiple unexpired leases', {
      authority: 'active_lease',
    });
  }

  let result = null;
  if (activeLeases.length === 1) {
    result = validateLease(state, activeLeases[0]);
  } else {
    const acceptedHandoffs = (state.lifecycle?.handoffs || [])
      .filter((handoff) => handoff?.status === 'accepted')
      .sort(compareByNewest);
    if (acceptedHandoffs.length > 0) {
      result = validateAcceptedHandoff(state, acceptedHandoffs[0]);
    } else {
      result = reconcileFromCheckpoint(state);
    }
  }

  if (!result) {
    const hasLifecycleProgress = Boolean(
      (state.lifecycle?.activeLeases || []).length ||
        (state.lifecycle?.checkpoints || []).length ||
        (state.lifecycle?.handoffs || []).length,
    );
    if (hasLifecycleProgress) {
      result = quarantine('lifecycle history exists but no valid reconciliation authority was found');
    } else {
      result = stateResult({
        status: 'NO_LIFECYCLE_PROGRESS',
        authority: 'imported_cursor',
        effectiveCursor: state.importedCursor,
      });
    }
  }

  if (result.status !== 'QUARANTINED' && typeof options.apply === 'function') {
    options.apply(result);
  }
  return result;
}

export function reconciliationStateHash(result) {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(result)))
    .digest('hex');
}
