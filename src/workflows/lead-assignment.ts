export type LeadRoutingCandidate = {
  userId: string;
  role: 'customer' | 'staff' | 'admin';
  membershipStatus: 'active' | 'disabled' | 'revoked';
  userStatus: 'active' | 'disabled';
};

export type LeadAssignmentSla = {
  status: 'assigned' | 'acknowledged' | 'closed';
  firstResponseDueAt: number;
  firstResponseAt?: number;
  escalationStatus: 'none' | 'escalated' | 'resolved';
};

export type LeadSlaProjection = {
  status: 'pending' | 'breached' | 'escalated' | 'met' | 'closed';
  breached: boolean;
  shouldEscalate: boolean;
  operatorLabel: string;
};

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function selectDeterministicAssignee(
  leadIdentity: string,
  candidates: readonly LeadRoutingCandidate[]
) {
  const normalizedLeadIdentity = leadIdentity.trim();
  if (!normalizedLeadIdentity) {
    throw new Error('A stable lead identity is required for routing.');
  }

  const eligibleByUserId = new Map<string, LeadRoutingCandidate>();
  for (const candidate of candidates) {
    const userId = candidate.userId.trim();
    if (
      !userId ||
      candidate.userStatus !== 'active' ||
      candidate.membershipStatus !== 'active' ||
      (candidate.role !== 'staff' && candidate.role !== 'admin')
    ) {
      continue;
    }
    const existing = eligibleByUserId.get(userId);
    if (!existing || candidate.role === 'admin') {
      eligibleByUserId.set(userId, { ...candidate, userId });
    }
  }

  const eligible = [...eligibleByUserId.values()].sort((left, right) =>
    left.userId < right.userId ? -1 : left.userId > right.userId ? 1 : 0
  );
  if (eligible.length === 0) {
    throw new Error('No eligible staff or admin candidate is available.');
  }

  const selected = eligible[stableHash(normalizedLeadIdentity) % eligible.length];
  return {
    assigneeUserId: selected.userId,
    algorithmVersion: 'stable-hash-v1' as const,
    reason: `Deterministic stable-hash routing across ${eligible.length} eligible operator${eligible.length === 1 ? '' : 's'}.`,
  };
}

export function calculateFirstResponseDueAt(
  assignedAt: number,
  firstResponseSlaMinutes: number
) {
  if (!Number.isFinite(assignedAt)) {
    throw new Error('Assignment time must be finite.');
  }
  if (
    !Number.isInteger(firstResponseSlaMinutes) ||
    firstResponseSlaMinutes < 5 ||
    firstResponseSlaMinutes > 7 * 24 * 60
  ) {
    throw new Error('First-response SLA must be between 5 and 10080 minutes.');
  }
  return assignedAt + firstResponseSlaMinutes * 60_000;
}

export function evaluateLeadSla(
  assignment: LeadAssignmentSla,
  observedAt: number
): LeadSlaProjection {
  if (!Number.isFinite(observedAt)) {
    throw new Error('SLA observation time must be finite.');
  }
  if (
    assignment.status === 'acknowledged' ||
    assignment.firstResponseAt !== undefined
  ) {
    if (
      assignment.firstResponseAt !== undefined &&
      assignment.firstResponseAt >= assignment.firstResponseDueAt
    ) {
      return {
        status: 'breached',
        breached: true,
        shouldEscalate: false,
        operatorLabel: 'First response completed after SLA breach',
      };
    }
    return {
      status: 'met',
      breached: false,
      shouldEscalate: false,
      operatorLabel: 'First response completed within SLA',
    };
  }
  if (assignment.status === 'closed') {
    return {
      status: 'closed',
      breached: false,
      shouldEscalate: false,
      operatorLabel: 'Lead closed',
    };
  }
  if (assignment.escalationStatus === 'escalated') {
    return {
      status: 'escalated',
      breached: true,
      shouldEscalate: false,
      operatorLabel: 'SLA breached — immediate follow-up required',
    };
  }
  if (observedAt >= assignment.firstResponseDueAt) {
    return {
      status: 'breached',
      breached: true,
      shouldEscalate: true,
      operatorLabel: 'SLA breached — immediate follow-up required',
    };
  }
  return {
    status: 'pending',
    breached: false,
    shouldEscalate: false,
    operatorLabel: 'First response due soon',
  };
}
