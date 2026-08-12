/**
 * The one public URL Google should index. Do not derive this from a deployment
 * URL: preview deployments and a misconfigured environment variable must never
 * become canonical URLs in page metadata, structured data, robots, or sitemaps.
 */
export const CANONICAL_ORIGIN = 'https://www.skysthelimitpaintingllc.com';
export const CANONICAL_HOST = 'www.skysthelimitpaintingllc.com';
export const APEX_HOST = 'skysthelimitpaintingllc.com';

export function canonicalUrl(path = '/') {
  return new URL(path, CANONICAL_ORIGIN).toString();
}
