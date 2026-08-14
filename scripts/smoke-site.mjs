<<<<<<< HEAD
import { pathToFileURL } from 'node:url';

export const DEFAULT_ROUTES = [
  {
    path: '/',
    contains: "Sky's the Limit Painting",
    notContains: ['SPEC CALIBRATOR', 'Heatmap: OFF'],
  },
  { path: '/estimate' },
  { path: '/contact' },
  { path: '/projects', contains: 'Real Surfaces.' },
  { path: '/robots.txt', contains: 'Sitemap:' },
  { path: '/sitemap.xml', contains: '<urlset' },
];

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    throw new Error('A site URL is required. Pass --base-url or set SITE_URL.');
  }

  const url = new URL(baseUrl);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

export async function checkSite({
  baseUrl,
  routes = DEFAULT_ROUTES,
  fetchImpl = globalThis.fetch,
  headers = {},
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required.');
  }

  const root = normalizeBaseUrl(baseUrl);
  const results = [];
  const failures = [];

  for (const route of routes) {
    const url = new URL(route.path, root);

    try {
      const response = await fetchImpl(url, {
        redirect: 'follow',
        cache: 'no-store',
        headers: {
          accept: '*/*',
          'user-agent': 'skys-the-limit-production-smoke/1.0',
          ...headers,
        },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      const hasExpectedContent = route.contains
        ? body.includes(route.contains)
        : true;
      const prohibitedContent = (route.notContains || []).filter((text) =>
        body.includes(text),
      );
      const ok =
        response.ok && hasExpectedContent && prohibitedContent.length === 0;

      results.push({
        path: route.path,
        status: response.status,
        ok,
      });

      if (!response.ok) {
        failures.push(`${route.path} returned HTTP ${response.status}`);
      } else if (!hasExpectedContent) {
        failures.push(`${route.path} did not contain ${JSON.stringify(route.contains)}`);
      } else if (prohibitedContent.length > 0) {
        failures.push(
          `${route.path} still contains retired internal UI: ${prohibitedContent.join(', ')}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ path: route.path, status: null, ok: false });
      failures.push(`${route.path} request failed: ${message}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Site smoke check failed:\n- ${failures.join('\n- ')}`);
  }

  return results;
}

function readArgument(name, args = process.argv.slice(2)) {
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];

  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const baseUrl = readArgument('--base-url') || process.env.SITE_URL;
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const headers = bypassSecret
    ? {
        'x-vercel-protection-bypass': bypassSecret,
        'x-vercel-set-bypass-cookie': 'true',
      }
    : {};
  const results = await checkSite({ baseUrl, headers });

  for (const result of results) {
    console.log(`PASS ${result.path} (${result.status})`);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
=======
#!/usr/bin/env node

/**
 * Production Site Smoke Test
 * Verifies live apex & www domains, key pages, and security headers.
 */

const TARGET_HOST = process.env.SMOKE_TARGET_URL || 'https://www.skysthelimitpaintingllc.com';

const ROUTES_TO_CHECK = [
  '/',
  '/about',
  '/residential',
  '/commercial',
  '/estimate',
  '/contact',
  '/robots.txt',
  '/sitemap.xml'
];

async function checkRoute(url) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SkysTheLimit-CI-SmokeTest/1.0'
      }
    });
    const elapsed = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    console.log(`[smoke] ${res.status} ${url} (${elapsed}ms)`);
    return { url, status: res.status, ok, elapsed };
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[smoke] FAIL ${url} (${elapsed}ms):`, err.message);
    return { url, status: 0, ok: false, error: err.message, elapsed };
  }
}

async function runSmokeTests() {
  console.log(`[smoke] Starting smoke test against ${TARGET_HOST}...`);
  let failures = 0;

  for (const route of ROUTES_TO_CHECK) {
    const fullUrl = new URL(route, TARGET_HOST).toString();
    const result = await checkRoute(fullUrl);
    if (!result.ok) failures++;
  }

  // Also check apex domain
  const apexUrl = 'https://skysthelimitpaintingllc.com/';
  const apexResult = await checkRoute(apexUrl);
  if (!apexResult.ok) failures++;

  if (failures > 0) {
    console.error(`[smoke] Smoke test FAILED with ${failures} error(s).`);
    process.exit(1);
  }

  console.log('[smoke] All production smoke checks PASSED successfully!');
}

runSmokeTests();
>>>>>>> 1342eee7 (feat(ci): automate end-to-end pipeline and factory fix-it engine)
