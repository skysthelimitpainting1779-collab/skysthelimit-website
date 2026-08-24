import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  ClientEnvSchema,
  parseClientEnv,
} from '../src/lib/env/client-schema.ts';
import {
  RuntimeServerEnvSchema,
  parseRuntimeServerEnv,
} from '../src/lib/env/server-schema.ts';
import {
  DeploymentEnvSchema,
  parseDeploymentEnv,
} from '../src/lib/env/deployment-schema.ts';
import { parseConvexClerkAuthEnv } from '../convex/clerkAuth.ts';
import {
  mapClerkIdentity,
  mapVerifiedClerkLifecycleEvent,
} from '../src/components/providers/identity.ts';

const clientEnv = {
  NEXT_PUBLIC_APP_ENV: 'preview',
  NEXT_PUBLIC_CONVEX_ENV: 'preview',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_example',
  NEXT_PUBLIC_CONVEX_URL: 'https://example.convex.cloud',
};

const runtimeServerEnv = {
  NEXT_PUBLIC_APP_ENV: 'preview',
  CLERK_SECRET_KEY: 'sk_test_example',
};

const deploymentEnv = {
  NEXT_PUBLIC_APP_ENV: 'preview',
  CONVEX_DEPLOY_KEY: 'preview:example|example',
};

test('client environment permits only a matching public Clerk and Convex environment', () => {
  assert.deepEqual(parseClientEnv(clientEnv), clientEnv);
  for (const [appEnv, clerkKey] of [
    ['development', 'pk_test_development'],
    ['preview', 'pk_test_preview'],
    ['production', 'pk_live_production'],
  ]) {
    assert.equal(ClientEnvSchema.safeParse({
      ...clientEnv,
      NEXT_PUBLIC_APP_ENV: appEnv,
      NEXT_PUBLIC_CONVEX_ENV: appEnv,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: clerkKey,
    }).success, true);
  }
  assert.equal(ClientEnvSchema.safeParse({ ...clientEnv, CLERK_SECRET_KEY: 'secret' }).success, false);
  assert.equal(ClientEnvSchema.safeParse({ ...clientEnv, NEXT_PUBLIC_CONVEX_ENV: 'production' }).success, false);
  assert.equal(ClientEnvSchema.safeParse({
    ...clientEnv,
    NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_CONVEX_ENV: 'production',
  }).success, false);
});

test('runtime server environment enforces Clerk tier pairing without deployment credentials', () => {
  assert.deepEqual(parseRuntimeServerEnv(runtimeServerEnv), runtimeServerEnv);
  for (const [appEnv, clerkKey] of [
    ['development', 'sk_test_development'],
    ['preview', 'sk_test_preview'],
    ['production', 'sk_live_production'],
  ]) {
    assert.equal(RuntimeServerEnvSchema.safeParse({
      NEXT_PUBLIC_APP_ENV: appEnv,
      CLERK_SECRET_KEY: clerkKey,
    }).success, true);
  }
  assert.equal(RuntimeServerEnvSchema.safeParse({
    ...runtimeServerEnv,
    CONVEX_DEPLOY_KEY: deploymentEnv.CONVEX_DEPLOY_KEY,
  }).success, false);
  assert.equal(RuntimeServerEnvSchema.safeParse({
    ...runtimeServerEnv,
    NEXT_PUBLIC_APP_ENV: 'production',
  }).success, false);
  assert.deepEqual(parseRuntimeServerEnv({
    NEXT_PUBLIC_APP_ENV: 'production',
    CLERK_SECRET_KEY: 'sk_live_example',
  }), {
    NEXT_PUBLIC_APP_ENV: 'production',
    CLERK_SECRET_KEY: 'sk_live_example',
  });
});

test('deployment environment validates the Convex deploy key in an isolated schema', () => {
  assert.deepEqual(parseDeploymentEnv(deploymentEnv), deploymentEnv);
  for (const [appEnv, convexKey] of [
    ['development', 'dev:development|example'],
    ['preview', 'preview:preview|example'],
    ['production', 'prod:production|example'],
  ]) {
    assert.equal(DeploymentEnvSchema.safeParse({
      NEXT_PUBLIC_APP_ENV: appEnv,
      CONVEX_DEPLOY_KEY: convexKey,
    }).success, true);
  }
  assert.equal(DeploymentEnvSchema.safeParse({
    ...deploymentEnv,
    CLERK_SECRET_KEY: runtimeServerEnv.CLERK_SECRET_KEY,
  }).success, false);
  assert.equal(DeploymentEnvSchema.safeParse({
    ...deploymentEnv,
    NEXT_PUBLIC_APP_ENV: 'production',
  }).success, false);
});

test('Convex Clerk auth validates the canonical tier and issuer domain shape', () => {
  assert.deepEqual(parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-preview.clerk.accounts.dev/',
  }), {
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-preview.clerk.accounts.dev',
  });
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'production',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-preview.clerk.accounts.dev',
  }));
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'production',
    CLERK_JWT_ISSUER_ENV: 'production',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development.lcl.dev',
  }));
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'production',
    CLERK_JWT_ISSUER_ENV: 'production',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development.clerk.accounts.dev',
  }));
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'https://clerk.example.com',
  }));
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'http://sky-preview.clerk.accounts.dev/path?unsafe=true',
  }));
});

test('Convex Clerk auth rejects development and preview issuer domain collisions', () => {
  assert.deepEqual(parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'development',
    CLERK_JWT_ISSUER_ENV: 'development',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development.clerk.accounts.dev',
  }), {
    NEXT_PUBLIC_APP_ENV: 'development',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development.clerk.accounts.dev',
  });
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'development',
    CLERK_JWT_ISSUER_ENV: 'development',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-preview.clerk.accounts.dev',
  }), /environment/i);
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development.clerk.accounts.dev',
  }), /environment/i);
  assert.throws(() => parseConvexClerkAuthEnv({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN: 'https://sky-development-preview.clerk.accounts.dev',
  }), /environment/i);
});

test('identity mapping denies anonymous and malformed Clerk subjects', () => {
  assert.deepEqual(mapClerkIdentity(null), { allowed: false, reason: 'anonymous' });
  assert.deepEqual(mapClerkIdentity({ userId: ' ' }), { allowed: false, reason: 'invalid_subject' });
});

test('identity mapping keeps only the Clerk subject and never maps customer or staff access', () => {
  const mapped = mapClerkIdentity({
    userId: 'user_123',
    email: 'customer@example.com',
    role: 'staff',
    companyId: 'company_a',
    projectId: 'project_a',
  });
  assert.deepEqual(mapped, {
    allowed: true,
    identity: { provider: 'clerk', subject: 'user_123', status: 'active' },
  });
});

test('lifecycle mapping accepts only verified events and disables deleted users', () => {
  assert.deepEqual(mapVerifiedClerkLifecycleEvent({ verified: false, type: 'user.created', userId: 'user_123' }), {
    allowed: false,
    reason: 'unverified_event',
  });
  assert.deepEqual(mapVerifiedClerkLifecycleEvent({ verified: true, type: 'user.created', userId: 'user_123' }), {
    allowed: true,
    operation: 'upsert',
    identity: { provider: 'clerk', subject: 'user_123', status: 'active' },
  });
  assert.deepEqual(mapVerifiedClerkLifecycleEvent({ verified: true, type: 'user.deleted', userId: 'user_123' }), {
    allowed: true,
    operation: 'disable',
    identity: { provider: 'clerk', subject: 'user_123', status: 'disabled' },
  });
  assert.deepEqual(mapVerifiedClerkLifecycleEvent({ verified: true, type: 'user.updated', userId: 'user_123', disabled: true }), {
    allowed: true,
    operation: 'disable',
    identity: { provider: 'clerk', subject: 'user_123', status: 'disabled' },
  });
});

test('the provider boundary and runtime entry points use Clerk as the token authority', async () => {
  const [
    provider,
    authConfig,
    identity,
    runtimeServerEnvBoundary,
    deploymentEnvBoundary,
    clientEnvBoundary,
    clientSchema,
    runtimeServerSchema,
    deploymentSchema,
    convexSchema,
  ] = await Promise.all([
    readFile(new URL('../src/components/providers/ConvexProviderWithClerk.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../convex/auth.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/providers/identity.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/server.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/deployment.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/client.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/client-schema.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/server-schema.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/env/deployment-schema.ts', import.meta.url), 'utf8'),
    readFile(new URL('../convex/clerkAuth.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(provider, /'use client'/);
  assert.match(provider, /ConvexProviderWithClerk/);
  assert.match(provider, /ClerkProvider/);
  assert.match(authConfig, /CLERK_JWT_ISSUER_DOMAIN/);
  assert.match(authConfig, /parseConvexClerkAuthEnv/);
  assert.match(authConfig, /applicationID:\s*['"]convex['"]/);
  assert.match(runtimeServerEnvBoundary, /import 'server-only'/);
  assert.match(runtimeServerEnvBoundary, /process\.env\.CLERK_SECRET_KEY/);
  assert.doesNotMatch(runtimeServerEnvBoundary, /CONVEX_DEPLOY_KEY/);
  assert.doesNotMatch(runtimeServerSchema, /CONVEX_DEPLOY_KEY/);
  assert.match(deploymentEnvBoundary, /import 'server-only'/);
  assert.match(deploymentEnvBoundary, /process\.env\.CONVEX_DEPLOY_KEY/);
  assert.match(deploymentSchema, /CONVEX_DEPLOY_KEY/);
  assert.match(clientEnvBoundary, /process\.env\.NEXT_PUBLIC_CONVEX_URL/);
  assert.doesNotMatch(clientSchema, /process\.env/);
  assert.doesNotMatch(runtimeServerSchema, /process\.env/);
  assert.doesNotMatch(deploymentSchema, /process\.env/);
  assert.doesNotMatch(convexSchema, /process\.env/);
  assert.doesNotMatch(identity, /authorizeIdentity|IdentityGrant|companyId|projectId/);
});

test('Clerk owns sessions while Convex owns lifecycle, MFA, invitations, and resource authorization', async () => {
  const [proxy, login, portal, manage, users, webhook, invitations, crm, generated] =
    await Promise.all([
      readFile(new URL('../src/proxy.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/(protected)/portal/login/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/(protected)/portal/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/(protected)/manage/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../convex/users.ts', import.meta.url), 'utf8'),
      readFile(new URL('../convex/http.ts', import.meta.url), 'utf8'),
      readFile(new URL('../convex/invitations.ts', import.meta.url), 'utf8'),
      readFile(new URL('../convex/crm.ts', import.meta.url), 'utf8'),
      readFile(new URL('../convex/_generated/api.d.ts', import.meta.url), 'utf8'),
    ]);

  assert.match(proxy, /clerkMiddleware/);
  assert.match(proxy, /auth\.protect/);
  assert.doesNotMatch(proxy, /supabase|app_metadata|gateStaffAccess/i);
  assert.match(login, /<SignIn/);
  assert.doesNotMatch(login, /supabase|signInWithOtp|signInWithOAuth/i);
  assert.match(portal, /api\.crm\.myProjects/);
  assert.doesNotMatch(portal, /supabase|email.*ownership/i);
  assert.doesNotMatch(manage, /supabase|signInWithPassword|signUp\(/i);
  assert.match(manage, /api\.crm\.staffOverview/);
  assert.match(users, /applyVerifiedClerkLifecycle/);
  assert.match(webhook, /verifyWebhook/);
  assert.match(webhook, /CLERK_WEBHOOK_SIGNING_SECRET/);
  assert.match(invitations, /internal\.invitationsInternal\.authorizeCreate/);
  assert.match(crm, /requireCompanyMembership/);
  assert.match(crm, /export const staffOverview = query/);
  assert.match(crm, /roles:\s*\[['"]staff['"], ['"]admin['"]\]/);
  assert.match(crm, /requireProjectGrant/);
  assert.match(crm, /appendAuditFact/);
  assert.match(generated, /crm: typeof crm/);
});
