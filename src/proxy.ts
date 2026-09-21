import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { gatePortalAccess, isProtectedPortalPath, portalLoginUrl } from './lib/auth/portal';
import { previewRobotsTag } from './lib/preview-noindex';

/**
 * Next.js proxy (session refresh + portal/admin route protection).
 * Also applies the preview-only X-Robots-Tag header on every response
 * (issue #162) — see config.matcher below.
 * Payload admin routes (/admin/[[...segments]]) intentionally stay matched:
 * the admin login surface is a public HTML document with no robots
 * metadata of its own, so the deployment-wide preview noindex policy must
 * cover it (issue #162); admin routes get the same cheap pass-through
 * header as other non-session routes.
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
  // Page and document traffic: public pages need the preview noindex
  // header (#162). Negative lookahead (per the Next.js Proxy guide) keeps
  // the proxy off non-page traffic — API routes, _next static/image paths,
  // metadata files, and bulky media/static assets — so multi-megabyte
  // video/image range requests skip the proxy entirely. Extension
  // exclusions are intentionally narrow: indexable documents such as .pdf,
  // .txt, and .md stay under the matcher so preview deployments tag them
  // too (a PDF has no HTML robots-meta fallback). /admin stays matched on
  // purpose: the Payload admin login surface is a public HTML document
  // with no robots metadata of its own, and the deployment-wide preview
  // policy must cover it; non-session routes get a cheap pass-through
  // with the header (no session work).
  // Session work still runs only on portal/auth routes (see isSessionRoute).
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:mp4|webm|mov|avi|mkv|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|css|js|map)$).*)',
  ],
};
