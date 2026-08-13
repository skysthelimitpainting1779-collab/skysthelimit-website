import { fileURLToPath } from 'node:url';

import { parseDeploymentEnv } from '../src/lib/env/deployment-schema.ts';

export function productionDeploymentName(deployKey) {
  const match = /^prod:([a-z][a-z0-9-]{2,127})\|/.exec(deployKey);
  if (!match) {
    throw new Error('Convex production deploy key has an invalid identity.');
  }
  return match[1];
}

export function validateConvexDeployEnvironment(input) {
  const deploymentEnv = parseDeploymentEnv({
    NEXT_PUBLIC_APP_ENV: input.NEXT_PUBLIC_APP_ENV,
    CONVEX_DEPLOY_KEY: input.CONVEX_DEPLOY_KEY,
  });
  if (deploymentEnv.NEXT_PUBLIC_APP_ENV === 'production') {
    productionDeploymentName(deploymentEnv.CONVEX_DEPLOY_KEY);
  }
  return deploymentEnv;
}

async function main() {
  try {
    validateConvexDeployEnvironment(process.env);
    process.stdout.write('Convex deployment environment validated.\n');
  } catch {
    process.stderr.write('Convex deployment environment validation failed.\n');
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
