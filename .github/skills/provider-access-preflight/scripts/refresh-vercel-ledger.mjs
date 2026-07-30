#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateProviderAccessLedger } from '../../../../scripts/verify-provider-access-ledger.mjs';

const writePermission = 'deployment:preview-write';
const readyPermission = 'deployment:preview:write';
const observationFields = new Set([
  'schemaVersion',
  'providerId',
  'observedAt',
  'accountId',
  'teamId',
  'projectId',
  'projectName',
  'environment',
  'readOnly',
]);
const repositoryRoot = resolve(
  fileURLToPath(new URL('../../../../', import.meta.url)),
);
const canonicalLedgerPath = resolve(
  repositoryRoot,
  '.agents/governance/provider-access-ledger.json',
);

function fail(message) {
  throw new Error(message);
}

function requireExactFields(observation) {
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
    fail('observation must be a secret-free object');
  }
  for (const field of Object.keys(observation)) {
    if (!observationFields.has(field)) {
      fail('observation contains unknown fields');
    }
  }
  for (const field of observationFields) {
    if (!(field in observation)) fail(`observation field is required: ${field}`);
  }
  for (const field of [
    'schemaVersion',
    'providerId',
    'observedAt',
    'accountId',
    'teamId',
    'projectId',
    'projectName',
    'environment',
  ]) {
    if (
      typeof observation[field] !== 'string' ||
      !observation[field] ||
      observation[field] !== observation[field].trim()
    ) {
      fail(`observation field must be canonical: ${field}`);
    }
  }
  if (
    observation.schemaVersion !== '1.0.0' ||
    observation.providerId !== 'vercel'
  ) {
    fail('observation must use the canonical Vercel contract');
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
      observation.observedAt,
    ) ||
    Number.isNaN(Date.parse(observation.observedAt))
  ) {
    fail('observation timestamp must be valid UTC');
  }
  if (observation.environment !== 'preview') {
    fail('observation environment must be preview');
  }
  if (observation.readOnly !== true) {
    fail('observation must be read-only');
  }
}

function requireAuthoritativeReadyExport(readyExport, ledger, nodeId) {
  const node = readyExport?.readyNodes?.find(({ id }) => id === nodeId);
  const boundary = readyExport?.boundary;
  const head = readyExport?.source?.head;
  if (
    readyExport?.source?.kind !== 'authoritative-lifecycle-ledger' ||
    readyExport?.source?.programId !== ledger.programId ||
    typeof head !== 'string' ||
    !/^[a-f0-9]{40}$/.test(head) ||
    readyExport?.target?.headSha !== head ||
    readyExport?.target?.clean !== true ||
    node?.lifecycle?.authoritative !== true ||
    node?.lifecycle?.status !== 'ready'
  ) {
    fail('authoritative ready node binding is required');
  }
  if (
    boundary?.allowPreviewDeployments !== true ||
    boundary?.allowedEnvironments?.includes('preview') !== true ||
    boundary?.allowProductionMutations !== false ||
    boundary?.productionMutationAuthorized !== false
  ) {
    fail('ready export boundary must allow Preview and deny Production mutation');
  }
  if (
    node.permissions?.includes(readyPermission) !== true ||
    node.resourceLocks?.includes('vercel:preview') !== true
  ) {
    fail('authoritative ready node does not authorize Vercel Preview deployment');
  }
}

export function refreshVercelProviderLedger(
  ledger,
  observation,
  readyExport,
  nodeId,
) {
  const ledgerErrors = validateProviderAccessLedger(ledger);
  if (ledgerErrors.length) fail('canonical provider ledger is invalid');
  requireExactFields(observation);
  requireAuthoritativeReadyExport(readyExport, ledger, nodeId);

  const refreshed = structuredClone(ledger);
  const provider = refreshed.providers.find(
    ({ providerId }) => providerId === observation.providerId,
  );
  const team = provider?.teams.find(({ id }) => id === observation.teamId);
  const project = provider?.resources.find(
    ({ id }) => id === observation.projectId,
  );
  const preview = provider?.environments.find(({ name }) => name === 'preview');
  if (
    provider?.accessStatus !== 'verified' ||
    provider?.account?.id !== observation.accountId ||
    provider?.account?.verificationStatus !== 'verified' ||
    team?.verificationStatus !== 'verified'
  ) {
    fail('observation identity does not match the existing verified Vercel IDs');
  }
  if (
    project?.resourceType !== 'project' ||
    project?.name !== observation.projectName ||
    project?.environment !== 'shared' ||
    project?.verificationStatus !== 'verified'
  ) {
    fail('observation project does not match the existing verified shared project');
  }
  if (
    preview?.verificationStatus !== 'verified' ||
    preview.resourceIds.includes(observation.projectId) !== true
  ) {
    fail('verified Preview environment must contain the exact shared project');
  }
  if (
    refreshed.productionMutationAuthorized !== false ||
    provider.environments
      .find(({ name }) => name === 'production')
      ?.verificationStatus !== 'blocked'
  ) {
    fail('Production mutation must remain blocked');
  }

  refreshed.capturedAt = observation.observedAt;
  if (!provider.permissions.includes(writePermission)) {
    const insertAt = provider.permissions.indexOf('environment-metadata:read');
    provider.permissions.splice(
      insertAt < 0 ? provider.permissions.length : insertAt,
      0,
      writePermission,
    );
  }
  if (!provider.requiredForNodes.includes(nodeId)) {
    const insertAt = provider.requiredForNodes.indexOf('G70-PACKET-ASSEMBLE');
    provider.requiredForNodes.splice(
      insertAt < 0 ? provider.requiredForNodes.length : insertAt,
      0,
      nodeId,
    );
  }
  provider.evidence[0] = {
    kind: 'provider-api',
    reference: `Vercel read-only connector: list_teams/get_project/list_deployments @ ${observation.observedAt}`,
    verificationStatus: 'verified',
  };

  const refreshedErrors = validateProviderAccessLedger(refreshed);
  if (refreshedErrors.length) fail('refreshed provider ledger is invalid');
  return refreshed;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch {
    fail(`unable to read ${label}`);
  }
}

function parseArguments(argv) {
  if (
    argv.length !== 4 ||
    argv[0] !== '--observation' ||
    argv[2] !== '--ready-export'
  ) {
    fail('usage: refresh-vercel-ledger --observation <path> --ready-export <path>');
  }
  return { observationPath: argv[1], readyExportPath: argv[3] };
}

function main() {
  try {
    const { observationPath, readyExportPath } = parseArguments(
      process.argv.slice(2),
    );
    const ledger = readJson(canonicalLedgerPath, 'canonical provider ledger');
    const observation = readJson(observationPath, 'Vercel observation');
    const readyExport = readJson(readyExportPath, 'authoritative ready export');
    const refreshed = refreshVercelProviderLedger(
      ledger,
      observation,
      readyExport,
      'STL-206',
    );
    writeFileSync(
      canonicalLedgerPath,
      `${JSON.stringify(refreshed, null, 2)}\n`,
      'utf8',
    );
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        providerId: 'vercel',
        nodeId: 'STL-206',
        capturedAt: refreshed.capturedAt,
        productionMutationAuthorized: false,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Vercel ledger refresh failed',
        productionMutationAuthorized: false,
      })}\n`,
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main();
}
