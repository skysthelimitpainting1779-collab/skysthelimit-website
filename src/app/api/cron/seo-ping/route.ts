import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from '@/lib/api/utils';

const SITE_URL = process.env.SITE_URL || 'https://www.skysthelimitpaintingllc.com';

async function fetchCheck(url: string) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    return { url, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return { url, error: message };
  }
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const onVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

    if (cronSecret) {
      const authorization = request.headers.get('authorization');
      if (authorization !== `Bearer ${cronSecret}`) {
        return jsonError('Unauthorized', 401);
      }
    } else if (onVercel) {
      return jsonError('Unauthorized: endpoint requires CRON_SECRET', 401);
    }

    const checks = await Promise.all([
      fetchCheck(`${SITE_URL}/sitemap.xml`),
      fetchCheck(`${SITE_URL}/`),
    ]);

    return jsonOk({
      ranAt: new Date().toISOString(),
      secured: Boolean(cronSecret),
      checks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cron route error';
    console.error('[/api/cron/seo-ping GET]', message);
    return jsonError(message, 500);
  }
}
