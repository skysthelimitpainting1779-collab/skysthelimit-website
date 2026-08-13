import { parseClientEnv, type ClientEnv } from './client-schema';

export { ClientEnvSchema, parseClientEnv, type ClientEnv } from './client-schema';

export function getClientEnv(): ClientEnv {
  return parseClientEnv({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_CONVEX_ENV: process.env.NEXT_PUBLIC_CONVEX_ENV,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  });
}
