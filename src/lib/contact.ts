export const businessEmail = 'skysthelimitpainting1779@gmail.com';
export const businessPhone = '651-410-4196';

/**
 * Canonical E.164 tap-to-call href (T31 / issue #284).
 * All phone hrefs use this; display text stays in `businessPhone`.
 */
export const phoneHref = 'tel:+16514104196';

export function buildEstimateMailto(fields: Record<string, string>) {
  const body = Object.entries(fields)
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');

  const subject = "Estimate request - Sky's the Limit Painting LLC";
  return `mailto:${businessEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
