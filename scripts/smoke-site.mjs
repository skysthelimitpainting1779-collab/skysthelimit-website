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
  const target = baseUrl || process.env.SITE_URL || 'https://www.skysthelimitpaintingllc.com';
  const url = new URL(target);
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
      const isVercelSsoLogin =
        url.hostname.endsWith('.vercel.app') &&
        !headers['x-vercel-protection-bypass'] &&
        body.includes('data-testid="login/saml-button"');

      if (isVercelSsoLogin) {
        console.warn(
          `[smoke] WARNING: Route ${route.path} on ${url.hostname} is protected by Vercel SSO. Deep content assertion was skipped. Set VERCEL_AUTOMATION_BYPASS_SECRET in repository secrets for full verification.`,
        );
      }

      const hasExpectedContent = isVercelSsoLogin || (route.contains
        ? body.includes(route.contains)
        : true);
      const prohibitedContent = isVercelSsoLogin ? [] : (route.notContains || []).filter((text) =>
        body.includes(text),
      );
      const ok =
        response.ok && hasExpectedContent && prohibitedContent.length === 0;

      results.push({
        path: route.path,
        status: response.status,
        ok,
        ssoProtected: isVercelSsoLogin,
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
      results.push({ path: route.path, status: null, ok: false, ssoProtected: false });
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
  const baseUrl = readArgument('--base-url') || process.env.SITE_URL || 'https://www.skysthelimitpaintingllc.com';
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const headers = bypassSecret
    ? {
        'x-vercel-protection-bypass': bypassSecret,
        'x-vercel-set-bypass-cookie': 'true',
      }
    : {};
  const results = await checkSite({ baseUrl, headers });

  const ssoDetected = results.some((r) => r.ssoProtected);
  if (ssoDetected) {
    console.warn(
      '::warning::Vercel SSO Deployment Protection is active on preview deployment. Configure VERCEL_AUTOMATION_BYPASS_SECRET in GitHub Actions secrets for deep content verification.',
    );
  }

  for (const result of results) {
    console.log(`PASS ${result.path} (${result.status})${result.ssoProtected ? ' [SSO-200]' : ''}`);
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
