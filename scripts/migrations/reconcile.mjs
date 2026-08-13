import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { checksum, contentChecksum, sanitizedReportDataSensitivity } from './inventory.mjs';

function readJson(path, label) {
  if (!path || !existsSync(path)) throw new Error(`${label} is required and must exist.`);
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { throw new Error(`${label} must be valid JSON.`); }
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

function entityMap(report) {
  return new Map(report.entities.map((entity) => [entity.entity, entity]));
}

const opaqueCanonicalId = /^mig_[a-z0-9_-]+_[a-f0-9]{24}$/;
const safeEntityName = /^[a-z][a-z0-9_-]{0,63}$/;
const supportedReportSources = new Set(['supabase', 'payload', 'directus', 'convex']);

function requireSafeEntityName(value, label) {
  if (typeof value !== 'string' || !safeEntityName.test(value)) {
    throw new Error(`${label} must use a safe entity name.`);
  }
  return value;
}

function opaqueIds(entity, label) {
  const ids = entity.canonicalIds ?? [];
  if (!Array.isArray(ids) || ids.some((id) => !opaqueCanonicalId.test(id))) {
    throw new Error(`${label} contains a non-opaque canonical ID; refusing to copy possible PII into a report.`);
  }
  return ids;
}

function safeExceptions(exceptions, label) {
  if (!Array.isArray(exceptions)) return [];
  return exceptions.map((exception) => {
    if (!exception?.canonicalId) return { reason: 'missing-stable-source-id' };
    if (!opaqueCanonicalId.test(exception.canonicalId)) {
      throw new Error(`${label} contains a non-opaque canonical ID; refusing to copy possible PII into a report.`);
    }
    return { canonicalId: exception.canonicalId, reason: /^[a-z-]{1,64}$/.test(exception.reason ?? '') ? exception.reason : 'unspecified' };
  });
}

function normalizeReport(report, label) {
  if (report?.kind === 'legacy-inventory' && Array.isArray(report.entities)) {
    if (!supportedReportSources.has(report.source)) throw new Error(`${label} contains an invalid source.`);
    return {
      ...report,
      entities: report.entities.map((entity) => ({
        ...entity,
        entity: requireSafeEntityName(entity?.entity, label),
      })),
    };
  }
  if (report?.kind === 'convex-target-inventory' && Array.isArray(report.entities)) {
    if (report.source !== 'convex') throw new Error(`${label} contains an invalid source.`);
    return {
      ...report,
      entities: report.entities.map((entity) => {
        const entityName = requireSafeEntityName(entity?.entity, label);
        const records = Array.isArray(entity.records) ? entity.records.map((record) => {
          if (!opaqueCanonicalId.test(record?.canonicalId)) throw new Error(`${label} contains a non-opaque canonical ID.`);
          if (!(record.checksum === null || /^sha256:[a-f0-9]{64}$/.test(record.checksum))) throw new Error(`${label} contains an invalid record checksum.`);
          if (!['verified', 'conflict'].includes(record.status)) throw new Error(`${label} contains an invalid record status.`);
          return record;
        }) : [];
        if (entity.checksum !== contentChecksum(records)) throw new Error(`${label} entity checksum mismatch.`);
        return {
          ...entity,
          entity: entityName,
          canonicalIds: opaqueIds(entity, label),
          records,
        };
      }),
    };
  }
  if (report?.kind === 'convex-import-handoff' && Array.isArray(report.operations)) {
    if (!['supabase', 'payload', 'directus'].includes(report.source)) throw new Error(`${label} contains an invalid source.`);
    const grouped = new Map();
    for (const item of report.operations) {
      const entity = item.operation?.entity;
      const canonicalId = item.operation?.canonicalId;
      if (!['contacts', 'properties', 'leads', 'opportunities'].includes(entity) || !opaqueCanonicalId.test(canonicalId)) {
        throw new Error(`${label} contains an invalid mapped operation.`);
      }
      if (item.sourceSystem !== report.source || item.sourceId !== canonicalId || !canonicalId.startsWith(`mig_${report.source}_`)) {
        throw new Error(`${label} contains inconsistent source provenance.`);
      }
      if (!/^sha256:[a-f0-9]{64}$/.test(item.checksum ?? '') || item.checksum !== contentChecksum(item.operation)) {
        throw new Error(`${label} contains an invalid operation checksum.`);
      }
      const target = grouped.get(entity) ?? { entity, canonicalIds: [], records: [], duplicateRecords: [], retryCandidates: [] };
      if (target.canonicalIds.includes(canonicalId)) target.duplicateRecords.push({ canonicalId, reason: 'duplicate-source-id' });
      else {
        target.canonicalIds.push(canonicalId);
        target.records.push({ canonicalId, checksum: item.checksum, status: 'verified' });
      }
      grouped.set(entity, target);
    }
    const aggregateChecksum = contentChecksum(report.operations);
    if (report.checksum !== aggregateChecksum) throw new Error(`${label} aggregate checksum mismatch.`);
    return { ...report, source: report.source, entities: [...grouped.values()] };
  }
  throw new Error(`${label} must be a legacy inventory, Convex import handoff, or Convex target inventory.`);
}

function recordMap(entity) {
  return new Map((entity?.records ?? []).map((record) => [record.canonicalId, record]));
}

export function reconcileReports(source, target, mapping = {}) {
  const normalizedSource = normalizeReport(source, 'Source report');
  const normalizedTarget = normalizeReport(target, 'Target report');
  const targets = entityMap(normalizedTarget);
  const entities = [];
  for (const sourceEntity of normalizedSource.entities) {
    const targetName = requireSafeEntityName(
      mapping[sourceEntity.entity] ?? sourceEntity.entity,
      'Reconciliation mapping target',
    );
    const targetEntity = targets.get(targetName);
    const sourceIds = new Set(opaqueIds(sourceEntity, 'Source report'));
    const targetIds = new Set(targetEntity ? opaqueIds(targetEntity, 'Target report') : []);
    const sourceRecords = recordMap(sourceEntity);
    const targetRecords = recordMap(targetEntity);
    const missingInTarget = [...sourceIds].filter((id) => !targetIds.has(id)).sort();
    const unexpectedInTarget = [...targetIds].filter((id) => !sourceIds.has(id)).sort();
    const duplicates = [...safeExceptions(sourceEntity.duplicateRecords, 'Source report'), ...safeExceptions(targetEntity?.duplicateRecords, 'Target report')];
    const retryCandidates = [...safeExceptions(sourceEntity.retryCandidates, 'Source report'), ...safeExceptions(targetEntity?.retryCandidates, 'Target report')];
    const checksumMismatches = [...sourceIds].flatMap((canonicalId) => {
      const sourceRecord = sourceRecords.get(canonicalId);
      const targetRecord = targetRecords.get(canonicalId);
      if (!sourceRecord || !targetRecord) return [];
      if (targetRecord.status !== 'verified' || sourceRecord.checksum !== targetRecord.checksum) {
        return [{ canonicalId, reason: targetRecord.status === 'verified' ? 'checksum-mismatch' : 'target-conflict' }];
      }
      return [];
    });
    const sourceChecksum = checksum(sourceIds);
    const targetChecksum = checksum(targetIds);
    entities.push({
      sourceEntity: sourceEntity.entity,
      targetEntity: targetName,
      sourceCount: sourceIds.size,
      targetCount: targetIds.size,
      sourceChecksum,
      targetChecksum,
      matched: Boolean(targetEntity) && sourceChecksum === targetChecksum && duplicates.length === 0 && retryCandidates.length === 0 && checksumMismatches.length === 0,
      missingInTarget,
      unexpectedInTarget,
      checksumMismatches,
      duplicateRecords: duplicates,
      retryCandidates,
      plannedActions: [
        ...missingInTarget.map((canonicalId) => ({ canonicalId, action: 'create-if-absent' })),
        ...checksumMismatches.map(({ canonicalId }) => ({ canonicalId, action: 'update-if-approved' })),
      ],
    });
  }
  return {
    version: 1,
    kind: 'migration-reconciliation',
    dryRun: true,
    source: normalizedSource.source,
    target: normalizedTarget.source,
    dataSensitivity: sanitizedReportDataSensitivity,
    entities,
    summary: {
      matchedEntities: entities.filter((entity) => entity.matched).length,
      conflictEntities: entities.filter((entity) => !entity.matched).length,
      duplicateRecords: entities.reduce((total, entity) => total + entity.duplicateRecords.length, 0),
      retryCandidates: entities.reduce((total, entity) => total + entity.retryCandidates.length, 0),
      checksumMismatches: entities.reduce((total, entity) => total + entity.checksumMismatches.length, 0),
    },
  };
}

function writeNewJson(filePath, value) {
  if (!filePath) throw new Error('An --out report path is required.');
  if (existsSync(filePath)) throw new Error('Refusing to overwrite an existing report. Choose a new --out path.');
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
}

export function runReconcileCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.dryRun) throw new Error('--dry-run is required; reconciliation never writes a target.');
  const mapping = args.mapping ? readJson(args.mapping, 'Mapping file') : {};
  const report = reconcileReports(readJson(args.source, 'Source report'), readJson(args.target, 'Target report'), mapping);
  writeNewJson(args.out, report);
  return report;
}

if (process.argv[1] && process.argv[1].endsWith('reconcile.mjs')) {
  try {
    const report = runReconcileCli();
    console.log(JSON.stringify({ ok: true, conflicts: report.summary.conflictEntities, retries: report.summary.retryCandidates }));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'migration reconciliation failed' }));
    process.exitCode = 1;
  }
}
