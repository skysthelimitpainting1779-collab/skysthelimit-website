import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { contentChecksum, repositoryRoot } from './inventory.mjs';

const entities = ['contacts', 'properties', 'leads', 'opportunities'];
const supportedSources = new Set(['supabase', 'payload', 'directus']);
const opaqueCanonicalId = /^mig_[a-z0-9_-]+_[a-f0-9]{24}$/;
const checksumPattern = /^sha256:[a-f0-9]{64}$/;
const deploymentPattern = /^[A-Za-z0-9][A-Za-z0-9_:/.-]{0,127}$/;
const sensitiveKey = /^(?:password|secret|token|credential|api[_-]?key|service[_-]?role[_-]?key|private[_-]?key|deploy[_-]?key)$/i;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (['dry-run', 'apply', 'export-target', 'allow-production'].includes(key)) args[key] = true;
    else args[key] = argv[++index];
  }
  return args;
}

function readJson(path, label) {
  if (!path || !existsSync(path)) throw new Error(`${label} is required and must exist.`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function assertNoSensitiveKeys(value, path = 'handoff') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (sensitiveKey.test(key) && child) throw new Error(`${path}.${key} may contain a credential and is not allowed.`);
    assertNoSensitiveKeys(child, `${path}.${key}`);
  }
}

export function validateHandoff(handoff) {
  if (handoff?.kind !== 'convex-import-handoff' || !Array.isArray(handoff.operations)) {
    throw new Error('Handoff must be a convex-import-handoff document.');
  }
  assertNoSensitiveKeys(handoff);
  if (typeof handoff.runId !== 'string' || !handoff.runId.trim()) throw new Error('Handoff runId is required.');
  if (!supportedSources.has(handoff.source)) throw new Error('Handoff source must be supabase, payload, or directus.');
  if (handoff.operationCount !== handoff.operations.length) throw new Error('Handoff operationCount does not match its operations.');
  const seen = new Set();
  for (const item of handoff.operations) {
    if (item.runId !== handoff.runId) throw new Error('Every operation must use the handoff runId.');
    if (item.sourceSystem !== handoff.source) throw new Error('Every operation sourceSystem must match handoff.source.');
    if (!entities.includes(item.operation?.entity)) throw new Error('Handoff contains an unsupported target entity.');
    if (!opaqueCanonicalId.test(item.sourceId) || !opaqueCanonicalId.test(item.operation?.canonicalId)) {
      throw new Error('Handoff contains a non-opaque migration ID.');
    }
    if (item.sourceId !== item.operation.canonicalId) throw new Error('Handoff source and canonical IDs must match.');
    const sourcePrefix = `mig_${handoff.source}_`;
    if (!item.sourceId.startsWith(sourcePrefix) || !item.operation.canonicalId.startsWith(sourcePrefix)) {
      throw new Error('Handoff opaque IDs are not bound to handoff.source.');
    }
    if (!checksumPattern.test(item.checksum) || item.checksum !== contentChecksum(item.operation)) {
      throw new Error('Handoff operation checksum mismatch.');
    }
    if (seen.has(item.operation.canonicalId)) throw new Error('Handoff contains a duplicate canonical ID.');
    seen.add(item.operation.canonicalId);
  }
  const expected = contentChecksum(handoff.operations);
  if (handoff.checksum !== expected) throw new Error('Handoff aggregate checksum mismatch.');
  return handoff;
}

export function validateDeploymentSelection(selection) {
  const { deployment, environment, allowProduction = false, confirmDeployment } = selection;
  if (!deploymentPattern.test(deployment ?? '')) throw new Error('An explicit safe --deployment value is required.');
  if (!['development', 'preview', 'production'].includes(environment)) {
    throw new Error('--environment must be development, preview, or production.');
  }
  if (deployment === 'prod' && environment !== 'production') throw new Error('The prod deployment alias requires environment=production.');
  if (deployment === 'dev' && environment !== 'development') throw new Error('The dev deployment alias requires environment=development.');
  if (deployment === 'local') throw new Error('Local deployment execution is outside this approved operator path.');
  if (environment === 'production' && (!allowProduction || confirmDeployment !== deployment)) {
    throw new Error('Production requires --allow-production and exact --confirm-deployment.');
  }
  return { deployment, environment };
}

export function buildConvexRunInvocation(functionName, args, selection, platform = process.platform) {
  validateDeploymentSelection(selection);
  if (!/^[a-z][a-z0-9_/-]*:[A-Za-z][A-Za-z0-9_]*$/.test(functionName)) {
    throw new Error('Unsafe Convex function name.');
  }
  return {
    file: platform === 'win32' ? 'npx.cmd' : 'npx',
    args: [
      '--no-install',
      'convex',
      'run',
      functionName,
      JSON.stringify(args),
      '--deployment',
      selection.deployment,
      '--typecheck',
      'disable',
      '--codegen',
      'disable',
    ],
  };
}

export function createConvexCliInvoker({ cwd = repositoryRoot, spawn = spawnSync } = {}) {
  return async (functionName, args, selection) => {
    const invocation = buildConvexRunInvocation(functionName, args, selection);
    const result = spawn(invocation.file, invocation.args, {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error || result.status !== 0) {
      throw new Error(`Convex operator call failed for ${functionName}; raw provider output was suppressed.`);
    }
    try {
      return JSON.parse(String(result.stdout).trim());
    } catch {
      throw new Error(`Convex operator returned malformed JSON for ${functionName}; raw provider output was suppressed.`);
    }
  };
}

export async function verifyRemoteDeployment(selection, invoke) {
  const identity = await invoke('migrations:deploymentIdentity', {}, selection);
  if (identity?.environment !== selection.environment) {
    throw new Error(`Selected Convex deployment reports ${identity?.environment ?? 'unknown'}; expected ${selection.environment}.`);
  }
  return identity;
}

export async function executeImportHandoff(handoffInput, options) {
  const handoff = validateHandoff(handoffInput);
  const selection = validateDeploymentSelection(options.selection);
  if (options.mode === 'dry-run') {
    return { mode: 'dry-run', runId: handoff.runId, operationCount: handoff.operationCount, checksum: handoff.checksum, selection };
  }
  if (options.mode !== 'apply') throw new Error('Import execution mode must be dry-run or apply.');
  if (options.confirmRunId !== handoff.runId) throw new Error('--confirm-run-id must exactly match the handoff runId.');
  if (options.selection.confirmDeployment !== selection.deployment) {
    throw new Error('--confirm-deployment must exactly match --deployment for every apply.');
  }
  if (typeof options.invoke !== 'function') throw new Error('A Convex invoker is required for apply mode.');
  await verifyRemoteDeployment(options.selection, options.invoke);

  const outcomes = { imported: 0, updated: 0, verifiedExisting: 0, duplicate: 0 };
  for (const item of handoff.operations) {
    const result = await options.invoke('migrations:importMappedRecord', item, options.selection);
    if (result?.outcome === 'conflict') {
      throw new Error(`Import stopped on reconciliation conflict for ${item.operation.canonicalId}.`);
    }
    if (result?.outcome === 'imported') outcomes.imported += 1;
    else if (result?.outcome === 'updated') outcomes.updated += 1;
    else if (result?.outcome === 'verified-existing') outcomes.verifiedExisting += 1;
    else if (result?.outcome === 'duplicate') outcomes.duplicate += 1;
    else throw new Error(`Import returned an unsupported outcome for ${item.operation.canonicalId}.`);
  }
  return { mode: 'apply', runId: handoff.runId, operationCount: handoff.operationCount, checksum: handoff.checksum, selection, outcomes };
}

function validateTargetPage(page, entity, seen) {
  if (!page || !Array.isArray(page.items) || !(page.nextAfter === null || typeof page.nextAfter === 'string')) {
    throw new Error(`Malformed Convex target inventory page for ${entity}.`);
  }
  return page.items.map((item) => {
    if (item?.entity !== entity || !opaqueCanonicalId.test(item.canonicalId)) {
      throw new Error(`Convex target inventory returned an invalid opaque ID for ${entity}.`);
    }
    if (seen.has(item.canonicalId)) throw new Error(`Convex target inventory repeated ${item.canonicalId}.`);
    seen.add(item.canonicalId);
    const hasChecksum = checksumPattern.test(item.checksum ?? '');
    const verified = item.status === 'verified' && hasChecksum;
    if (!verified && !(item.status === 'conflict' && hasChecksum)) {
      throw new Error(`Convex target inventory returned an invalid status/checksum for ${item.canonicalId}.`);
    }
    return { canonicalId: item.canonicalId, checksum: item.checksum, status: item.status };
  });
}

export async function exportTargetInventory(options) {
  const selection = validateDeploymentSelection(options.selection);
  if (typeof options.invoke !== 'function') throw new Error('A Convex invoker is required to export target inventory.');
  await verifyRemoteDeployment(options.selection, options.invoke);
  const reportEntities = [];
  for (const entity of entities) {
    const records = [];
    const seen = new Set();
    let after;
    for (let pageNumber = 0; pageNumber < 10_000; pageNumber += 1) {
      const queryArgs = { entity, limit: 100, ...(after ? { after } : {}) };
      const page = await options.invoke('migrations:targetInventoryPage', queryArgs, options.selection);
      records.push(...validateTargetPage(page, entity, seen));
      if (page.nextAfter === null) break;
      if (page.nextAfter === after) throw new Error(`Convex target inventory cursor did not advance for ${entity}.`);
      after = page.nextAfter;
      if (pageNumber === 9_999) throw new Error(`Convex target inventory exceeded the page safety limit for ${entity}.`);
    }
    records.sort((left, right) => left.canonicalId.localeCompare(right.canonicalId));
    reportEntities.push({
      entity,
      canonicalIds: records.map(({ canonicalId }) => canonicalId),
      records,
      checksum: contentChecksum(records),
      retryCandidates: records.filter(({ status }) => status !== 'verified').map(({ canonicalId }) => ({ canonicalId, reason: 'target-conflict' })),
      duplicateRecords: [],
    });
  }
  return {
    version: 1,
    kind: 'convex-target-inventory',
    source: 'convex',
    deployment: selection.deployment,
    environment: selection.environment,
    entities: reportEntities,
  };
}

function isWithin(root, path) {
  const child = relative(resolve(root), resolve(path));
  return child === '' || (!child.startsWith('..') && !isAbsolute(child));
}

function writeTargetReport(path, report, root = repositoryRoot) {
  if (!path) throw new Error('--out is required.');
  if (isWithin(root, path)) throw new Error('Target inventories are runtime evidence and must be written outside the repository.');
  if (existsSync(path)) throw new Error('Refusing to overwrite an existing target inventory.');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
}

export async function runConvexOperatorCli(argv = process.argv.slice(2), dependencies = {}) {
  const args = parseArgs(argv);
  const modes = ['dry-run', 'apply', 'export-target'].filter((mode) => args[mode]);
  if (modes.length !== 1) throw new Error('Choose exactly one of --dry-run, --apply, or --export-target.');
  const selection = {
    deployment: args.deployment,
    environment: args.environment,
    allowProduction: Boolean(args['allow-production']),
    confirmDeployment: args['confirm-deployment'],
  };
  validateDeploymentSelection(selection);
  const invoke = dependencies.invoke ?? createConvexCliInvoker({ cwd: dependencies.root ?? repositoryRoot });

  if (args['export-target']) {
    const target = await exportTargetInventory({ selection, invoke });
    writeTargetReport(args.out, target, dependencies.root ?? repositoryRoot);
    return { mode: 'export-target', entityCount: target.entities.length, selection: validateDeploymentSelection(selection) };
  }

  const handoff = readJson(args.handoff, 'Import handoff');
  const execution = await executeImportHandoff(handoff, {
    mode: args['dry-run'] ? 'dry-run' : 'apply',
    confirmRunId: args['confirm-run-id'],
    selection,
    invoke,
  });
  if (args.apply) {
    const target = await exportTargetInventory({ selection, invoke });
    writeTargetReport(args.out, target, dependencies.root ?? repositoryRoot);
  }
  return execution;
}

if (process.argv[1] && process.argv[1].endsWith('execute-convex.mjs')) {
  runConvexOperatorCli()
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Convex migration operator failed.' }));
      process.exitCode = 1;
    });
}
