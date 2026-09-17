import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { gatePortalAccess, isProtectedPortalPath, portalLoginUrl } from './lib/auth/portal';
import { previewRobotsTag } from './lib/preview-noindex';

/**
 * Next.js proxy (session refresh + portal/admin route protection).
 * Also applies the preview-only X-Robots-Tag header on every response
 * (issue #162) — see config.matcher below.
 * Payload admin routes (/admin/[[...segments]]) are excluded; Payload handles its own auth.
 */

// Routes that need Supabase session work: everything the proxy matched
// before #162 (portal surfaces + the auth callback). Public marketing pages
// skip session work and get a plain pass-through with the robots header.
function isSessionRoute(pathname: string): boolean {
  return pathname === '/auth/callback' || pathname === '/portal' || pathname.startsWith('/portal/');
}

/** Applies `X-Robots-Tag: noindex, nofollow` on preview deployments only. */
function withPreviewRobotsTag(response: NextResponse): NextResponse {
  const tag = previewRobotsTag(process.env.VERCEL_ENV);
  if (tag) {
    response.headers.set('X-Robots-Tag', tag);
  }
  return response;
}
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public marketing pages: no session work — plain pass-through so the
  // preview noindex header applies to every response (issue #162).
  if (!isSessionRoute(pathname)) {
    return withPreviewRobotsTag(NextResponse.next());
  }

  // Always refresh session cookies when this proxy runs
  let response = await updateSession(request);

  if (!isProtectedPortalPath(pathname)) {
    return withPreviewRobotsTag(response);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase, portal cannot authenticate — deny protected surfaces.
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = request.nextUrl.clone();
    url.pathname = '/portal/login';
    url.searchParams.set('next', pathname);
    url.searchParams.set('error', 'auth_not_configured');
    return withPreviewRobotsTag(NextResponse.redirect(url));
  }

  // Re-read user with the same cookie bridge as updateSession
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user
      ? { id: data.user.id, email: data.user.email }
      : null;
  } catch {
    user = null;
  }

  const gate = gatePortalAccess(user);
  if (!gate.authenticated) {
    const url = request.nextUrl.clone();
    const login = portalLoginUrl(pathname);
    const [pathOnly, qs] = login.split('?');
    url.pathname = pathOnly || '/portal/login';
    url.search = qs ? `?${qs}` : '';
    return withPreviewRobotsTag(NextResponse.redirect(url));
  }

  return withPreviewRobotsTag(response);
}

export const config = {
  // Every route: public pages need the preview noindex header (#162).
  // Session work still runs only on portal/auth routes (see isSessionRoute).
  matcher: '/:path*',
};
