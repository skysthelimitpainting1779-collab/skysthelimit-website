import { fileURLToPath } from 'node:url';

import {
  parseConvexPreviewProviderDeployment,
  parseConvexPreviewWebhookProvisioning,
} from '../src/lib/env/deployment-schema.ts';
import { runConvexCli } from './lib/convex-cli.mjs';

const MANAGEMENT_API_ORIGIN = 'https://api.convex.dev';

function requireValue(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function parseProjectId(value) {
  const normalized = requireValue(value, 'CONVEX_PROJECT_ID');
  if (!/^\d+$/.test(normalized)) {
    throw new Error('CONVEX_PROJECT_ID must be an integer.');
  }
  const projectId = Number(normalized);
  if (!Number.isSafeInteger(projectId)) {
    throw new Error('CONVEX_PROJECT_ID must be a safe integer.');
  }
  return projectId;
}

export function convexSiteUrlFromDeploymentName(deploymentName) {
  return `https://${deploymentName}.convex.site`;
}

export async function fetchConvexPreviewDeployment({
  deploymentName,
  managementToken,
  fetchImpl = globalThis.fetch,
}) {
  const requestedName = requireValue(deploymentName, 'CONVEX_DEPLOYMENT');
  const token = requireValue(managementToken, 'CONVEX_MANAGEMENT_TOKEN');
  const response = await fetchImpl(
    `${MANAGEMENT_API_ORIGIN}/v1/deployments/${encodeURIComponent(requestedName)}`,
    {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
      redirect: 'error',
    },
  );
  if (!response.ok) {
    throw new Error('Convex Management API deployment lookup failed.');
  }
  const deployment = parseConvexPreviewProviderDeployment(
    await response.json(),
  );
  if (deployment.name !== requestedName) {
    throw new Error('Convex Management API returned a different deployment.');
  }
  return deployment;
}

export function setConvexPreviewWebhookSecret({
  deploymentName,
  signingSecret,
}) {
  const childEnv = convexPreviewMutationEnvironment(process.env);
  const result = runConvexCli(
    [
      'env',
      'set',
      'CLERK_WEBHOOK_SIGNING_SECRET',
      '--deployment',
      deploymentName,
    ],
    {
      encoding: 'utf8',
      env: childEnv,
      input: `${signingSecret}\n`,
      shell: false,
      stdio: ['pipe', 'ignore', 'ignore'],
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error('Convex Preview webhook secret mutation failed.');
  }
}

export function convexPreviewMutationEnvironment(environment) {
  const childEnv = { ...environment };
  delete childEnv.CONVEX_MANAGEMENT_TOKEN;
  delete childEnv.CLERK_WEBHOOK_SIGNING_SECRET;
  for (const selector of [
    'CONVEX_DEPLOY_KEY',
    'CONVEX_DEPLOYMENT_TOKEN',
    'CONVEX_DEPLOYMENT',
    'CONVEX_SELF_HOSTED_URL',
    'CONVEX_SELF_HOSTED_ADMIN_KEY',
  ]) {
    childEnv[selector] = '';
  }
  return childEnv;
}

export async function provisionConvexPreviewWebhook({
  deploymentName,
  expectedProjectId,
  expectedPreviewIdentifier,
  endpointUrl,
  signingSecret,
  managementToken,
  fetchImpl = globalThis.fetch,
  setSecret = setConvexPreviewWebhookSecret,
}) {
  const deployment = await fetchConvexPreviewDeployment({
    deploymentName,
    managementToken,
    fetchImpl,
  });
  if (deployment.projectId !== parseProjectId(expectedProjectId)) {
    throw new Error('Convex deployment belongs to a different project.');
  }
  if (
    deployment.previewIdentifier !==
    requireValue(expectedPreviewIdentifier, 'CONVEX_PREVIEW_IDENTIFIER')
  ) {
    throw new Error('Convex deployment belongs to a different Preview branch.');
  }

  const siteUrl = convexSiteUrlFromDeploymentName(deployment.name);
  const provisioning = parseConvexPreviewWebhookProvisioning({
    NEXT_PUBLIC_APP_ENV: 'preview',
    CONVEX_DEPLOYMENT_TYPE: deployment.deploymentType,
    CONVEX_DEPLOYMENT: deployment.name,
    CONVEX_SITE_URL: siteUrl,
    CLERK_WEBHOOK_ENDPOINT_URL: endpointUrl,
    CLERK_WEBHOOK_SIGNING_SECRET: signingSecret,
  });
  await setSecret({
    deploymentName: deployment.name,
    signingSecret: provisioning.CLERK_WEBHOOK_SIGNING_SECRET,
  });

  return {
    deploymentId: deployment.id,
    deploymentName: deployment.name,
    deploymentType: deployment.deploymentType,
    projectId: deployment.projectId,
    previewIdentifier: deployment.previewIdentifier,
    deploymentUrl: deployment.deploymentUrl,
    siteUrl,
    endpointUrl: provisioning.CLERK_WEBHOOK_ENDPOINT_URL,
  };
}

async function main() {
  const receipt = await provisionConvexPreviewWebhook({
    deploymentName: process.env.CONVEX_DEPLOYMENT,
    expectedProjectId: process.env.CONVEX_PROJECT_ID,
    expectedPreviewIdentifier: process.env.CONVEX_PREVIEW_IDENTIFIER,
    endpointUrl: process.env.CLERK_WEBHOOK_ENDPOINT_URL,
    signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
    managementToken: process.env.CONVEX_MANAGEMENT_TOKEN,
  });
  process.stdout.write(`${JSON.stringify({ ok: true, ...receipt })}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(() => {
    process.stderr.write('Convex Preview webhook provisioning failed.\n');
    process.exitCode = 1;
  });
}
