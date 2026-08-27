/**
 * Portal auth gate + client resource mapping (pure helpers + server loaders).
 * Session stack: Supabase Auth (OAuth / password). CMS stays Directus-separated.
 */

export type PortalUser = {
  id: string;
  email: string;
};

export type AuthGateResult =
  | { authenticated: true; user: PortalUser }
  | { authenticated: false; reason: 'no_session' | 'no_email'; loginPath: string };

export type PortalLead = {
  lead_id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  market: string | null;
  project_type: string | null;
  city: string | null;
  timeline: string | null;
  budget: string | null;
  created_at?: string | null;
  notes?: string | null;
};

const DEFAULT_LOGIN = '/portal/login';

/** Whether a path belongs to the /portal segment rather than a lookalike prefix. */
function isPortalPath(path: string): boolean {
  return (
    path === '/portal' ||
    path.startsWith('/portal/') ||
    path.startsWith('/portal?') ||
    path.startsWith('/portal#')
  );
}

/**
 * Pure gate: decides if a session may access /portal (excluding login itself).
 * Production middleware and unit tests both call this — no “always true” bypass.
 */
export function gatePortalAccess(
  sessionUser: { id?: string | null; email?: string | null } | null | undefined,
  options?: { loginPath?: string }
): AuthGateResult {
  const loginPath = options?.loginPath || DEFAULT_LOGIN;
  if (!sessionUser?.id) {
    return { authenticated: false, reason: 'no_session', loginPath };
  }
  const email = String(sessionUser.email || '')
    .trim()
    .toLowerCase();
  if (!email) {
    return { authenticated: false, reason: 'no_email', loginPath };
  }
  return {
    authenticated: true,
    user: { id: String(sessionUser.id), email },
  };
}

/** Whether a pathname is a protected portal surface (not the login page). */
export function isProtectedPortalPath(pathname: string): boolean {
  const p = pathname.split(/[?#]/)[0] || '';
  if (!isPortalPath(p)) return false;
  if (p === '/portal/login' || p.startsWith('/portal/login/')) return false;
  return true;
}

export function portalLoginUrl(nextPath?: string): string {
  if (!nextPath || !isPortalPath(nextPath)) return DEFAULT_LOGIN;
  return `${DEFAULT_LOGIN}?next=${encodeURIComponent(nextPath)}`;
}

/** Map raw lead rows to portal-safe DTOs (no secrets, service keys, etc.). */
export function mapLeadsForPortal(
  rows: Array<Record<string, unknown>> | null | undefined,
  email: string
): PortalLead[] {
  const want = email.trim().toLowerCase();
  if (!want || !Array.isArray(rows)) return [];
  return rows
    .filter((r) => String(r.email || '').trim().toLowerCase() === want)
    .map((r) => ({
      lead_id: String(r.lead_id || r.id || ''),
      name: r.name != null ? String(r.name) : null,
      email: r.email != null ? String(r.email) : null,
      status: r.status != null ? String(r.status) : 'unknown',
      market: r.market != null ? String(r.market) : null,
      project_type: r.project_type != null ? String(r.project_type) : null,
      city: r.city != null ? String(r.city) : null,
      timeline: r.timeline != null ? String(r.timeline) : null,
      budget: r.budget != null ? String(r.budget) : null,
      created_at: r.created_at != null ? String(r.created_at) : null,
      notes: r.notes != null ? String(r.notes) : null,
    }))
    .filter((r) => r.lead_id.length > 0);
}

export type OAuthProvider = 'google' | 'github';

/** Build Supabase OAuth options for portal sign-in (redirect must hit /auth/callback). */
export function buildPortalOAuthOptions(
  origin: string,
  provider: OAuthProvider,
  nextPath = '/portal'
): { provider: OAuthProvider; options: { redirectTo: string; queryParams?: Record<string, string> } } {
  const next = isPortalPath(nextPath) ? nextPath : '/portal';
  const redirectTo = `${origin.replace(/\/$/, '')}/auth/callback?next=${encodeURIComponent(next)}`;
  return {
    provider,
    options: {
      redirectTo,
      queryParams:
        provider === 'google'
          ? { access_type: 'offline', prompt: 'consent' }
          : undefined,
    },
  };
}
