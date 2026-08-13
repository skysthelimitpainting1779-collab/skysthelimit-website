import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateProtectedIdentityConfiguration } from '../src/app/(protected)/identity-configuration.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('marketing routes keep their public URLs behind the conversion shell', () => {
  const marketingLayout = read('src/app/(marketing)/layout.tsx');

  for (const route of [
    'page.tsx',
    'residential/page.tsx',
    'commercial/page.tsx',
    'public-sector/page.tsx',
    'projects/page.tsx',
    'painting-services/[slug]/page.tsx',
    'service-areas/[slug]/page.tsx',
  ]) {
    assert.ok(exists(`src/app/(marketing)/${route}`), `marketing route is missing: /${route}`);
  }

  assert.match(marketingLayout, /ConversionHeader/);
  assert.match(marketingLayout, /ConversionFooterCta/);
  assert.match(marketingLayout, /mobile_sticky/);
});

test('protected portal and manage routes exclude marketing chrome and fail closed around identity providers', () => {
  const rootLayout = read('src/app/layout.tsx');
  const protectedLayout = read('src/app/(protected)/layout.tsx');
  const protectedConfiguration = read('src/app/(protected)/identity-configuration.ts');
  const identityProviders = read('src/components/providers/ConvexProviderWithClerk.tsx');
  const clientEnv = read('src/lib/env/client.ts');
  const clientSchema = read('src/lib/env/client-schema.ts');
  const runtimeServerEnv = read('src/lib/env/server.ts');
  const runtimeServerSchema = read('src/lib/env/server-schema.ts');
  const marketingLayout = read('src/app/(marketing)/layout.tsx');

  assert.ok(exists('src/app/(protected)/portal/page.tsx'));
  assert.ok(exists('src/app/(protected)/portal/login/page.tsx'));
  assert.ok(exists('src/app/(protected)/manage/page.tsx'));
  assert.doesNotMatch(rootLayout, /ConversionHeader|ConversionFooterCta|mobile_sticky/);
  assert.doesNotMatch(protectedLayout, /ConversionHeader|ConversionFooterCta|mobile_sticky/);
  assert.doesNotMatch(marketingLayout, /IdentityProviders|ConvexProviderWithClerk|@clerk\/nextjs/);
  assert.match(protectedLayout, /IdentityProviders/);
  assert.match(protectedLayout, /import 'server-only'/);
  assert.match(protectedLayout, /getRuntimeServerEnv/);
  assert.match(protectedLayout, /getClientEnv/);
  assert.match(protectedLayout, /await connection\(\)/);
  assert.match(protectedLayout, /<Suspense fallback=\{<ProtectedIdentityUnavailable \/>\}>/);
  assert.match(protectedLayout, /return <ProtectedIdentityUnavailable\s*\/?>/);
  assert.doesNotMatch(protectedLayout, /return children/);
  for (const [source, name] of [
    [protectedLayout, 'protected layout'],
    [protectedConfiguration, 'protected identity validator'],
    [identityProviders, 'identity providers'],
    [clientEnv, 'runtime client loader'],
    [clientSchema, 'runtime client schema'],
    [runtimeServerEnv, 'runtime server loader'],
    [runtimeServerSchema, 'runtime server schema'],
  ]) {
    assert.doesNotMatch(
      source,
      /getDeploymentEnv|CONVEX_DEPLOY_KEY|env\/deployment/,
      `${name} must not depend on Convex deployment credentials`,
    );
  }
});

test('missing or mismatched identity configuration cannot render protected children', () => {
  let serverCalls = 0;
  let clientCalls = 0;
  const serverMissing = validateProtectedIdentityConfiguration({
    getRuntimeServerEnv() {
      serverCalls += 1;
      throw new Error('missing server identity credentials');
    },
    getClientEnv() {
      clientCalls += 1;
    },
  });

  assert.deepEqual(serverMissing, { configured: false, reason: 'server' });
  assert.equal(serverCalls, 1, 'protected routes must call getRuntimeServerEnv');
  assert.equal(clientCalls, 0, 'client validation must not bypass a server failure');

  const clientMismatch = validateProtectedIdentityConfiguration({
    getRuntimeServerEnv() {
      serverCalls += 1;
    },
    getClientEnv() {
      clientCalls += 1;
      throw new Error('public identity configuration does not match');
    },
  });

  assert.deepEqual(clientMismatch, { configured: false, reason: 'client' });
  assert.equal(serverCalls, 2);
  assert.equal(clientCalls, 1);
});

test('public API route files remain outside presentation route groups', () => {
  for (const route of [
    'api/leads/route.ts',
    'api/manychat/route.ts',
    'api/storage/upload-url/route.ts',
    'api/cron/seo-ping/route.ts',
    'auth/callback/route.ts',
  ]) {
    assert.ok(exists(`src/app/${route}`), `public endpoint is missing: /${route}`);
  }
});

test('CSP permits only the Clerk and Convex browser endpoints needed by protected surfaces', () => {
  const config = JSON.parse(read('vercel.json'));
  const csp = config.headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key === 'Content-Security-Policy')?.value;

  assert.equal(typeof csp, 'string');
  assert.match(csp, /https:\/\/\*\.convex\.cloud/);
  assert.match(csp, /wss:\/\/\*\.convex\.cloud/);
  assert.match(csp, /https:\/\/\*\.protect\.clerk\.com/);
  assert.match(csp, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /worker-src 'self' blob:/);
});
