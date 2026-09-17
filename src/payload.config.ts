import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { randomBytes } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';

import { Admins } from './collections/payload/Admins';
import { Services } from './collections/payload/Services';
import { ServiceAreas } from './collections/payload/ServiceAreas';
import { Portfolio } from './collections/payload/Portfolio';
import { Testimonials } from './collections/payload/Testimonials';
import { FAQs } from './collections/payload/FAQs';
import { Media } from './collections/payload/Media';
import { Leads } from './collections/payload/crm/Leads';
import { CrmTasks } from './collections/payload/crm/CrmTasks';
import { SiteSettings } from './globals/payload/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const payloadSecret = process.env.PAYLOAD_SECRET;

// Build-time guard: `next build` statically collects route data and must import
// this module even when PAYLOAD_SECRET is absent from the build environment
// (e.g. Vercel preview). Do not fail the build for that — defer the hard
// requirement to runtime, where the real secret is actually needed and a missing
// one fails loudly below.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

// Random per-build secret when PAYLOAD_SECRET is absent during `next build`.
// Unlike a hardcoded constant, a random value has no forgery value if it ever
// leaks into a runtime environment (admin auth tokens, cookie signatures, and
// Payload's field-encryption keys all derive from `secret`).
const secret = payloadSecret ?? (isBuildPhase ? randomBytes(32).toString('hex') : undefined);

if (!secret) {
  throw new Error('PAYLOAD_SECRET is required. Set it to a strong, unique value before starting Payload.');
}

if (!payloadSecret) {
  console.warn(
    '[payload] PAYLOAD_SECRET is not set during `next build` — continuing with a build-only random secret. ' +
      'Set PAYLOAD_SECRET in the environment before deploying; the app will fail at runtime without it.'
  );
}

const supabaseCa = process.env.SUPABASE_DB_CA?.replace(/\\n/g, '\n');

const rawDbUrl = process.env.SUPABASE_DB_URL;

// node-postgres merges parsed connection-string params OVER explicit pool
// options (`Object.assign({}, config, parse(connectionString))`), so an
// `?sslmode=...` (or sslcert/sslkey/sslrootcert) in SUPABASE_DB_URL would
// silently replace the verified-TLS config below. Strip every ssl* query param
// first — the pool's `ssl` object stays the single source of truth for TLS.
function stripSslParams(connectionString: string): string {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    return connectionString; // malformed — let pg surface the real error
  }
  const stripped: string[] = [];
  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('ssl')) {
      stripped.push(key);
      parsed.searchParams.delete(key);
    }
  }
  if (stripped.length > 0) {
    console.warn(
      `[payload] stripped ssl query parameter(s) (${stripped.join(', ')}) from SUPABASE_DB_URL — ` +
        'verified TLS is enforced by the pool config instead.'
    );
  }
  return parsed.toString();
}

// Verified TLS applies to the Supabase pooler only. The localhost placeholder is
// a plain-TCP local dev fallback — demanding verified TLS there would break
// every standard local Postgres install.
const pool: { connectionString: string; ssl?: { rejectUnauthorized: boolean; ca?: string } } = {
  connectionString: rawDbUrl ? stripSslParams(rawDbUrl) : 'postgres://localhost:5432/payload_placeholder',
};
if (rawDbUrl) {
  // Supabase pooler connections use TLS with full CA and hostname verification.
  // SUPABASE_DB_CA may contain the project's CA PEM when it is not in Node's trust store.
  pool.ssl = {
    rejectUnauthorized: true,
    ...(supabaseCa ? { ca: supabaseCa } : {}),
  };
}

export default buildConfig({
  admin: {
    user: 'admins',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 390, height: 844 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
    meta: {
      titleSuffix: "— Sky's the Limit Admin",
    },
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    // `pool` is built above: verified TLS on the Supabase pooler, plain-TCP
    // localhost fallback for local dev.
    pool,
    // Dedicated schema — never touches the existing public CRM/content tables
    schemaName: 'payload',
    // Use migrations in production, never push
    push: false,
    migrationDir: path.resolve(dirname, '../migrations/payload'),
  }),

  collections: [
    Admins,
    Services,
    ServiceAreas,
    Portfolio,
    Testimonials,
    FAQs,
    Media,
    // CRM — read existing public.* tables via payload-schema updatable views
    Leads,
    CrmTasks,
  ],

  globals: [SiteSettings],

  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET ?? '',
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        region: process.env.S3_REGION ?? 'us-east-1',
      },
    }),
  ],

  // `secret` is resolved above: the real PAYLOAD_SECRET at runtime, or a
  // random per-build value during `next build` (any runtime load without the
  // secret throws before reaching this).
  secret,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  graphQL: {
    disable: false,
  },
});
