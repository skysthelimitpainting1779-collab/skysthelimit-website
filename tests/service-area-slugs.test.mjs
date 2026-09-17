// Unit tests for the DB-aware service-area slug source used by
// internal-links.test.mjs. The Supabase client is always mocked: no real
// network access happens in unit tests.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { afterEach, beforeEach, test } from 'node:test';

import { getServiceAreaSlugs } from './helpers/service-area-slugs.mjs';

const ENV_URL = 'NEXT_PUBLIC_SUPABASE_URL';
const ENV_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
const staticPages = [{ slug: 'minneapolis' }, { slug: 'st-paul' }];

let savedEnv;
let warnings;
let originalWarn;

beforeEach(() => {
  savedEnv = { [ENV_URL]: process.env[ENV_URL], [ENV_KEY]: process.env[ENV_KEY] };
  warnings = [];
  originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
});

afterEach(() => {
  if (savedEnv[ENV_URL] === undefined) delete process.env[ENV_URL];
  else process.env[ENV_URL] = savedEnv[ENV_URL];
  if (savedEnv[ENV_KEY] === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = savedEnv[ENV_KEY];
  console.warn = originalWarn;
});

function mockCreateClient({ slugs = [], error = null } = {}) {
  const calls = [];
  const createClient = (url, key) => {
    calls.push({ url, key });
    return {
      from(table) {
        assert.equal(table, 'service_areas');
        return {
          async select(column) {
            assert.equal(column, 'slug');
            return { data: slugs.map((slug) => ({ slug })), error };
          },
        };
      },
    };
  };
  return { createClient, calls };
}

test('unions DB-only slugs with the static list when credentials are present', async () => {
  process.env[ENV_URL] = 'https://example.supabase.co';
  process.env[ENV_KEY] = 'anon-key';
  const { createClient, calls } = mockCreateClient({ slugs: ['db-only-area'] });

  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages, { createClient });

  assert.equal(dbAware, true);
  assert.ok(slugs.has('minneapolis'), 'static slug retained');
  assert.ok(slugs.has('st-paul'), 'static slug retained');
  assert.ok(slugs.has('db-only-area'), 'DB-only slug is valid for validation');
  assert.ok(!slugs.has('totally-unknown-slug'), 'unknown slugs still fail');
  assert.deepEqual(warnings, [], 'no degradation warning when the DB check runs');
  assert.deepEqual(calls, [{ url: 'https://example.supabase.co', key: 'anon-key' }]);
});

test('a DB-only slug resolves against the real route module', async () => {
  process.env[ENV_URL] = 'https://example.supabase.co';
  process.env[ENV_KEY] = 'anon-key';
  const { createClient } = mockCreateClient({ slugs: ['db-only-area'] });

  const { slugs } = await getServiceAreaSlugs(staticPages, { createClient });

  assert.ok(
    existsSync(new URL('../src/app/service-areas/[slug]/page.tsx', import.meta.url)),
    'route module must exist for the DB-only slug to resolve',
  );
  assert.ok(slugs.has('db-only-area'), 'DB-only slug is in the validated slug set');
});

test('fails loud with a named warning when credentials are absent', async () => {
  delete process.env[ENV_URL];
  delete process.env[ENV_KEY];
  const { createClient, calls } = mockCreateClient({ slugs: ['db-only-area'] });

  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages, { createClient });

  assert.equal(dbAware, false);
  assert.deepEqual(calls, [], 'DB client never constructed without credentials');
  assert.ok(slugs.has('minneapolis') && slugs.has('st-paul'), 'static list still validated');
  assert.ok(!slugs.has('db-only-area'), 'no DB slugs without credentials');
  assert.equal(warnings.length, 1, 'exactly one loud degradation warning');
  const warning = warnings[0];
  assert.match(warning, /\[internal-links\] service-areas slug validation/);
  assert.match(warning, /DEGRADED/);
  assert.match(warning, /service_areas/);
  assert.match(warning, /NEXT_PUBLIC_SUPABASE_URL/);
});

test('degrades to the static list with a warning when the DB query fails', async () => {
  process.env[ENV_URL] = 'https://example.supabase.co';
  process.env[ENV_KEY] = 'anon-key';
  const { createClient } = mockCreateClient({ error: new Error('network down') });

  const { slugs, dbAware } = await getServiceAreaSlugs(staticPages, { createClient });

  assert.equal(dbAware, false);
  assert.ok(slugs.has('minneapolis') && slugs.has('st-paul'), 'static list still validated');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /\[internal-links\] service-areas slug validation/);
  assert.match(warnings[0], /DEGRADED/);
});
