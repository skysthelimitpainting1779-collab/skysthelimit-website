type AppEnvironment = 'development' | 'preview' | 'production';

export type ConvexClerkAuthEnv = {
  NEXT_PUBLIC_APP_ENV: AppEnvironment;
  CLERK_JWT_ISSUER_ENV: AppEnvironment;
  CLERK_JWT_ISSUER_DOMAIN: string;
};

function parseAppEnvironment(value: unknown, field: string): AppEnvironment {
  if (value === 'development' || value === 'preview' || value === 'production') return value;
  throw new Error(`${field} must be development, preview, or production.`);
}

function isClerkDevelopmentHost(hostname: string): boolean {
  return hostname.endsWith('.clerk.accounts.dev') || hostname.endsWith('.lcl.dev');
}

/**
 * Pure Convex-safe validation for Clerk's issuer configuration. The issuer
 * deployment tier must use the canonical app label shared with the Next app.
 */
export function parseConvexClerkAuthEnv(input: unknown): Omit<ConvexClerkAuthEnv, 'CLERK_JWT_ISSUER_ENV'> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Clerk issuer configuration is required.');
  }

  const values = input as Record<string, unknown>;
  const appEnvironment = parseAppEnvironment(values.NEXT_PUBLIC_APP_ENV, 'NEXT_PUBLIC_APP_ENV');
  const issuerEnvironment = parseAppEnvironment(values.CLERK_JWT_ISSUER_ENV, 'CLERK_JWT_ISSUER_ENV');
  if (issuerEnvironment !== appEnvironment) {
    throw new Error('CLERK_JWT_ISSUER_ENV must match NEXT_PUBLIC_APP_ENV.');
  }
  if (typeof values.CLERK_JWT_ISSUER_DOMAIN !== 'string' || !values.CLERK_JWT_ISSUER_DOMAIN.trim()) {
    throw new Error('CLERK_JWT_ISSUER_DOMAIN is required.');
  }

  let issuer: URL;
  try {
    issuer = new URL(values.CLERK_JWT_ISSUER_DOMAIN.trim());
  } catch {
    throw new Error('CLERK_JWT_ISSUER_DOMAIN must be an HTTPS URL.');
  }
  if (
    issuer.protocol !== 'https:'
    || issuer.username
    || issuer.password
    || issuer.port
    || issuer.pathname !== '/'
    || issuer.search
    || issuer.hash
    || !issuer.hostname
  ) {
    throw new Error('CLERK_JWT_ISSUER_DOMAIN must be an HTTPS origin without a path, port, or query.');
  }
  if (issuer.hostname === 'localhost' || issuer.hostname.endsWith('.local')) {
    throw new Error('CLERK_JWT_ISSUER_DOMAIN must not use a local host.');
  }
  const developmentHost = isClerkDevelopmentHost(issuer.hostname);
  if (appEnvironment === 'production' && developmentHost) {
    throw new Error('Production cannot use a Clerk development issuer.');
  }
  if (appEnvironment !== 'production' && !developmentHost) {
    throw new Error('Development and preview require a recognized Clerk development issuer.');
  }

  return {
    NEXT_PUBLIC_APP_ENV: appEnvironment,
    CLERK_JWT_ISSUER_DOMAIN: issuer.origin,
  };
}
