import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { gatePortalAccess, isProtectedPortalPath, portalLoginUrl } from './lib/auth/portal';
import { APEX_HOST, CANONICAL_HOST } from './lib/site';

/**
 * Next.js proxy (session refresh + portal/admin route protection).
 * Public marketing pages are NOT matched — see config.matcher below.
 * Payload admin routes (/admin/[[...segments]]) are excluded; Payload handles its own auth.
 */
export async function proxy(request: NextRequest) {
  // Consolidate the apex and HTTP variants before Google can index duplicates.
  // Preview deployments and localhost remain usable for review and development.
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = (forwardedHost || request.headers.get('host') || '').split(':')[0].toLowerCase();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (host === APEX_HOST || (host === CANONICAL_HOST && forwardedProto === 'http')) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // Always refresh session cookies when this proxy runs
  let response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  if (!isProtectedPortalPath(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase, portal cannot authenticate — deny protected surfaces.
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = request.nextUrl.clone();
    url.pathname = '/portal/login';
    url.searchParams.set('next', pathname);
    url.searchParams.set('error', 'auth_not_configured');
    return NextResponse.redirect(url);
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
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run canonical-host consolidation for public pages while skipping static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|map|xml|txt|mp4)$).*)',
  ],
};
