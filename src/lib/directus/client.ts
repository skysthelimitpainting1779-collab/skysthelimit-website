import { createDirectus, rest, readItems, readSingleton, type RestClient } from '@directus/sdk';

// ─── CMS Types ──────────────────────────────────────────────────────
export interface CaseStudy {
  id: number;
  status: 'draft' | 'published' | 'archived';
  sort: number | null;
  type: string;
  location: string;
  problem: string;
  prep: string[];
  result: string;
  image: string | null;
  before_image: string | null;
  after_image: string | null;
  market: 'residential' | 'commercial' | 'public-sector';
  date_created: string | null;
  date_updated: string | null;
}

export interface CMSMarket {
  id: number;
  status: 'draft' | 'published';
  sort: number | null;
  slug: string;
  nav_label: string;
  number: string;
  title: string;
  headline: string;
  summary: string;
  description: string;
  image: string | null;
  hero_image: string | null;
  accent: string;
  proof: string[];
  capabilities: Array<{ title: string; body: string }>;
  process: Array<{ title: string; body: string }>;
  cta: string;
  meta_title: string;
  meta_description: string;
}

export interface SiteConfig {
  id: number;
  site_title: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  mn_contractor_id: string;
  naics_code: string;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_google: string | null;
  cta_headline: string;
  cta_body: string;
  announcement_bar: string | null;
  announcement_active: boolean;
}

export interface DirectusSchema {
  case_studies: CaseStudy[];
  markets: CMSMarket[];
  site_config: SiteConfig;
}

export interface DirectusEnv {
  NEXT_PUBLIC_DIRECTUS_URL?: string;
  DIRECTUS_URL?: string;
}

export type DirectusClient = RestClient<DirectusSchema>;

// ─── Client Factory ─────────────────────────────────────────────────
function runtimeDirectusEnv(): DirectusEnv {
  return {
    NEXT_PUBLIC_DIRECTUS_URL: process.env.NEXT_PUBLIC_DIRECTUS_URL,
    DIRECTUS_URL: process.env.DIRECTUS_URL,
  };
}

export function hasDirectusConfig(
  env: DirectusEnv = runtimeDirectusEnv(),
): boolean {
  return Boolean(env.NEXT_PUBLIC_DIRECTUS_URL?.trim() || env.DIRECTUS_URL?.trim());
}

export function getDirectusUrl(env: DirectusEnv = runtimeDirectusEnv()): string {
  return (
    env.NEXT_PUBLIC_DIRECTUS_URL ||
    env.DIRECTUS_URL ||
    'http://localhost:8055'
  ).replace(/\/$/, '');
}

/**
 * Create a typed Directus REST client. Injectable URL for tests / staging.
 */
export function createDirectusClient(url: string = getDirectusUrl()): DirectusClient {
  return createDirectus<DirectusSchema>(url).with(rest()) as DirectusClient;
}

function resolveClient(client?: DirectusClient): DirectusClient | null {
  if (client) return client;
  return hasDirectusConfig() ? createDirectusClient() : null;
}

// ─── Asset URL Helper ───────────────────────────────────────────────
export function directusAssetUrl(fileId: string | null, baseUrl: string = getDirectusUrl()): string | null {
  if (!fileId) return null;
  if (fileId.startsWith('http://') || fileId.startsWith('https://') || fileId.startsWith('/')) {
    return fileId;
  }
  return `${baseUrl}/assets/${fileId}`;
}

/** Keep only published items (defensive if API filter is omitted). */
export function filterPublishedCaseStudies(items: CaseStudy[] | null | undefined): CaseStudy[] {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i && i.status === 'published');
}

export function filterPublishedMarkets(items: CMSMarket[] | null | undefined): CMSMarket[] {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => i && i.status === 'published');
}

// ─── Data Fetchers (with graceful fallback) ─────────────────────────
export async function getCaseStudies(client?: DirectusClient): Promise<CaseStudy[]> {
  'use cache';
  const resolvedClient = resolveClient(client);
  if (!resolvedClient) return [];

  try {
    const data = await resolvedClient.request(
      readItems('case_studies', {
        filter: { status: { _eq: 'published' } },
        sort: ['sort'],
        fields: ['*'],
      })
    );
    return filterPublishedCaseStudies(data as CaseStudy[]);
  } catch (err) {
    console.warn('[CMS] case_studies fetch failed, returning empty:', (err as Error).message);
    return [];
  }
}

export async function getMarkets(client?: DirectusClient): Promise<CMSMarket[]> {
  'use cache';
  const resolvedClient = resolveClient(client);
  if (!resolvedClient) return [];

  try {
    const data = await resolvedClient.request(
      readItems('markets', {
        filter: { status: { _eq: 'published' } },
        sort: ['sort'],
        fields: ['*'],
      })
    );
    return filterPublishedMarkets(data as CMSMarket[]);
  } catch (err) {
    console.warn('[CMS] markets fetch failed, returning empty:', (err as Error).message);
    return [];
  }
}

export async function getSiteConfig(client?: DirectusClient): Promise<SiteConfig | null> {
  'use cache';
  const resolvedClient = resolveClient(client);
  if (!resolvedClient) return null;

  try {
    const data = await resolvedClient.request(readSingleton('site_config', { fields: ['*'] }));
    return data as SiteConfig;
  } catch (err) {
    console.warn('[CMS] site_config fetch failed, returning null:', (err as Error).message);
    return null;
  }
}

/**
 * Health probe used by scripts/tests — returns whether Directus responds at /server/health or /server/info.
 */
export async function probeDirectusHealth(
  url: string = getDirectusUrl(),
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: boolean; status?: number; body?: string }> {
  try {
    const res = await fetchImpl(`${url.replace(/\/$/, '')}/server/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body: body.slice(0, 200) };
  } catch (err) {
    return { ok: false, body: (err as Error).message };
  }
}
