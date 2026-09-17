import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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

if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET is required. Set it to a strong, unique value before starting Payload.');
}

const supabaseCa = process.env.SUPABASE_DB_CA?.replace(/\\n/g, '\n');

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
    pool: {
      // Supabase pooler connections use TLS with full CA and hostname verification.
      // SUPABASE_DB_CA may contain the project's CA PEM when it is not in Node's trust store.
      connectionString: process.env.SUPABASE_DB_URL || 'postgres://localhost:5432/payload_placeholder',
      ssl: {
        rejectUnauthorized: true,
        ...(supabaseCa ? { ca: supabaseCa } : {}),
      },
    },
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

  secret: payloadSecret,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  graphQL: {
    disable: false,
  },
});
