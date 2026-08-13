import { parseConvexPreviewDefaults } from '../src/lib/env/deployment-schema.ts';

try {
  parseConvexPreviewDefaults({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    CLERK_JWT_ISSUER_ENV: process.env.CLERK_JWT_ISSUER_ENV,
    CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  });
  process.stdout.write('Convex Preview project defaults validated.\n');
} catch {
  process.stderr.write('Invalid Convex Preview project defaults.\n');
  process.exitCode = 1;
}
