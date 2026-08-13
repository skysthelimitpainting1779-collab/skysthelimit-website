import { z } from 'zod';

const AppEnvironmentSchema = z.enum(['development', 'preview', 'production']);

/**
 * Pure request-time identity parser. Its tier comes from the same public label
 * the browser receives, preventing a separate server-only label from drifting.
 *
 * Deployment credentials intentionally do not belong to this runtime boundary.
 */
export const RuntimeServerEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: AppEnvironmentSchema,
  CLERK_SECRET_KEY: z.string().trim().min(1),
}).strict().superRefine((env, context) => {
  const clerkPrefix = env.NEXT_PUBLIC_APP_ENV === 'production' ? 'sk_live_' : 'sk_test_';
  if (!env.CLERK_SECRET_KEY.startsWith(clerkPrefix)) {
    context.addIssue({
      code: 'custom',
      path: ['CLERK_SECRET_KEY'],
      message: `${env.NEXT_PUBLIC_APP_ENV} requires a Clerk key starting with ${clerkPrefix}.`,
    });
  }

});

export type RuntimeServerEnv = z.infer<typeof RuntimeServerEnvSchema>;

export function parseRuntimeServerEnv(input: unknown): RuntimeServerEnv {
  return RuntimeServerEnvSchema.parse(input);
}
