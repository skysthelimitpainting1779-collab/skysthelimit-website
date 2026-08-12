import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '../lib/site';
import { landingPages, landingPagePath } from '../data/landingPages';

const site = CANONICAL_ORIGIN;

const staticRoutes: { path: string; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency']; priority: number }[] =
  [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/residential', changeFrequency: 'weekly', priority: 0.95 },
    { path: '/commercial', changeFrequency: 'weekly', priority: 0.95 },
    { path: '/public-sector', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/projects', changeFrequency: 'weekly', priority: 0.85 },
    { path: '/estimate', changeFrequency: 'monthly', priority: 0.95 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.85 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/capabilities', changeFrequency: 'monthly', priority: 0.75 },
    { path: '/service-area', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/refer', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/painting-services/interior-painting', changeFrequency: 'monthly', priority: 0.85 },
  ];

/**
 * Dynamic App Router sitemap — always includes marketing + landing pages from data.
 * Complements postbuild generate-sitemap.js for static public/ output.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${site}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const landingEntries: MetadataRoute.Sitemap = landingPages.map((page) => ({
    url: `${site}${landingPagePath(page)}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: page.kind === 'area' ? 0.8 : 0.85,
  }));

  // Dedupe by URL
  const map = new Map<string, MetadataRoute.Sitemap[0]>();
  for (const e of [...staticEntries, ...landingEntries]) {
    map.set(e.url, e);
  }
  return [...map.values()];
}
