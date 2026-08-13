import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { canonicalId, contentChecksum, readSourceConfig, repositoryRoot } from './inventory.mjs';

const supportedTargets = new Set(['contacts', 'properties', 'leads', 'opportunities']);
const safeField = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const statuses = {
  contacts: new Set(['active', 'archived']),
  properties: new Set(['active', 'archived']),
  leads: new Set(['new', 'qualified', 'converted', 'closed']),
  opportunities: new Set(['new', 'qualified', 'proposal', 'won', 'lost']),
};
const allowedFields = {
  contacts: new Set(['companyId', 'name', 'displayName', 'emailAddress', 'phoneNumber', 'status', 'createdAt', 'updatedAt']),
  properties: new Set(['companyId', 'name', 'status', 'createdAt', 'updatedAt']),
  leads: new Set(['companyId', 'source', 'status', 'idempotencyKey', 'submittedAt', 'updatedAt']),
  opportunities: new Set(['companyId', 'contactId', 'propertyId', 'projectId', 'name', 'stage', 'estimatedValueCents', 'amountCents', 'createdAt', 'updatedAt']),
};

function readJson(path, label) {
  if (!path || !existsSync(path)) throw new Error(`${label} is required and must exist.`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
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

function isWithin(root, path) {
  const child = relative(resolve(root), resolve(path));
  return child === '' || (!child.startsWith('..') && !isAbsolute(child));
}

function sourceEntities(snapshot) {
  const raw = snapshot.entities ?? snapshot.collections;
  if (!raw || typeof raw !== 'object') throw new Error('Snapshot must contain an entities or collections object.');
  if (Array.isArray(raw)) return raw.map((entity) => [entity.name ?? entity.entity, entity.records]);
  return Object.entries(raw);
}

function mappedValue(record, sourceField) {
  if (!safeField.test(sourceField)) throw new Error(`Unsafe source field mapping: ${sourceField}.`);
  return record[sourceField];
}

function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
}

function requireTimestamp(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a finite number.`);
}

function validatePayload(entity, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error(`${entity} payload must be an object.`);
  for (const key of Object.keys(payload)) {
    if (!allowedFields[entity].has(key)) throw new Error(`${entity}.${key} is not an allowed import field.`);
    if (payload[key] === undefined) delete payload[key];
  }
  requireString(payload.name ?? payload.source, `${entity}.name/source`);
  const state = entity === 'opportunities' ? payload.stage : payload.status;
  if (!statuses[entity].has(state)) throw new Error(`${entity} status/stage is invalid.`);
  if (entity === 'leads') {
    requireTimestamp(payload.submittedAt, 'leads.submittedAt');
  } else {
    requireTimestamp(payload.createdAt, `${entity}.createdAt`);
  }
  requireTimestamp(payload.updatedAt, `${entity}.updatedAt`);
  if ((entity === 'properties' || entity === 'opportunities')) requireString(payload.companyId, `${entity}.companyId`);
  for (const amount of ['estimatedValueCents', 'amountCents']) {
    if (payload[amount] !== undefined && (!Number.isSafeInteger(payload[amount]) || payload[amount] < 0)) {
      throw new Error(`${entity}.${amount} must be a non-negative safe integer.`);
    }
  }
  return payload;
}

function mapRecord(record, mapping) {
  const payload = { ...(mapping.defaults ?? {}) };
  for (const [targetField, sourceField] of Object.entries(mapping.fields ?? {})) {
    if (!allowedFields[mapping.target].has(targetField)) throw new Error(`${mapping.target}.${targetField} is not an allowed import field.`);
    payload[targetField] = mappedValue(record, sourceField);
  }
  return validatePayload(mapping.target, payload);
}

export function buildImportHandoff({ sourceConfigPath, now = new Date().toISOString() }) {
  const config = readSourceConfig(sourceConfigPath);
  requireString(config.runId, 'sourceConfig.runId');
  if (!config.snapshotPath) throw new Error('sourceConfig.snapshotPath is required for an import handoff.');
  const snapshot = readJson(resolve(dirname(sourceConfigPath), config.snapshotPath), 'Snapshot');
  if (snapshot.source && snapshot.source !== config.source) throw new Error('Snapshot source does not match sourceConfig.source.');
  const mappings = config.mappings;
  if (!mappings || typeof mappings !== 'object' || Array.isArray(mappings)) throw new Error('sourceConfig.mappings is required.');

  const operations = [];
  for (const [sourceEntity, records] of sourceEntities(snapshot)) {
    const mapping = mappings[sourceEntity];
    if (!mapping) continue;
    if (!supportedTargets.has(mapping.target)) throw new Error(`Unsupported import target: ${mapping.target}.`);
    if (!Array.isArray(records)) throw new Error(`${sourceEntity} records must be an array.`);
    const seen = new Set();
    for (const record of records) {
      const rawId = record?.id ?? record?._id ?? record?.legacyId;
      if (rawId === undefined || rawId === null || rawId === '') throw new Error(`${sourceEntity} contains a record without a stable source ID.`);
      const opaqueId = canonicalId(config.source, sourceEntity, rawId);
      if (seen.has(opaqueId)) throw new Error(`${sourceEntity} contains a duplicate stable source ID.`);
      seen.add(opaqueId);
      const operation = { entity: mapping.target, canonicalId: opaqueId, payload: mapRecord(record, mapping) };
      operations.push({
        runId: config.runId,
        sourceSystem: config.source,
        sourceId: opaqueId,
        checksum: contentChecksum(operation),
        operation,
      });
    }
  }
  operations.sort((left, right) => left.operation.canonicalId.localeCompare(right.operation.canonicalId));
  return {
    version: 1,
    kind: 'convex-import-handoff',
    mode: 'offline-no-target-write',
    generatedAt: now,
    runId: config.runId,
    source: config.source,
    operationCount: operations.length,
    checksum: contentChecksum(operations),
    operations,
  };
}

function writeSensitiveHandoff(path, handoff, root) {
  if (!path) throw new Error('An --out handoff path is required.');
  if (isWithin(root, path)) throw new Error('Import handoffs may contain private CRM data and must be written outside the repository.');
  if (existsSync(path)) throw new Error('Refusing to overwrite an existing handoff.');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(handoff, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
}

export function runPrepareImportCli(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv);
  if (!args.dryRun) throw new Error('--dry-run is required; this command only prepares an offline handoff.');
  const root = options.root ?? repositoryRoot;
  const handoff = buildImportHandoff({ sourceConfigPath: args['source-config'] });
  writeSensitiveHandoff(args.out, handoff, root);
  return handoff;
}

if (process.argv[1] && process.argv[1].endsWith('prepare-import.mjs')) {
  try {
    const handoff = runPrepareImportCli();
    console.log(JSON.stringify({ ok: true, operations: handoff.operationCount, checksum: handoff.checksum }));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'import handoff failed' }));
    process.exitCode = 1;
  }
}
