import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

/**
 * Next.js 16 frontier config.
 * Platform routing headers/redirects/crons live in vercel.json.
 * Payload admin is mounted at /admin via the (payload) route group.
 */
const nextConfig: NextConfig = {
  // Next.js 16 Cache Components / PPR
  cacheComponents: true,

  experimental: {
    // Keep build type-checking on the same bounded CLI path used by CI.
    useTypeScriptCli: true,
  },

  poweredByHeader: false,
  compress: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ouykfhoxlrkjgscdjjqg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8055',
        pathname: '/assets/**',
      },
      ...(process.env.S3_PUBLIC_HOSTNAME
        ? [{
            protocol: 'https' as const,
            hostname: process.env.S3_PUBLIC_HOSTNAME,
          }]
        : []),
    ],
  },
};

export default withPayload(nextConfig, {
  configPath: './src/payload.config.ts',
});
