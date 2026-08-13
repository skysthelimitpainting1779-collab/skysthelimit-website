import { defineApp } from 'convex/server';
import { v } from 'convex/values';

const appEnvironment = v.union(
  v.literal('development'),
  v.literal('preview'),
  v.literal('production'),
);

const app = defineApp({
  env: {
    NEXT_PUBLIC_APP_ENV: appEnvironment,
    CLERK_JWT_ISSUER_ENV: appEnvironment,
    CLERK_JWT_ISSUER_DOMAIN: v.string(),
    CLERK_WEBHOOK_SIGNING_SECRET: v.optional(v.string()),
    CLERK_SECRET_KEY: v.string(),
  },
});

export default app;
