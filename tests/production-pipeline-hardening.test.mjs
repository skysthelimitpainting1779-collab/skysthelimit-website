import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('projects public content never initializes the cookie-backed auth client', () => {
  const projects = read('src/views/Projects.tsx');

  assert.doesNotMatch(projects, /lib\/supabase\/server/);
  assert.match(projects, /lib\/supabase\/public/);
  assert.ok(exists('src/lib/supabase/public.ts'), 'public Supabase client helper must exist');
});

test('public Supabase helper stays inert when deployment variables are absent', async () => {
  assert.ok(exists('src/lib/supabase/public.ts'), 'public Supabase client helper must exist');
  const { createPublicClient, hasPublicSupabaseConfig } = await import('../src/lib/supabase/public.ts');

  assert.equal(hasPublicSupabaseConfig({}), false);
  assert.equal(createPublicClient({}), null);
  assert.equal(
    hasPublicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    }),
    true,
  );
});

test('unconfigured Directus reads return fallback content without warning or network work', async () => {
  const previousPublicUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  const previousServerUrl = process.env.DIRECTUS_URL;
  delete process.env.NEXT_PUBLIC_DIRECTUS_URL;
  delete process.env.DIRECTUS_URL;

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);

  try {
    const { getCaseStudies } = await import('../src/lib/directus/client.ts');
    assert.deepEqual(await getCaseStudies(), []);
    assert.deepEqual(warnings, []);
  } finally {
    console.warn = originalWarn;
    if (previousPublicUrl === undefined) delete process.env.NEXT_PUBLIC_DIRECTUS_URL;
    else process.env.NEXT_PUBLIC_DIRECTUS_URL = previousPublicUrl;
    if (previousServerUrl === undefined) delete process.env.DIRECTUS_URL;
    else process.env.DIRECTUS_URL = previousServerUrl;
  }
});

test('site smoke runner proves critical routes and reports the exact failed route', async () => {
  assert.ok(exists('scripts/smoke-site.mjs'), 'production smoke runner must exist');
  const { checkSite } = await import('../scripts/smoke-site.mjs');

  const healthyFetch = async (url) => {
    const body = url.pathname === '/projects' ? 'Recent Work' : "Sky's the Limit Painting";
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  };

  const results = await checkSite({
    baseUrl: 'https://example.com',
    routes: [
      { path: '/', contains: "Sky's the Limit Painting" },
      { path: '/projects', contains: 'Recent Work' },
    ],
    fetchImpl: healthyFetch,
  });

  assert.equal(results.length, 2);
  assert.equal(results.every(({ ok }) => ok), true);

  await assert.rejects(
    checkSite({
      baseUrl: 'https://example.com',
      routes: [{ path: '/contact' }],
      fetchImpl: async () => new Response('broken', { status: 503 }),
    }),
    /\/contact.*503/,
  );
});

test('site smoke runner forwards Vercel automation headers without replacing defaults', async () => {
  const { checkSite } = await import('../scripts/smoke-site.mjs');
  let requestHeaders;

  await checkSite({
    baseUrl: 'https://example.com',
    routes: [{ path: '/' }],
    headers: {
      'x-vercel-protection-bypass': 'secret-value',
      'x-vercel-set-bypass-cookie': 'true',
    },
    fetchImpl: async (_url, options) => {
      requestHeaders = options.headers;
      return new Response('ok', { status: 200 });
    },
  });

  assert.equal(requestHeaders.accept, '*/*');
  assert.equal(requestHeaders['user-agent'], 'skys-the-limit-production-smoke/1.0');
  assert.equal(requestHeaders['x-vercel-protection-bypass'], 'secret-value');
  assert.equal(requestHeaders['x-vercel-set-bypass-cookie'], 'true');
});
