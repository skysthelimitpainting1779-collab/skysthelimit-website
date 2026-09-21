import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

/**
 * Next.js 16 MAX config — frontier performance + security.
 * - Cache Components / PPR enabled
 * - Typed routes, optimized package imports
 * - Aggressive image + font optimization
 * Platform routing headers/redirects/crons live in vercel.json.
 * Payload admin is mounted at /admin via the (payload) route group.
 */
const nextConfig: NextConfig = {
  // Next.js 16 Cache Components / Partial Prerendering
  cacheComponents: true,

  // Typed routes for end-to-end type safety (Next 15.3+)
  // Disabled for max compatibility with dynamic hrefs (Link typed routes require RouteImpl).
  // Enable and fix all Link hrefs with `as Route` when ready.
  typedRoutes: false,

  // Strict mode validates double-render issues in dev
  reactStrictMode: true,

  poweredByHeader: false,
  compress: true,

  // Fail builds on type errors — max correctness
  typescript: {
    ignoreBuildErrors: false,
  },

  // Strip console.* in production except error/warn
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // Modern experimental frontier
  experimental: {
    // Tree-shake heavy icon/motion libs per-route
    optimizePackageImports: [
      'lucide-react',
      '@phosphor-icons/react',
      'motion',
      'date-fns',
      'lodash',
      '@base-ui/react',
    ],
    // Inline critical CSS for faster FCP
    inlineCss: true,
    // Stale-while-revalidate tuning — 0 for dynamic to keep admin fresh (Payload warning)
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
    // Optimize server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ouykfhoxlrkjgscdjjqg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8055',
        pathname: '/assets/**',
      },
      ...(process.env.S3_PUBLIC_HOSTNAME
        ? [
            {
              protocol: 'https' as const,
              hostname: process.env.S3_PUBLIC_HOSTNAME,
            },
          ]
        : []),
    ],
  },

  // Production source maps disabled for smaller bundles (enable for Sentry if needed)
  productionBrowserSourceMaps: false,

  // Logging for observability
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },

  // Headers fallback (primary headers live in vercel.json for edge)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, {
  configPath: './src/payload.config.ts',
});
