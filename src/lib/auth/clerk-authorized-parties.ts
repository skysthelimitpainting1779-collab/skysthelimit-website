function normalizeOrigin(value: string): string {
  const raw = value.trim();
  const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error(`Clerk authorized party must use HTTPS: ${raw}`);
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`Clerk authorized party must be an origin: ${raw}`);
  }
  if (url.port && !local) {
    throw new Error(`Clerk authorized party must not use a remote custom port: ${raw}`);
  }

  return url.origin;
}

export function buildClerkAuthorizedParties(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const candidates = env.VERCEL === '1'
    ? [
        env.SITE_URL,
        env.VERCEL_URL,
        env.VERCEL_BRANCH_URL,
        env.VERCEL_PROJECT_PRODUCTION_URL,
      ]
    : [
        env.NEXT_PUBLIC_SITE_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        env.SITE_URL,
      ];

  const origins = [...new Set(
    candidates
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeOrigin),
  )];
  if (origins.length === 0) {
    throw new Error('Clerk authorized parties are not configured.');
  }
  return origins;
}
