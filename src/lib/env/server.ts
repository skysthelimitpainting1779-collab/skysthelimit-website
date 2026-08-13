import 'server-only';

import {
  parseRuntimeServerEnv,
  type RuntimeServerEnv,
} from './server-schema';

/** Server-only entry point for request-time Clerk identity credentials. */
export function getRuntimeServerEnv(): RuntimeServerEnv {
  return parseRuntimeServerEnv({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  });
}

export {
  type RuntimeServerEnv,
  RuntimeServerEnvSchema,
  parseRuntimeServerEnv,
} from './server-schema';
