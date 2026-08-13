export type InvitationRole = 'customer' | 'staff' | 'admin';

export function requiredInvitationActorRoles(
  invitedRole: InvitationRole,
): readonly ('staff' | 'admin')[] {
  return invitedRole === 'customer' ? ['staff', 'admin'] : ['admin'];
}

export function resolveTrustedInvitationRedirect(
  requestedRedirect: string | undefined,
  configuredOrigins: readonly string[],
): string | undefined {
  if (requestedRedirect === undefined) return undefined;
  const allowedOrigins = configuredOrigins
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Invitation redirect origins must use HTTP or HTTPS.');
      }
      return parsed.origin;
    });
  if (allowedOrigins.length === 0) {
    throw new Error('Invitation redirects require an approved origin.');
  }

  const raw = requestedRedirect.trim();
  if (!raw) throw new Error('Invitation redirect URL cannot be empty.');
  const candidate = raw.startsWith('/') && !raw.startsWith('//')
    ? new URL(raw, allowedOrigins[0])
    : new URL(raw);
  if (
    (candidate.protocol !== 'https:' && candidate.protocol !== 'http:')
    || candidate.username
    || candidate.password
    || !allowedOrigins.includes(candidate.origin)
  ) {
    throw new Error('Invitation redirect URL is not an approved application origin.');
  }
  return candidate.toString();
}
