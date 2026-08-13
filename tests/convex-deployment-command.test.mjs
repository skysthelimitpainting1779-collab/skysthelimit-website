import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

function sourceFiles(directoryUrl) {
  return readdirSync(directoryUrl, { withFileTypes: true }).flatMap((entry) => {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    if (entry.isDirectory()) return sourceFiles(entryUrl);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [entryUrl] : [];
  });
}

test('Vercel validates the deployment environment then deploys Convex around the web build', () => {
  const packageJson = JSON.parse(read('package.json'));
  const vercel = JSON.parse(read('vercel.json'));

  assert.equal(
    packageJson.scripts['validate:convex-deploy-env'],
    'node scripts/validate-convex-deploy-env.mjs'
  );
  assert.equal(
    packageJson.scripts['build:vercel'],
    'npm run validate:convex-deploy-env && npx convex deploy --cmd "npm run build" && npm run verify:convex-production-webhook'
  );
  assert.equal(
    packageJson.scripts['verify:convex-production-webhook'],
    'node scripts/verify-convex-production-webhook.mjs'
  );
  assert.equal(
    packageJson.scripts['validate:convex-preview-defaults'],
    'node scripts/validate-convex-preview-defaults.mjs'
  );
  assert.equal(
    packageJson.scripts['validate:convex-preview-webhook'],
    'node scripts/validate-convex-preview-webhook.mjs'
  );
  assert.equal(
    packageJson.scripts['provision:convex-preview-webhook'],
    'node scripts/provision-convex-preview-webhook.mjs'
  );
  assert.equal(vercel.buildCommand, 'npm run build:vercel');
});

test('deployment validation consumes the key without printing it', () => {
  const validator = fileURLToPath(
    new URL('../scripts/validate-convex-deploy-env.mjs', import.meta.url)
  );
  const secret = 'preview:validation|do-not-print';
  const result = spawnSync(process.execPath, [validator], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_ENV: 'preview',
      CONVEX_DEPLOY_KEY: secret,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'Convex deployment environment validated.\n');
  assert.equal(`${result.stdout}${result.stderr}`.includes(secret), false);
});

test('deployment validation fails closed before Convex CLI execution', () => {
  const validator = fileURLToPath(
    new URL('../scripts/validate-convex-deploy-env.mjs', import.meta.url)
  );
  const result = spawnSync(process.execPath, [validator], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_ENV: 'production',
      CONVEX_DEPLOY_KEY: 'preview:wrong-tier|do-not-print',
    },
  });

  assert.equal(result.status, 1);
  const stderr = result.stderr.replace(
    /^\(node:\d+\) ExperimentalWarning: Type Stripping is an experimental feature and might change at any time\r?\n\(Use `node --trace-warnings \.\.\.` to show where the warning was created\)\r?\n/,
    ''
  );
  assert.equal(
    stderr,
    'Convex deployment environment validation failed.\n'
  );
  assert.doesNotMatch(result.stderr, /preview:wrong-tier/);
});

test('post-deployment Production verification requires the versioned Convex endpoint', async () => {
  const {
    probeProductionWebhook,
    verifyConvexProductionWebhook,
  } = await import(
    new URL(
      '../scripts/verify-convex-production-webhook.mjs',
      import.meta.url,
    )
  );
  const deploymentEnv = {
    NEXT_PUBLIC_APP_ENV: 'production',
    CONVEX_DEPLOY_KEY: 'prod:production|do-not-print',
  };
  await assert.rejects(
    verifyConvexProductionWebhook(deploymentEnv, {
      probeRemoteProductionWebhook: async () => {
        throw new Error('not ready');
      },
    }),
  );
  let probedDeployment;
  assert.deepEqual(
    await verifyConvexProductionWebhook(deploymentEnv, {
      probeRemoteProductionWebhook: async ({ deploymentName }) => {
        probedDeployment = deploymentName;
      },
    }),
    deploymentEnv,
  );
  assert.equal(probedDeployment, 'production');
  const expectedHeader = {
    'x-skys-limit-webhook-contract':
      'skys-limit-clerk-webhook-v1',
  };
  await probeProductionWebhook({
    deploymentName: 'production',
    fetchImpl: async () => new Response('Invalid signature', {
      status: 400,
      headers: expectedHeader,
    }),
  });
  await assert.rejects(
    probeProductionWebhook({
      deploymentName: 'production',
      fetchImpl: async () => new Response('Invalid signature', {
        status: 400,
      }),
    }),
  );

  const source = read('scripts/verify-convex-production-webhook.mjs');
  assert.match(source, /\.convex\.site\/clerk\/lifecycle/);
  assert.match(source, /response\.status !== 400/);
  assert.match(source, /x-skys-limit-webhook-contract/);
  assert.doesNotMatch(
    source,
    /'env',\s*'get',\s*'CLERK_WEBHOOK_SIGNING_SECRET'/s,
  );
});

test('production deployment validation rejects an unbound deploy-key identity', async () => {
  const {
    validateConvexDeployEnvironment,
  } = await import(
    new URL('../scripts/validate-convex-deploy-env.mjs', import.meta.url)
  );
  await assert.rejects(
    async () => validateConvexDeployEnvironment({
      NEXT_PUBLIC_APP_ENV: 'production',
      CONVEX_DEPLOY_KEY: 'prod:|do-not-print',
    }),
  );
});

test('local Convex CLI launches without a Windows command shim', async () => {
  const { runConvexCli } = await import(
    new URL('../scripts/lib/convex-cli.mjs', import.meta.url)
  );
  const result = runConvexCli(['--version'], { timeout: 15_000 });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^\d+\.\d+\.\d+\s*$/);
});

test('Preview provider preflights validate tiers and endpoint binding without printing secrets', () => {
  const defaultsValidator = fileURLToPath(
    new URL('../scripts/validate-convex-preview-defaults.mjs', import.meta.url)
  );
  const webhookValidator = fileURLToPath(
    new URL('../scripts/validate-convex-preview-webhook.mjs', import.meta.url)
  );
  const clerkSecret = 'sk_test_preview_secret_1234567890';
  const webhookSecret = 'whsec_preview_secret_12345678901234567890';
  const previewEnv = {
    ...process.env,
    NEXT_PUBLIC_APP_ENV: 'preview',
    CLERK_JWT_ISSUER_ENV: 'preview',
    CLERK_JWT_ISSUER_DOMAIN:
      'https://sky-preview.clerk.accounts.dev',
    CLERK_SECRET_KEY: clerkSecret,
  };
  const defaultsResult = spawnSync(process.execPath, [defaultsValidator], {
    encoding: 'utf8',
    env: previewEnv,
  });
  assert.equal(defaultsResult.status, 0, defaultsResult.stderr);
  assert.equal(
    defaultsResult.stdout,
    'Convex Preview project defaults validated.\n'
  );

  const webhookEnv = {
    ...process.env,
    NEXT_PUBLIC_APP_ENV: 'preview',
    CONVEX_DEPLOYMENT_TYPE: 'preview',
    CONVEX_DEPLOYMENT: 'hidden-roadrunner-577',
    CONVEX_SITE_URL: 'https://hidden-roadrunner-577.convex.site',
    CLERK_WEBHOOK_ENDPOINT_URL:
      'https://hidden-roadrunner-577.convex.site/clerk/lifecycle',
    CLERK_WEBHOOK_SIGNING_SECRET: webhookSecret,
  };
  const webhookResult = spawnSync(process.execPath, [webhookValidator], {
    encoding: 'utf8',
    env: webhookEnv,
  });
  assert.equal(webhookResult.status, 0, webhookResult.stderr);
  assert.equal(
    webhookResult.stdout,
    'Convex Preview webhook provisioning validated.\n'
  );

  const invalidResult = spawnSync(process.execPath, [webhookValidator], {
    encoding: 'utf8',
    env: {
      ...webhookEnv,
      CLERK_WEBHOOK_ENDPOINT_URL:
        'https://another-preview.convex.site/clerk/lifecycle',
    },
  });
  assert.equal(invalidResult.status, 1);
  const allOutput = [
    defaultsResult.stdout,
    defaultsResult.stderr,
    webhookResult.stdout,
    webhookResult.stderr,
    invalidResult.stdout,
    invalidResult.stderr,
  ].join('');
  assert.doesNotMatch(allOutput, new RegExp(clerkSecret));
  assert.doesNotMatch(allOutput, new RegExp(webhookSecret));
});

test('Preview provisioning binds the provider response directly to the CLI mutation', async () => {
  const {
    convexPreviewMutationEnvironment,
    provisionConvexPreviewWebhook,
  } = await import(
    new URL(
      '../scripts/provision-convex-preview-webhook.mjs',
      import.meta.url,
    )
  );
  const managementToken = 'management-do-not-print';
  const signingSecret =
    'whsec_provider_secret_12345678901234567890';
  const deployment = {
    id: 577,
    kind: 'cloud',
    name: 'hidden-roadrunner-577',
    deploymentType: 'preview',
    projectId: 4125,
    previewIdentifier: 'agent/skys-limit-convex-os',
    deploymentUrl:
      'https://hidden-roadrunner-577.eu-west-1.convex.cloud',
  };
  const mutations = [];
  const receipt = await provisionConvexPreviewWebhook({
    deploymentName: deployment.name,
    expectedProjectId: String(deployment.projectId),
    expectedPreviewIdentifier: deployment.previewIdentifier,
    endpointUrl:
      'https://hidden-roadrunner-577.convex.site/clerk/lifecycle',
    signingSecret,
    managementToken,
    fetchImpl: async (url, options) => {
      assert.equal(
        url,
        'https://api.convex.dev/v1/deployments/hidden-roadrunner-577',
      );
      assert.equal(options.headers.authorization, `Bearer ${managementToken}`);
      assert.equal(options.redirect, 'error');
      return new Response(JSON.stringify(deployment), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
    setSecret: async (mutation) => mutations.push(mutation),
  });

  assert.deepEqual(mutations, [{
    deploymentName: deployment.name,
    signingSecret,
  }]);
  assert.equal(receipt.deploymentType, 'preview');
  assert.equal(receipt.deploymentName, deployment.name);
  assert.equal(
    receipt.siteUrl,
    'https://hidden-roadrunner-577.convex.site',
  );
  assert.doesNotMatch(JSON.stringify(receipt), /whsec_/);
  const mutationEnv = convexPreviewMutationEnvironment({
    CONVEX_DEPLOY_KEY: 'prod:production|do-not-use',
    CONVEX_DEPLOYMENT_TOKEN: 'prod:production|do-not-use',
    CONVEX_DEPLOYMENT: 'production:production',
    CONVEX_SELF_HOSTED_URL: 'https://self-hosted.example.com',
    CONVEX_SELF_HOSTED_ADMIN_KEY: 'do-not-use',
    CONVEX_MANAGEMENT_TOKEN: managementToken,
    CLERK_WEBHOOK_SIGNING_SECRET: signingSecret,
    PATH: process.env.PATH,
  });
  assert.equal(mutationEnv.CONVEX_DEPLOY_KEY, '');
  assert.equal(mutationEnv.CONVEX_DEPLOYMENT_TOKEN, '');
  assert.equal(mutationEnv.CONVEX_DEPLOYMENT, '');
  assert.equal(mutationEnv.CONVEX_SELF_HOSTED_URL, '');
  assert.equal(mutationEnv.CONVEX_SELF_HOSTED_ADMIN_KEY, '');
  assert.equal('CONVEX_MANAGEMENT_TOKEN' in mutationEnv, false);
  assert.equal('CLERK_WEBHOOK_SIGNING_SECRET' in mutationEnv, false);
  assert.equal(mutationEnv.PATH, process.env.PATH);
});

test('Preview provisioning rejects provider-reported Production before mutation', async () => {
  const { provisionConvexPreviewWebhook } = await import(
    new URL(
      '../scripts/provision-convex-preview-webhook.mjs',
      import.meta.url,
    )
  );
  let mutations = 0;
  await assert.rejects(
    provisionConvexPreviewWebhook({
      deploymentName: 'careful-production-123',
      expectedProjectId: '4125',
      expectedPreviewIdentifier: 'agent/skys-limit-convex-os',
      endpointUrl:
        'https://careful-production-123.convex.site/clerk/lifecycle',
      signingSecret:
        'whsec_provider_secret_12345678901234567890',
      managementToken: 'management-do-not-print',
      fetchImpl: async () => new Response(JSON.stringify({
        id: 123,
        kind: 'cloud',
        name: 'careful-production-123',
        deploymentType: 'prod',
        projectId: 4125,
        previewIdentifier: null,
        deploymentUrl: 'https://careful-production-123.convex.cloud',
      }), { status: 200 }),
      setSecret: async () => {
        mutations += 1;
      },
    }),
  );
  assert.equal(mutations, 0);
});

test('deployment credentials stay outside the request-time source graph', () => {
  const allowed = new Set([
    'src/lib/env/deployment-schema.ts',
    'src/lib/env/deployment.ts',
  ]);
  const violations = sourceFiles(new URL('../src/', import.meta.url))
    .map((url) => ({
      path: fileURLToPath(url)
        .replace(fileURLToPath(root), '')
        .replaceAll('\\', '/'),
      source: readFileSync(url, 'utf8'),
    }))
    .filter(({ path }) => !allowed.has(path))
    .filter(
      ({ source }) =>
        /CONVEX_DEPLOY_KEY/.test(source) ||
        /(?:from|import\()\s*['"][^'"]*env\/deployment(?:-schema)?['"]/.test(source)
    )
    .map(({ path }) => path);

  assert.deepEqual(violations, []);
});
