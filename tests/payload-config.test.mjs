import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const configUrl = new URL('../src/payload.config.ts', import.meta.url).href;

// Explicit mocks for every non-node import of payload.config.ts. Unknown
// imports fail fast here with a descriptive message instead of a guessed
// export name, so a new import in the config surfaces as a test-setup problem,
// not a misleading mock error.
const localModules = [
  './collections/payload/Admins',
  './collections/payload/Services',
  './collections/payload/ServiceAreas',
  './collections/payload/Portfolio',
  './collections/payload/Testimonials',
  './collections/payload/FAQs',
  './collections/payload/Media',
  './collections/payload/crm/Leads',
  './collections/payload/crm/CrmTasks',
  './globals/payload/SiteSettings',
];

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
    for (const local of localModules) {
      exports[local] = `export const ${local.split('/').at(-1)} = {};`;
    }
    const source = exports[name];
    if (!source) {
      throw new Error(
        `[payload-config test] no mock defined for import "${name}" from payload.config.ts — ` +
          'add an explicit entry to the exports map in tests/payload-config.test.mjs'
      );
    }
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
    // Random per-build secret: a string with no forgery value, never a
    // hardcoded public constant.
    assert.equal(typeof config.secret, 'string');
    assert.match(config.secret, /^[0-9a-f]{64}$/);
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

test('Payload config strips ssl query params so they cannot weaken verified TLS', async () => {
  const previous = {
    secret: process.env.PAYLOAD_SECRET,
    url: process.env.SUPABASE_DB_URL,
    ca: process.env.SUPABASE_DB_CA,
  };
  process.env.PAYLOAD_SECRET = 'smoke-test-secret';
  // Hermetic: an ambient SUPABASE_DB_CA would otherwise merge into pool.ssl
  // and break the deepEqual below.
  delete process.env.SUPABASE_DB_CA;
  // node-postgres merges parsed connection-string params over explicit pool
  // options, so ?sslmode=no-verify would otherwise replace the enforced
  // `ssl` object with { rejectUnauthorized: false }.
  process.env.SUPABASE_DB_URL = 'postgresql://user:password@example.supabase.com:6543/postgres?sslmode=no-verify';

  try {
    const config = (await import(`${configUrl}?ssl-params-stripped`)).default;
    assert.equal(config.db.pool.connectionString, 'postgresql://user:password@example.supabase.com:6543/postgres');
    assert.deepEqual(config.db.pool.ssl, { rejectUnauthorized: true });
  } finally {
    if (previous.secret === undefined) delete process.env.PAYLOAD_SECRET;
    else process.env.PAYLOAD_SECRET = previous.secret;
    if (previous.url === undefined) delete process.env.SUPABASE_DB_URL;
    else process.env.SUPABASE_DB_URL = previous.url;
    if (previous.ca === undefined) delete process.env.SUPABASE_DB_CA;
    else process.env.SUPABASE_DB_CA = previous.ca;
  }
});

test('Payload config does not demand TLS for the localhost fallback', async () => {
  const previous = {
    secret: process.env.PAYLOAD_SECRET,
    url: process.env.SUPABASE_DB_URL,
  };
  process.env.PAYLOAD_SECRET = 'smoke-test-secret';
  delete process.env.SUPABASE_DB_URL;

  try {
    const config = (await import(`${configUrl}?localhost-fallback`)).default;
    assert.equal(config.db.pool.connectionString, 'postgres://localhost:5432/payload_placeholder');
    // Local dev Postgres is plain TCP — demanding verified TLS here would
    // break every standard local install.
    assert.equal(config.db.pool.ssl, undefined);
  } finally {
    if (previous.secret === undefined) delete process.env.PAYLOAD_SECRET;
    else process.env.PAYLOAD_SECRET = previous.secret;
    if (previous.url === undefined) delete process.env.SUPABASE_DB_URL;
    else process.env.SUPABASE_DB_URL = previous.url;
  }
});
