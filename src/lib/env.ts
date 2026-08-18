// Safe helper to get environment variables across Next.js and Vite.
// Supports standard, NEXT_PUBLIC_, and integration-prefixed names (e.g. backend_ from Vercel Supabase).
function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    const candidates = [
      key,
      `NEXT_PUBLIC_${key}`,
      `backend_${key}`,
      `NEXT_PUBLIC_backend_${key}`,
      `VITE_${key}`,
    ];
    for (const c of candidates) {
      if (process.env[c]) return process.env[c];
    }
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const metaCandidates = [key, `VITE_${key}`];
      for (const c of metaCandidates) {
        // @ts-ignore
        if (import.meta.env[c]) return import.meta.env[c];
      }
    }
  } catch {
    // import.meta may not exist in all runtimes (feature detection)
  }
  return undefined;
}

export { getEnv };

const gaMeasurementDisabled = ['0', 'false', 'off'].includes((getEnv('GA_MEASUREMENT_ENABLED') || '').toLowerCase());
const gaMeasurementId = getEnv('GA_MEASUREMENT_ID');
const isVercelProduction = getEnv('VERCEL_ENV') === 'production';

export const ENV = {
  SITE_URL: getEnv('SITE_URL') || 'https://www.skysthelimitpaintingllc.com',
  // GA4 Measurement IDs are public identifiers. An explicitly configured ID works in any environment; the verified property is used only on Vercel production. Set GA_MEASUREMENT_ENABLED=0 to disable loading deliberately.
  GA_MEASUREMENT_ID: gaMeasurementDisabled ? undefined : gaMeasurementId || (isVercelProduction ? 'G-QHTQ7YBDSF' : undefined),
  FORMSPREE_FORM_ID: getEnv('FORMSPREE_FORM_ID') || 'xanybvkd',
  GOOGLE_SITE_VERIFICATION: getEnv('GOOGLE_SITE_VERIFICATION'),
  // Facebook & Instagram profiles are not live yet; leave empty until created so
  // we don't render dead links or assert non-existent profiles in JSON-LD sameAs.
  FACEBOOK_URL: getEnv('FACEBOOK_URL') || '',
  INSTAGRAM_URL: getEnv('INSTAGRAM_URL') || '',
  LINKEDIN_URL: getEnv('LINKEDIN_URL') || 'https://www.linkedin.com/in/anthony-briseno-5444b0410/',
  TIKTOK_URL: getEnv('TIKTOK_URL') || 'https://tiktok.com/@skysthelimitpaintingllc',
  // Verified Google Business Profile (CID), the strongest local-SEO entity link.
  GOOGLE_BUSINESS_URL: getEnv('GOOGLE_BUSINESS_URL') || 'https://www.google.com/maps?cid=8497050136769031462',
  BOOKING_URL: getEnv('BOOKING_URL') || '',
  // Explicitly reference process.env for Next.js client-side static substitution
  SUPABASE_URL: process.env.NEXT_PUBLIC_backend_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || getEnv('SUPABASE_URL') || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_backend_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || getEnv('SUPABASE_ANON_KEY') || '',
};
