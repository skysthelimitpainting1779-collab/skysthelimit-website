import { z } from 'zod';

/**
 * Pure public-environment parser. It has no runtime environment access so it
 * can be tested independently from Next.js client substitution.
 */
export const ClientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'preview', 'production']),
  NEXT_PUBLIC_CONVEX_ENV: z.enum(['development', 'preview', 'production']),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_CONVEX_URL: z.string().trim().url(),
}).strict().superRefine((env, context) => {
  if (env.NEXT_PUBLIC_CONVEX_ENV !== env.NEXT_PUBLIC_APP_ENV) {
    context.addIssue({
      code: 'custom',
      path: ['NEXT_PUBLIC_CONVEX_ENV'],
      message: 'NEXT_PUBLIC_CONVEX_ENV must match NEXT_PUBLIC_APP_ENV.',
    });
  }

  const requiredPrefix = env.NEXT_PUBLIC_APP_ENV === 'production' ? 'pk_live_' : 'pk_test_';
  if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith(requiredPrefix)) {
    context.addIssue({
      code: 'custom',
      path: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
      message: `${env.NEXT_PUBLIC_APP_ENV} requires a Clerk key starting with ${requiredPrefix}.`,
    });
  }
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;

export function parseClientEnv(input: unknown): ClientEnv {
  return ClientEnvSchema.parse(input);
}
