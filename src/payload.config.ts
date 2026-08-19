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
import { requireEnvironmentVariable } from './lib/config/required-env';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const payloadSecret = requireEnvironmentVariable('PAYLOAD_SECRET');
const supabaseDatabaseUrl = requireEnvironmentVariable('SUPABASE_DB_URL');
const s3Bucket = requireEnvironmentVariable('S3_BUCKET');
const s3AccessKeyId = requireEnvironmentVariable('S3_ACCESS_KEY_ID');
const s3SecretAccessKey = requireEnvironmentVariable('S3_SECRET_ACCESS_KEY');
const s3Region = requireEnvironmentVariable('S3_REGION');

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
      // Direct Postgres connection (not the anon REST API).
      connectionString: supabaseDatabaseUrl,
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
      bucket: s3Bucket,
      config: {
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        region: s3Region,
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
