import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '../lib/site';

const site = CANONICAL_ORIGIN;

/**
 * App Router robots — prefer this over a stale public/robots.txt when Next serves it.
 * Keep AI crawlers allowed; block only non-public utility routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/review'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/', '/review'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/', '/review'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/', '/review'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/', '/review'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt'],
        disallow: ['/admin', '/api/', '/review'],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
