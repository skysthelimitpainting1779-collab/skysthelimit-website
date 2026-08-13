/**
 * Portal auth gate + client resource mapping (pure helpers + server loaders).
 * Session stack: Supabase Auth (OAuth / password). CMS stays Directus-separated.
 */

export type PortalUser = {
  id: string;
  email: string;
};

export type StaffRole = 'staff' | 'admin' | 'owner';

export type StaffGateResult =
  | { authorized: true; role: StaffRole }
  | { authorized: false; reason: 'no_session' | 'disabled' | 'role_denied' };

export function gateStaffAccess(
  user:
    | { id?: string | null; email?: string | null; role?: string | null; disabled?: boolean }
    | null
    | undefined,
): StaffGateResult {
  if (!user?.id) return { authorized: false, reason: 'no_session' };
  if (user.disabled) return { authorized: false, reason: 'disabled' };
  if (!['staff', 'admin', 'owner'].includes(user.role || '')) {
    return { authorized: false, reason: 'role_denied' };
  }
  return { authorized: true, role: user.role as StaffRole };
}

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
  const p = pathname.split('?')[0] || '';
  if (!p.startsWith('/portal')) return false;
  if (p === '/portal/login' || p.startsWith('/portal/login/')) return false;
  return true;
}

export function isProtectedStaffPath(pathname: string): boolean {
  const path = pathname.split('?')[0] || '';
  return path === '/manage' || path.startsWith('/manage/');
}

export function portalLoginUrl(nextPath?: string): string {
  if (!nextPath || (!nextPath.startsWith('/portal') && !nextPath.startsWith('/manage'))) {
    return DEFAULT_LOGIN;
  }
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
  const next = nextPath.startsWith('/portal') ? nextPath : '/portal';
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
