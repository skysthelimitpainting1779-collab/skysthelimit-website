import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

import { buildClerkAuthorizedParties } from '@/lib/auth/clerk-authorized-parties';

function isRetiredManagePath(pathname: string) {
  return pathname === '/manage' || pathname.startsWith('/manage/');
}

const handleClerkRequest = clerkMiddleware({
  authorizedParties: buildClerkAuthorizedParties(),
});

/** Clerk establishes request identity; Convex functions authorize resources. */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (isRetiredManagePath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/contact', request.url), 308);
  }

  return handleClerkRequest(request, event);
}

export const config = {
  matcher: [
    '/portal',
    '/portal/:path*',
    '/manage',
    '/manage/:path*',
  ],
};
