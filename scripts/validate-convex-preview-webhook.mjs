import {
  parseConvexPreviewWebhookProvisioning,
} from '../src/lib/env/deployment-schema.ts';

try {
  parseConvexPreviewWebhookProvisioning({
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    CONVEX_DEPLOYMENT_TYPE: process.env.CONVEX_DEPLOYMENT_TYPE,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
    CLERK_WEBHOOK_ENDPOINT_URL: process.env.CLERK_WEBHOOK_ENDPOINT_URL,
    CLERK_WEBHOOK_SIGNING_SECRET:
      process.env.CLERK_WEBHOOK_SIGNING_SECRET,
  });
  process.stdout.write('Convex Preview webhook provisioning validated.\n');
} catch {
  process.stderr.write('Invalid Convex Preview webhook provisioning.\n');
  process.exitCode = 1;
}
