import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const configUrl = new URL('../src/payload.config.ts', import.meta.url).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.startsWith(configUrl) && !specifier.startsWith('node:') && !['path', 'url'].includes(specifier)) {
      return { url: `mock:${encodeURIComponent(specifier)}`, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.startsWith('mock:')) return nextLoad(url, context);
    const name = decodeURIComponent(url.slice(5));
    const exports = {
      payload: 'export const buildConfig = value => value;',
      '@payloadcms/db-postgres': 'export const postgresAdapter = value => value;',
      '@payloadcms/storage-s3': 'export const s3Storage = value => value;',
      '@payloadcms/richtext-lexical': 'export const lexicalEditor = () => ({});',
    };
    const source = exports[name] ?? `export const ${name.split('/').at(-1)} = {};`;
    return { format: 'module', source, shortCircuit: true };
  },
});

test('Payload config does not throw during `next build` without PAYLOAD_SECRET', async () => {
  const previous = {
    secret: process.env.PAYLOAD_SECRET,
    phase: process.env.NEXT_PHASE,
  };
  delete process.env.PAYLOAD_SECRET;
  process.env.NEXT_PHASE = 'phase-production-build';

  try {
    const config = (await import(`${configUrl}?build-phase-no-secret`)).default;
    assert.equal(config.secret, 'build-time-placeholder-secret-do-not-deploy');
  } finally {
    if (previous.secret === undefined) delete process.env.PAYLOAD_SECRET;
    else process.env.PAYLOAD_SECRET = previous.secret;
    if (previous.phase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = previous.phase;
  }
});

test('Payload config still fails loudly at runtime without PAYLOAD_SECRET', async () => {
  const previous = {
    secret: process.env.PAYLOAD_SECRET,
    phase: process.env.NEXT_PHASE,
  };
  delete process.env.PAYLOAD_SECRET;
  // Simulate the runtime server process (e.g. `next start`): not a build phase.
  process.env.NEXT_PHASE = 'phase-production-server';

  try {
    await assert.rejects(
      import(`${configUrl}?runtime-phase-no-secret`),
      /PAYLOAD_SECRET is required\. Set it to a strong, unique value before starting Payload\./,
    );
  } finally {
    if (previous.secret === undefined) delete process.env.PAYLOAD_SECRET;
    else process.env.PAYLOAD_SECRET = previous.secret;
    if (previous.phase === undefined) delete process.env.NEXT_PHASE;
    else process.env.NEXT_PHASE = previous.phase;
  }
});

test('Payload config fails fast when PAYLOAD_SECRET is missing', async () => {
  const previousSecret = process.env.PAYLOAD_SECRET;
  delete process.env.PAYLOAD_SECRET;

  try {
    await assert.rejects(
      import(`${configUrl}?missing-secret`),
      /PAYLOAD_SECRET is required\. Set it to a strong, unique value before starting Payload\./,
    );
  } finally {
    if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET;
    else process.env.PAYLOAD_SECRET = previousSecret;
  }
});

test('Payload config enables verified TLS for the Postgres pool', async () => {
  const previous = {
    secret: process.env.PAYLOAD_SECRET,
    ca: process.env.SUPABASE_DB_CA,
    url: process.env.SUPABASE_DB_URL,
  };
  process.env.PAYLOAD_SECRET = 'smoke-test-secret';
  process.env.SUPABASE_DB_CA = 'test-ca-line-1\\ntest-ca-line-2';
  process.env.SUPABASE_DB_URL = 'postgresql://user:password@example.supabase.com:6543/postgres';

  try {
    const config = (await import(`${configUrl}?verified-tls`)).default;
    assert.equal(config.secret, 'smoke-test-secret');
    assert.deepEqual(config.db.pool.ssl, {
      rejectUnauthorized: true,
      ca: 'test-ca-line-1\ntest-ca-line-2',
    });
  } finally {
    for (const [name, value] of Object.entries({
      PAYLOAD_SECRET: previous.secret,
      SUPABASE_DB_CA: previous.ca,
      SUPABASE_DB_URL: previous.url,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
