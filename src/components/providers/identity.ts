/**
 * Durable application identity is keyed by the Clerk subject. Resource
 * authorization is intentionally absent: trusted Convex functions own it.
 * An email can be stored for display or notification, but never as ownership.
 */
export type AppIdentity = {
  provider: 'clerk';
  subject: string;
  status: 'active' | 'disabled';
};

type IdentityMapping =
  | { allowed: true; identity: AppIdentity }
  | { allowed: false; reason: 'anonymous' | 'invalid_subject' };

export type VerifiedClerkLifecycleEvent = {
  /** Must be set only after the Clerk webhook signature has been verified. */
  verified: boolean;
  type: 'user.created' | 'user.updated' | 'user.deleted';
  userId: string | null | undefined;
  disabled?: boolean;
};

type LifecycleDecision =
  | { allowed: true; operation: 'upsert' | 'disable'; identity: AppIdentity }
  | { allowed: false; reason: 'unverified_event' | 'invalid_subject' };

function cleanSubject(subject: string | null | undefined): string | null {
  const normalized = typeof subject === 'string' ? subject.trim() : '';
  return normalized.length > 0 ? normalized : null;
}

export function mapClerkIdentity(input: { userId?: string | null } | null | undefined): IdentityMapping {
  if (!input) return { allowed: false, reason: 'anonymous' };

  const subject = cleanSubject(input.userId);
  if (!subject) return { allowed: false, reason: 'invalid_subject' };

  return {
    allowed: true,
    identity: { provider: 'clerk', subject, status: 'active' },
  };
}

/**
 * Converts an already signature-verified Clerk lifecycle event to an idempotent
 * persistence instruction. The eventual Convex webhook action owns signature
 * verification and persistence; this function must not be called with raw HTTP
 * payloads.
 */
export function mapVerifiedClerkLifecycleEvent(event: VerifiedClerkLifecycleEvent): LifecycleDecision {
  if (!event.verified) return { allowed: false, reason: 'unverified_event' };

  const subject = cleanSubject(event.userId);
  if (!subject) return { allowed: false, reason: 'invalid_subject' };

  const disabled = event.type === 'user.deleted' || event.disabled === true;
  return {
    allowed: true,
    operation: disabled ? 'disable' : 'upsert',
    identity: { provider: 'clerk', subject, status: disabled ? 'disabled' : 'active' },
  };
}
