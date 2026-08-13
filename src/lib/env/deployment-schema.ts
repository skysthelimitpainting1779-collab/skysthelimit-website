import { z } from 'zod';

const AppEnvironmentSchema = z.enum(['development', 'preview', 'production']);
const ClerkTestSecretSchema = z
  .string()
  .trim()
  .regex(/^sk_test_[A-Za-z0-9+/=_-]{16,}$/);
const ClerkWebhookSecretSchema = z
  .string()
  .trim()
  .regex(/^whsec_[A-Za-z0-9+/=_-]{24,}$/);

/**
 * Pure deployment/CI parser for the high-privilege Convex deployment key.
 * Request-time application code must not import this boundary.
 */
export const DeploymentEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: AppEnvironmentSchema,
  CONVEX_DEPLOY_KEY: z.string().trim().min(1),
}).strict().superRefine((env, context) => {
  const convexPrefix = {
    development: 'dev:',
    preview: 'preview:',
    production: 'prod:',
  }[env.NEXT_PUBLIC_APP_ENV];

  if (!env.CONVEX_DEPLOY_KEY.startsWith(convexPrefix)) {
    context.addIssue({
      code: 'custom',
      path: ['CONVEX_DEPLOY_KEY'],
      message: `${env.NEXT_PUBLIC_APP_ENV} requires a Convex deployment key starting with ${convexPrefix}.`,
    });
  }
  if (
    env.NEXT_PUBLIC_APP_ENV === 'production' &&
    !/^prod:[a-z][a-z0-9-]{2,127}\|.+$/.test(env.CONVEX_DEPLOY_KEY)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['CONVEX_DEPLOY_KEY'],
      message: 'Production requires a deployment-bound Convex key.',
    });
  }
});

function isHttpsOrigin(
  value: string,
  hostnameSuffix: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      url.hostname.endsWith(hostnameSuffix)
    );
  } catch {
    return false;
  }
}

export const ConvexPreviewDefaultsSchema = z
  .object({
    NEXT_PUBLIC_APP_ENV: z.literal('preview'),
    CLERK_JWT_ISSUER_ENV: z.literal('preview'),
    CLERK_JWT_ISSUER_DOMAIN: z.string().trim().min(1),
    CLERK_SECRET_KEY: ClerkTestSecretSchema,
  })
  .strict()
  .superRefine((env, context) => {
    if (!isHttpsOrigin(env.CLERK_JWT_ISSUER_DOMAIN, '.clerk.accounts.dev')) {
      context.addIssue({
        code: 'custom',
        path: ['CLERK_JWT_ISSUER_DOMAIN'],
        message: 'Preview requires a Clerk development HTTPS origin.',
      });
    }
  });

export const ProductionWebhookDeploymentEnvSchema = z
  .object({
    NEXT_PUBLIC_APP_ENV: z.literal('production'),
    CLERK_WEBHOOK_SIGNING_SECRET: ClerkWebhookSecretSchema,
  })
  .strict();

const ConvexDeploymentNameSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9-]{2,127}$/);

export const ConvexPreviewProviderDeploymentSchema = z
  .object({
    id: z.number().int().nonnegative(),
    kind: z.literal('cloud'),
    name: ConvexDeploymentNameSchema,
    deploymentType: z.literal('preview'),
    projectId: z.number().int().nonnegative(),
    previewIdentifier: z.string().trim().min(1),
    deploymentUrl: z.string().trim().min(1),
  })
  .passthrough()
  .superRefine((deployment, context) => {
    if (!isHttpsOrigin(deployment.deploymentUrl, '.convex.cloud')) {
      context.addIssue({
        code: 'custom',
        path: ['deploymentUrl'],
        message: 'Provider deployment URL must be a Convex cloud origin.',
      });
    }
  });

export const ConvexPreviewWebhookProvisioningSchema = z
  .object({
    NEXT_PUBLIC_APP_ENV: z.literal('preview'),
    CONVEX_DEPLOYMENT_TYPE: z.literal('preview'),
    CONVEX_DEPLOYMENT: ConvexDeploymentNameSchema,
    CONVEX_SITE_URL: z.string().trim().min(1),
    CLERK_WEBHOOK_ENDPOINT_URL: z.string().trim().min(1),
    CLERK_WEBHOOK_SIGNING_SECRET: ClerkWebhookSecretSchema,
  })
  .strict()
  .superRefine((env, context) => {
    if (!isHttpsOrigin(env.CONVEX_SITE_URL, '.convex.site')) {
      context.addIssue({
        code: 'custom',
        path: ['CONVEX_SITE_URL'],
        message: 'Preview provisioning requires an exact Convex site origin.',
      });
      return;
    }
    const siteUrl = new URL(env.CONVEX_SITE_URL);
    if (siteUrl.hostname !== `${env.CONVEX_DEPLOYMENT}.convex.site`) {
      context.addIssue({
        code: 'custom',
        path: ['CONVEX_SITE_URL'],
        message: 'The Convex site must belong to the exact deployment.',
      });
    }
    if (
      env.CLERK_WEBHOOK_ENDPOINT_URL !==
      `${env.CONVEX_SITE_URL}/clerk/lifecycle`
    ) {
      context.addIssue({
        code: 'custom',
        path: ['CLERK_WEBHOOK_ENDPOINT_URL'],
        message: 'The Clerk endpoint must target the exact Convex lifecycle route.',
      });
    }
  });

export type ConvexPreviewDefaults = z.infer<typeof ConvexPreviewDefaultsSchema>;
export type ConvexPreviewProviderDeployment = z.infer<
  typeof ConvexPreviewProviderDeploymentSchema
>;
export type ConvexPreviewWebhookProvisioning = z.infer<
  typeof ConvexPreviewWebhookProvisioningSchema
>;
export type ProductionWebhookDeploymentEnv = z.infer<
  typeof ProductionWebhookDeploymentEnvSchema
>;
export type DeploymentEnv = z.infer<typeof DeploymentEnvSchema>;

export function parseConvexPreviewDefaults(
  input: unknown,
): ConvexPreviewDefaults {
  return ConvexPreviewDefaultsSchema.parse(input);
}

export function parseConvexPreviewWebhookProvisioning(
  input: unknown,
): ConvexPreviewWebhookProvisioning {
  return ConvexPreviewWebhookProvisioningSchema.parse(input);
}

export function parseConvexPreviewProviderDeployment(
  input: unknown,
): ConvexPreviewProviderDeployment {
  return ConvexPreviewProviderDeploymentSchema.parse(input);
}

export function parseProductionWebhookDeploymentEnv(
  input: unknown,
): ProductionWebhookDeploymentEnv {
  return ProductionWebhookDeploymentEnvSchema.parse(input);
}

export function parseDeploymentEnv(input: unknown): DeploymentEnv {
  return DeploymentEnvSchema.parse(input);
}
