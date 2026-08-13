import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Convex declares every required Clerk environment variable', () => {
  const config = read('convex/convex.config.ts');

  for (const name of [
    'NEXT_PUBLIC_APP_ENV',
    'CLERK_JWT_ISSUER_ENV',
    'CLERK_JWT_ISSUER_DOMAIN',
    'CLERK_WEBHOOK_SIGNING_SECRET',
    'CLERK_SECRET_KEY',
  ]) {
    assert.match(config, new RegExp(`\\b${name}\\s*:`), `${name} must be declared`);
  }
  assert.match(config, /defineApp\(\s*\{\s*env:/s);
  assert.match(
    config,
    /CLERK_WEBHOOK_SIGNING_SECRET:\s*v\.optional\(v\.string\(\)\)/,
  );
});

test('Production verifies the versioned Convex webhook after deploy without reading secrets', () => {
  const validator = read('scripts/verify-convex-production-webhook.mjs');

  assert.match(validator, /\.convex\.site\/clerk\/lifecycle/);
  assert.match(validator, /method:\s*'POST'/);
  assert.match(validator, /response\.status !== 400/);
  assert.match(validator, /x-skys-limit-webhook-contract/);
  assert.doesNotMatch(
    validator,
    /'env',\s*'get',\s*'CLERK_WEBHOOK_SIGNING_SECRET'/s,
  );
  const webhook = read('convex/http.ts');
  assert.match(webhook, /clerkWebhookSecretPattern/);
  assert.match(webhook, /clerkWebhookResponse\('Webhook not configured', 503\)/);
  assert.match(webhook, /x-skys-limit-webhook-contract/);
});

test('Vercel deployment matching binds exact commit, project, and URL', async () => {
  const {
    deploymentMatchesCommit,
    deploymentMatchesProject,
    normalizeDeploymentUrl,
  } = await import(
    new URL('../scripts/verify-vercel-deployment.mjs', import.meta.url)
  );
  const sha = '0123456789abcdef0123456789abcdef01234567';

  assert.equal(typeof deploymentMatchesCommit, 'function');
  assert.equal(
    deploymentMatchesCommit({ meta: { githubCommitSha: sha } }, sha),
    true,
  );
  assert.equal(
    deploymentMatchesCommit({ meta: { githubCommitSha: sha.slice(0, 7) } }, sha),
    false,
  );
  assert.equal(
    deploymentMatchesCommit({ name: `preview-${sha.slice(0, 7)}` }, sha),
    false,
  );
  assert.equal(
    deploymentMatchesCommit({ meta: { githubCommitSha: sha } }, sha.slice(0, 7)),
    false,
  );
  assert.equal(
    deploymentMatchesCommit({
      gitSource: { sha },
      meta: { githubCommitSha: 'f'.repeat(40) },
    }, sha),
    false,
  );
  assert.equal(
    deploymentMatchesCommit({ gitSource: { sha: sha.toUpperCase() } }, sha),
    true,
  );
  assert.equal(deploymentMatchesProject({ projectId: 'prj_expected' }, 'prj_expected'), true);
  assert.equal(deploymentMatchesProject({ project: { id: 'prj_other' } }, 'prj_expected'), false);
  assert.equal(normalizeDeploymentUrl('https://example.vercel.app/'), 'https://example.vercel.app');
  assert.equal(normalizeDeploymentUrl('https://example.vercel.app/$(whoami)'), null);
  assert.equal(normalizeDeploymentUrl('https://user@example.vercel.app'), null);
  assert.match(
    read('scripts/verify-vercel-deployment.mjs'),
    /withGitRepoInfo/,
  );
  const workflow = read('.github/workflows/deployment-verification.yml');
  assert.match(workflow, /node scripts\/verify-vercel-deployment\.mjs/);
  assert.match(workflow, /DEPLOYMENT_SHA:\s*\$\{\{ steps\.target\.outputs\.sha \}\}/);
  assert.match(workflow, /DEPLOYMENT_URL:\s*\$\{\{ steps\.target\.outputs\.deployment_url \}\}/);
  assert.doesNotMatch(workflow, /--url "\$\{\{/);
  assert.match(workflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
});

test('Clerk authorized parties allow only normalized local or HTTPS origins', async () => {
  const { buildClerkAuthorizedParties } = await import(
    new URL('../src/lib/auth/clerk-authorized-parties.ts', import.meta.url)
  );

  assert.deepEqual(buildClerkAuthorizedParties({
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    SITE_URL: 'https://www.skysthelimitpaintingllc.com/',
  }), [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.skysthelimitpaintingllc.com',
  ]);
  assert.deepEqual(buildClerkAuthorizedParties({
    VERCEL: '1',
    VERCEL_URL: 'branch-example.vercel.app',
    VERCEL_BRANCH_URL: 'branch-example.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'www.skysthelimitpaintingllc.com',
  }), [
    'https://branch-example.vercel.app',
    'https://www.skysthelimitpaintingllc.com',
  ]);
  assert.throws(
    () => buildClerkAuthorizedParties({ SITE_URL: 'http://example.com' }),
    /HTTPS/,
  );
  assert.throws(
    () => buildClerkAuthorizedParties({ SITE_URL: 'https://example.com/path' }),
    /origin/,
  );
});

test('Clerk proxy and portal enforce identity at resource boundaries', () => {
  const proxy = read('src/proxy.ts');
  const portal = read('src/app/(protected)/portal/page.tsx');
  const manageLayout = read('src/app/(protected)/manage/layout.tsx');

  assert.match(proxy, /authorizedParties:\s*buildClerkAuthorizedParties/);
  assert.doesNotMatch(proxy, /createRouteMatcher|auth\.protect/);
  assert.match(portal, /useConvexAuth\(\)/);
  assert.match(portal, /isAuthenticated\s*\?\s*\{\}\s*:\s*['"]skip['"]/);
  assert.match(portal, /isAuthenticated\s*&&\s*currentUser\?\.status === ['"]active['"]/);
  assert.match(manageLayout, /await auth\(\)/);
  assert.match(manageLayout, /redirect\(['"]\/portal\/login/);
});

test('Vercel CSP includes the explicit Clerk image and connection origins', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const csp = vercel.headers
    .flatMap((entry) => entry.headers)
    .find((header) => header.key === 'Content-Security-Policy')?.value || '';

  assert.match(csp, /img-src[^;]*https:\/\/img\.clerk\.com/);
  assert.match(csp, /connect-src[^;]*https:\/\/img\.clerk\.com/);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /base-uri 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /worker-src 'self' blob:/);
});
