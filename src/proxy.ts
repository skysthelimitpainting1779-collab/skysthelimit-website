import { clerkMiddleware } from '@clerk/nextjs/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

import { buildClerkAuthorizedParties } from '@/lib/auth/clerk-authorized-parties';

const handleClerkRequest = clerkMiddleware({
  authorizedParties: buildClerkAuthorizedParties(),
});

/** Clerk establishes request identity; Convex functions authorize resources. */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  return handleClerkRequest(request, event);
}

export const config = {
  matcher: [
    '/portal',
    '/portal/:path*',
    '/manage/:path*',
  ],
};
