import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = resolve(scriptDirectory, '../..');
const supportedSources = new Set(['supabase', 'payload', 'directus']);
const sensitiveKey = /(?:secret|token|password|credential|api[_-]?key|service.*key|key$)/i;
const safeEntityName = /^[a-z][a-z0-9_-]{0,63}$/;

export const sanitizedReportDataSensitivity = Object.freeze({
  sourceClassification: 'restricted-personal-data',
  reportClassification: 'internal-opaque-metadata',
  rawRecordsIncluded: false,
  personalDataIncluded: false,
});

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** Stable, opaque identifier: no legacy value is emitted in a report. */
export function canonicalId(source, entity, sourceId) {
  return `mig_${source}_${entity}_${sha256(String(sourceId)).slice(0, 24)}`;
}

export function checksum(canonicalIds) {
  return `sha256:${sha256([...canonicalIds].sort().join('\n'))}`;
}

export function canonicalJson(value, seen = new Set()) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Canonical migration content cannot contain a non-finite number.');
    return Object.is(value, -0) ? '0' : JSON.stringify(value);
  }
  if (typeof value !== 'object') throw new Error(`Canonical migration content cannot contain ${typeof value}.`);
  if (seen.has(value)) throw new Error('Canonical migration content cannot contain a cycle.');
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item, seen)).join(',')}]`;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('Canonical migration content must use plain objects and arrays.');
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key], seen)}`).join(',')}}`;
  } finally {
    seen.delete(value);
  }
}

export function contentChecksum(value) {
  return `sha256:${sha256(canonicalJson(value))}`;
}

function safeMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s]+/gi, '[redacted-url]')
    .replace(/\+?\d[\d(). -]{7,}\d/g, '[redacted-phone]');
}

function assertNoCredentials(value, path = 'sourceConfig') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKey.test(key) && child) {
      throw new Error(`${path}.${key} is not allowed. Inventory accepts offline snapshots only.`);
    }
    assertNoCredentials(child, `${path}.${key}`);
  }
}

function readJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

export function readSourceConfig(configPath) {
  if (!configPath) throw new Error('A --source-config JSON file is required.');
  if (!existsSync(configPath)) throw new Error('The explicit source config file was not found.');
  const config = readJson(configPath, 'Source config');
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Source config must be a JSON object.');
  }
  if (!supportedSources.has(config.source)) {
    throw new Error('Source config.source must be one of supabase, payload, or directus.');
  }
  assertNoCredentials(config);
  return config;
}

function sourceSchema(root, source) {
  const redirectConfig = join(root, 'vercel.json');
  const redirects = existsSync(redirectConfig)
    ? (readJson(redirectConfig, 'vercel.json').redirects ?? []).map(({ source: from, destination: to, permanent }) => ({ from, to, permanent: Boolean(permanent) }))
    : [];

  if (source === 'supabase') {
    const migrationDir = join(root, 'supabase', 'migrations');
    const files = existsSync(migrationDir)
      ? readdirSync(migrationDir).filter((name) => extname(name) === '.sql').sort()
      : [];
    const tables = new Set();
    const buckets = new Set();
    for (const file of files) {
      const sql = readFileSync(join(migrationDir, file), 'utf8');
      for (const match of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)/gi)) tables.add(match[1]);
      for (const match of sql.matchAll(/(?:insert\s+into\s+storage\.buckets[\s\S]{0,500}?values\s*\(\s*'|name\s*=\s*')([a-z0-9_-]+)/gi)) buckets.add(match[1]);
    }
    return {
      schemaArtifacts: { migrations: files, tables: [...tables].sort() },
      mediaCapabilities: { storageBuckets: [...buckets].sort(), liveInventory: 'blocked-without-offline-snapshot' },
      draftCapabilities: { status: 'unknown-from-migrations', liveInventory: 'blocked-without-offline-snapshot' },
      redirectCapabilities: { redirects },
    };
  }

  if (source === 'payload') {
    const collectionDir = join(root, 'src', 'collections', 'payload');
    const collectionFiles = walkFiles(collectionDir).filter((file) => /\.(?:ts|tsx)$/.test(file));
    const collections = collectionFiles.map((file) => {
      const text = readFileSync(join(collectionDir, file), 'utf8');
      const slug = text.match(/slug:\s*['\"]([^'\"]+)['\"]/i)?.[1] ?? file.replace(/\\/g, '/').replace(/\.(?:ts|tsx)$/, '');
      return { slug, draftCapable: /drafts:\s*true/i.test(text), uploadCapable: /upload:\s*\{/i.test(text) };
    }).sort((a, b) => a.slug.localeCompare(b.slug));
    return {
      schemaArtifacts: { collections, config: 'src/payload.config.ts', migrationDir: 'migrations/payload' },
      mediaCapabilities: { uploadCollections: collections.filter((item) => item.uploadCapable).map((item) => item.slug), adapter: 's3-configured-at-runtime', liveInventory: 'blocked-without-offline-snapshot' },
      draftCapabilities: { collections: collections.filter((item) => item.draftCapable).map((item) => item.slug), liveInventory: 'blocked-without-offline-snapshot' },
      redirectCapabilities: { redirects },
    };
  }

  const schemaPath = join(root, 'directus', 'schema', 'collections.json');
  const schema = existsSync(schemaPath) ? readJson(schemaPath, 'Directus schema') : { collections: [] };
  const collections = (schema.collections ?? []).map((collection) => {
    const fields = collection.fields ?? [];
    const statuses = fields.find((field) => field.field === 'status')?.meta?.options?.choices?.map((choice) => choice.value) ?? [];
    const mediaFields = fields.filter((field) => field.type === 'uuid' || /file/i.test(field.meta?.interface ?? '')).map((field) => field.field);
    return { name: collection.collection, singleton: Boolean(collection.meta?.singleton), statuses, mediaFields };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return {
    schemaArtifacts: { collections, schema: 'directus/schema/collections.json' },
    mediaCapabilities: { collections: collections.filter((item) => item.mediaFields.length > 0).map((item) => ({ name: item.name, fields: item.mediaFields })), liveInventory: 'blocked-without-offline-snapshot' },
    draftCapabilities: { collections: collections.filter((item) => item.statuses.includes('draft')).map((item) => item.name), liveInventory: 'blocked-without-offline-snapshot' },
    redirectCapabilities: { redirects },
  };
}

function walkFiles(directory, relative = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const absolute = join(directory, entry);
    const child = join(relative, entry);
    return statSync(absolute).isDirectory() ? walkFiles(absolute, child) : [child];
  });
}

function normalizeSnapshot(snapshot, source) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Snapshot must be a JSON object.');
  if (snapshot.source && snapshot.source !== source) throw new Error('Snapshot source does not match source config.source.');
  const rawEntities = snapshot.entities ?? snapshot.collections ?? {};
  const entities = Array.isArray(rawEntities)
    ? rawEntities.map((entity) => [entity.name ?? entity.entity, entity.records])
    : Object.entries(rawEntities);
  return entities.map(([entity, records]) => {
    if (!safeEntityName.test(String(entity)) || !Array.isArray(records)) {
      throw new Error('Every snapshot entity must have a safe collection name and records array.');
    }
    const canonicalIds = [];
    const duplicates = [];
    const retryCandidates = [];
    const seen = new Set();
    for (const record of records) {
      const id = record?.id ?? record?._id ?? record?.legacyId;
      if (id === undefined || id === null || id === '') {
        retryCandidates.push({ reason: 'missing-stable-source-id' });
        continue;
      }
      const idValue = canonicalId(source, entity, id);
      if (seen.has(idValue)) duplicates.push({ canonicalId: idValue, reason: 'duplicate-source-id' });
      else seen.add(idValue);
      canonicalIds.push(idValue);
      if (record?.migrationState === 'retry' || record?.migrationStatus === 'retry') retryCandidates.push({ canonicalId: idValue, reason: 'source-marked-retry' });
    }
    return { entity, sourceRecordCount: records.length, canonicalIds: [...seen].sort(), duplicateRecords: duplicates, retryCandidates };
  });
}

function reportEntities(entities) {
  return entities.map((entity) => ({
    entity: entity.entity,
    sourceRecordCount: entity.sourceRecordCount,
    uniqueCanonicalCount: entity.canonicalIds.length,
    canonicalIds: entity.canonicalIds,
    checksum: checksum(entity.canonicalIds),
    duplicateRecords: entity.duplicateRecords,
    retryCandidates: entity.retryCandidates,
  }));
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'dry-run') args.dryRun = true;
    else args[key] = argv[++index];
  }
  return args;
}

function writeNewJson(filePath, value) {
  if (!filePath) throw new Error('An --out report path is required.');
  if (existsSync(filePath)) throw new Error('Refusing to overwrite an existing report. Choose a new --out path.');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}

export function createInventoryReport({ sourceConfigPath, root = repositoryRoot, now = new Date().toISOString() }) {
  const config = readSourceConfig(sourceConfigPath);
  const report = {
    version: 1,
    kind: 'legacy-inventory',
    source: config.source,
    mode: 'offline-read-only',
    dryRun: true,
    generatedAt: now,
    access: { liveNetworkAttempted: false, credentialsAccepted: false, status: 'blocked-until-authorized-offline-snapshot-is-provided' },
    dataSensitivity: sanitizedReportDataSensitivity,
    capabilities: sourceSchema(root, config.source),
    entities: [],
    blockedEvidence: [],
  };
  if (!config.snapshotPath) {
    report.blockedEvidence.push({ capability: 'live-schema-data-media-drafts-export', reason: 'No explicit offline snapshotPath was supplied; live credentials and network export are intentionally unsupported.' });
    return report;
  }
  const snapshotPath = resolve(dirname(sourceConfigPath), config.snapshotPath);
  if (!existsSync(snapshotPath)) {
    report.blockedEvidence.push({ capability: 'offline-snapshot-export', reason: 'Explicit snapshotPath was not found.' });
    return report;
  }
  const entities = normalizeSnapshot(readJson(snapshotPath, 'Snapshot'), config.source);
  report.entities = reportEntities(entities);
  report.access.status = 'offline-snapshot-summarized';
  return report;
}

export function runInventoryCli(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv);
  if (!args.dryRun) throw new Error('--dry-run is required; this tool never performs a live export.');
  const report = createInventoryReport({ sourceConfigPath: args['source-config'], root: options.root ?? repositoryRoot });
  if (options.expectedSources && !options.expectedSources.includes(report.source)) {
    throw new Error(`This inventory runner only accepts: ${options.expectedSources.join(', ')}.`);
  }
  writeNewJson(args.out, report);
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = runInventoryCli();
    console.log(JSON.stringify({ ok: true, source: report.source, entities: report.entities.length, status: report.access.status }));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: safeMessage(error) }));
    process.exitCode = 1;
  }
}
