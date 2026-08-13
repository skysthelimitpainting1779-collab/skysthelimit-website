import type { AuthConfig } from 'convex/server';

import { parseConvexClerkAuthEnv } from './clerkAuth';

const clerkAuthEnv = parseConvexClerkAuthEnv({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  CLERK_JWT_ISSUER_ENV: process.env.CLERK_JWT_ISSUER_ENV,
  CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
});

export default {
  providers: [
    {
      domain: clerkAuthEnv.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig;
