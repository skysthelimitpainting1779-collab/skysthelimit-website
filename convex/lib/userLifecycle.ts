export type ClerkLifecycleType = 'user.created' | 'user.updated' | 'user.deleted';

export type UserLifecycleState = {
  status: 'active' | 'disabled';
  lastLifecycleOccurredAt?: number;
};

export type UserLifecycleDecision = {
  apply: boolean;
  status: 'active' | 'disabled';
  updateLifecycleCursor: boolean;
  reason: 'new-user' | 'newer-event' | 'deletion-wins' | 'stale-event' | 'disabled-user';
};

/**
 * Deletions and local disables are sticky. A later non-delete Clerk event is
 * profile synchronization, not an explicit access-restoration authorization.
 */
export function decideUserLifecycleTransition(
  current: UserLifecycleState | null,
  incoming: { type: ClerkLifecycleType; providerOccurredAt: number },
): UserLifecycleDecision {
  if (incoming.type === 'user.deleted') {
    return {
      apply: true,
      status: 'disabled',
      updateLifecycleCursor:
        current?.lastLifecycleOccurredAt === undefined
        || incoming.providerOccurredAt >= current.lastLifecycleOccurredAt,
      reason: 'deletion-wins',
    };
  }

  if (!current) {
    return {
      apply: true,
      status: 'active',
      updateLifecycleCursor: true,
      reason: 'new-user',
    };
  }

  if (current.status === 'disabled') {
    return {
      apply: false,
      status: 'disabled',
      updateLifecycleCursor: false,
      reason: 'disabled-user',
    };
  }

  if (
    current.lastLifecycleOccurredAt !== undefined
    && incoming.providerOccurredAt <= current.lastLifecycleOccurredAt
  ) {
    return {
      apply: false,
      status: 'active',
      updateLifecycleCursor: false,
      reason: 'stale-event',
    };
  }

  return {
    apply: true,
    status: 'active',
    updateLifecycleCursor: true,
    reason: 'newer-event',
  };
}
