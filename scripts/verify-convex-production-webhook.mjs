import { fileURLToPath } from 'node:url';

import {
  productionDeploymentName,
  validateConvexDeployEnvironment,
} from './validate-convex-deploy-env.mjs';

const contractHeader = 'x-skys-limit-webhook-contract';
const contractVersion = 'skys-limit-clerk-webhook-v1';

export async function probeProductionWebhook({
  deploymentName,
  fetchImpl = globalThis.fetch,
}) {
  const response = await fetchImpl(
    `https://${deploymentName}.convex.site/clerk/lifecycle`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (
    response.status !== 400 ||
    response.headers.get(contractHeader) !== contractVersion
  ) {
    throw new Error('Convex production webhook is not ready.');
  }
}

export async function verifyConvexProductionWebhook(
  input,
  { probeRemoteProductionWebhook = probeProductionWebhook } = {},
) {
  const deploymentEnv = validateConvexDeployEnvironment(input);
  if (deploymentEnv.NEXT_PUBLIC_APP_ENV === 'production') {
    await probeRemoteProductionWebhook({
      deploymentName: productionDeploymentName(
        deploymentEnv.CONVEX_DEPLOY_KEY,
      ),
    });
  }
  return deploymentEnv;
}

async function main() {
  try {
    await verifyConvexProductionWebhook(process.env);
    process.stdout.write('Convex production webhook verified.\n');
  } catch {
    process.stderr.write('Convex production webhook verification failed.\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
