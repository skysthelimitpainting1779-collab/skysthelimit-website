import 'server-only';

import {
  parseDeploymentEnv,
  type DeploymentEnv,
} from './deployment-schema';

/** Server-only entry point for deployment and CI commands. */
export function getDeploymentEnv(): DeploymentEnv {
  return parseDeploymentEnv({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY,
  });
}

export {
  type DeploymentEnv,
  DeploymentEnvSchema,
  parseDeploymentEnv,
} from './deployment-schema';
