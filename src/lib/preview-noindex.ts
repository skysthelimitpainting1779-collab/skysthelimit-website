/**
 * Preview noindex policy (issue #162).
 *
 * Vercel sets VERCEL_ENV=production on the production deployment and
 * VERCEL_ENV=preview on preview/branch deployments. Only explicit preview
 * deployments receive the noindex robots tag — production indexing is
 * never blocked, including when VERCEL_ENV is unset (e.g. self-hosted).
 */

export const PREVIEW_ROBOTS_TAG = 'noindex, nofollow';

/**
 * Returns the X-Robots-Tag value for the given Vercel environment,
 * or undefined when the deployment must remain indexable.
 */
export function previewRobotsTag(vercelEnv: string | undefined): string | undefined {
  return vercelEnv === 'preview' ? PREVIEW_ROBOTS_TAG : undefined;
}
