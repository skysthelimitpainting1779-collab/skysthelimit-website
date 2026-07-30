#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import Database from 'better-sqlite3';

import { validateProviderAccessLedger } from './verify-provider-access-ledger.mjs';

const programId = 'stl-post-g20-sequential-tdd-v1';
const repositoryRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const requestFields = new Set([
  'schemaVersion',
  'nodeId',
  'providerId',
  'operation',
  'accountId',
  'teamId',
  'resourceType',
  'resourceId',
  'environment',
  'permission',
  'observedAt',
]);
const requiredStringFields = [
  'schemaVersion',
  'nodeId',
  'providerId',
  'operation',
  'accountId',
  'resourceType',
  'resourceId',
  'environment',
  'permission',
  'observedAt',
];
const credentialPatterns = [
  /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+/,
  /whsec_[A-Za-z0-9]+/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bbearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i,
  /(?:postgres(?:ql)?|libsql):\/\/[^/\s:@]+:[^@\s]+@/i,
  /[A-Za-z]:[\\/]Users[\\/]/,
];
const blockedPermissionTokens = new Set([
  'blocked',
  'none',
  'not-selected',
  'unverified',
]);
const mutationCapabilityTokens = new Set([
  'admin',
  'configure',
  'create',
  'delete',
  'deploy',
  'manage',
  'mutate',
  'provision',
  'send',
  'update',
  'write',
]);
const mutationEnvironments = new Set([
  'development',
  'integration',
  'local',
  'preview',
  'sandbox',
  'staging',
  'test',
]);
const safeDecisionValuePattern = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;

function validUtcTimestamp(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
  ) {
    return false;
  }
  const parsed = new Date(value);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 19) === value.slice(0, 19)
  );
}

function canonicalize(value, seen = new WeakSet()) {
  if (typeof value === 'bigint') return `[BigInt:${value.toString()}]`;
  if (typeof value === 'function') return '[Function]';
  if (typeof value === 'symbol') return `[Symbol:${value.description || ''}]`;
  if (value === undefined) return '[Undefined]';
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const result = value.map((item) => canonicalize(item, seen));
    seen.delete(value);
    return result;
  }
  if (value && typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const result = Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key], seen)]),
    );
    seen.delete(value);
    return result;
  }
  return value;
}

function safeSerialize(value) {
  try {
    return JSON.stringify(canonicalize(value));
  } catch {
    return '"[Unserializable]"';
  }
}

function containsCredentialMaterial(value) {
  const serialized = safeSerialize(value);
  return credentialPatterns.some((pattern) => pattern.test(serialized));
}

function digest(value) {
  return createHash('sha256').update(safeSerialize(value ?? null)).digest('hex');
}

function safeDecisionValue(value) {
  return typeof value === 'string' &&
    safeDecisionValuePattern.test(value) &&
    !containsCredentialMaterial(value)
    ? value
    : 'unresolved';
}

export function validatePreflightRequest(request) {
  const errors = [];
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return ['request must be an object'];
  }
  for (const field of Object.keys(request)) {
    if (!requestFields.has(field)) errors.push(`unknown field: ${field}`);
  }
  for (const field of requiredStringFields) {
    if (typeof request[field] !== 'string' || !request[field].trim()) {
      errors.push(`${field} must be a non-empty string`);
    } else if (request[field] !== request[field].trim()) {
      errors.push(`${field} must use a canonical value without whitespace`);
    }
  }
  if (request.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be 1.0.0');
  }
  if (!['read', 'oauth', 'mutate'].includes(request.operation)) {
    errors.push('operation must be read, oauth, or mutate');
  }
  if (
    request.teamId !== null &&
    (typeof request.teamId !== 'string' ||
      !request.teamId.trim() ||
      request.teamId !== request.teamId.trim())
  ) {
    errors.push('teamId must be a canonical non-empty string or null');
  }
  if (
    typeof request.environment === 'string' &&
    !/^[a-z][a-z0-9-]*$/.test(request.environment)
  ) {
    errors.push('environment must be a canonical lowercase identifier');
  }
  if (
    typeof request.observedAt === 'string' &&
    !validUtcTimestamp(request.observedAt)
  ) {
    errors.push('observedAt must be a valid UTC date-time');
  }
  if (containsCredentialMaterial(request)) {
    errors.push('request contains secret-shaped or machine-specific material');
  }
  return errors;
}

function deniedDecision(
  request,
  errors,
  checks = [],
  evaluatedAt = new Date().toISOString(),
  ledger = null,
) {
  const invalidRequest = errors.some((error) =>
    /request|unknown field|must be|secret-shaped|machine-specific/i.test(error),
  );
  return {
    schemaVersion: '1.0.0',
    allowed: false,
    nodeId: invalidRequest
      ? 'unresolved'
      : safeDecisionValue(request?.nodeId),
    providerId: invalidRequest
      ? 'unresolved'
      : safeDecisionValue(request?.providerId),
    operation: invalidRequest
      ? 'unresolved'
      : safeDecisionValue(request?.operation),
    environment: invalidRequest
      ? 'unresolved'
      : safeDecisionValue(request?.environment),
    checks,
    errors,
    requestSha256: digest(request),
    providerLedgerSha256: digest(ledger),
    productionMutationAuthorized: false,
    evaluatedAt,
  };
}

function permissionTokens(permission) {
  return String(permission)
    .toLowerCase()
    .split(/[:_-]+/)
    .filter(Boolean);
}

export function runProviderAccessPreflight(
  ledger,
  request,
  { evaluatedAt = new Date(), authority = null } = {},
) {
  const evaluationDate = new Date(evaluatedAt);
  const effectiveEvaluationDate = Number.isNaN(evaluationDate.valueOf())
    ? new Date()
    : evaluationDate;
  const evaluationTimestamp = effectiveEvaluationDate.toISOString();
  const requestErrors = validatePreflightRequest(request);
  const ledgerErrors = validateProviderAccessLedger(ledger);
  if (requestErrors.length || ledgerErrors.length) {
    return deniedDecision(
      request,
      [
        ...requestErrors,
        ...ledgerErrors.map((error) => `provider ledger: ${error}`),
      ],
      [],
      evaluationTimestamp,
      ledger,
    );
  }

  const checks = [];
  const errors = [];
  const check = (name, passed, error) => {
    checks.push({ name, status: passed ? 'passed' : 'failed' });
    if (!passed) errors.push(error);
  };

  check(
    'program-binding',
    ledger.programId === programId && authority?.programId === programId,
    'provider ledger or lifecycle authority has a program binding mismatch',
  );
  const authorityExpiry = new Date(authority?.expiresAt || 0);
  check(
    'active-lifecycle-lease',
    authority?.active === true &&
      !Number.isNaN(authorityExpiry.valueOf()) &&
      authorityExpiry.valueOf() >= effectiveEvaluationDate.valueOf(),
    'an active lifecycle lease is required',
  );
  check(
    'active-lifecycle-node',
    authority?.currentNodeId === request.nodeId,
    'request node does not match the active lifecycle node',
  );

  const ledgerAge =
    effectiveEvaluationDate.valueOf() - new Date(ledger.capturedAt).valueOf();
  check(
    'ledger-freshness',
    ledgerAge >= -30_000 && ledgerAge <= 10 * 60_000,
    'provider ledger observation is stale or in the future',
  );

  const provider = ledger.providers.find(
    ({ providerId: candidate }) => candidate === request.providerId,
  );
  check(
    'provider',
    Boolean(provider),
    'provider is not present in the access ledger',
  );
  if (!provider) {
    return deniedDecision(
      request,
      errors,
      checks,
      evaluationTimestamp,
      ledger,
    );
  }

  const observationAge =
    effectiveEvaluationDate.valueOf() -
    new Date(request.observedAt).valueOf();
  check(
    'observation-freshness',
    observationAge >= -30_000 && observationAge <= 10 * 60_000,
    'stale observation or observation timestamp is in the future',
  );
  check(
    'provider-access',
    provider.accessStatus === 'verified',
    'provider access is not verified',
  );
  check(
    'provider-evidence',
    provider.evidence.length > 0 &&
      provider.evidence.every(
        ({ verificationStatus }) => verificationStatus === 'verified',
      ),
    'provider evidence is missing or unverified',
  );
  check(
    'node-binding',
    provider.requiredForNodes.includes(request.nodeId),
    'node binding mismatch',
  );
  check(
    'account',
    provider.account.id === request.accountId &&
      provider.account.verificationStatus === 'verified',
    provider.account.id === request.accountId
      ? 'account identity is not verified'
      : 'account identity mismatch',
  );

  const team =
    request.teamId === null
      ? null
      : provider.teams.find(({ id }) => id === request.teamId);
  const teamPassed =
    provider.teams.length === 0
      ? request.teamId === null
      : Boolean(team && team.verificationStatus === 'verified');
  check('team', teamPassed, 'team identity mismatch');

  const resource = provider.resources.find(
    ({ id }) => id === request.resourceId,
  );
  const environment = provider.environments.find(
    ({ name }) => name === request.environment,
  );
  const environmentPassed =
    environment?.verificationStatus === 'verified' &&
    environment.resourceIds.includes(request.resourceId);
  const resourceEnvironmentPassed =
    resource?.environment === request.environment ||
    (resource?.environment === 'shared' && environmentPassed);
  const resourcePassed =
    resource?.resourceType === request.resourceType &&
    resourceEnvironmentPassed &&
    resource?.verificationStatus === 'verified';
  check('resource', resourcePassed, 'resource mismatch');

  check('environment', environmentPassed, 'environment mismatch');

  const permission = provider.permissions.find(
    (value) => value === request.permission,
  );
  const tokens = permissionTokens(permission);
  const permissionPassed =
    Boolean(permission) &&
    !tokens.some((token) => blockedPermissionTokens.has(token));
  check('permission', permissionPassed, 'permission mismatch or unverified');

  const mutationHasWriteCapability =
    request.operation !== 'mutate' ||
    tokens.some((token) => mutationCapabilityTokens.has(token));
  check(
    'operation-permission',
    mutationHasWriteCapability,
    'provider mutation requires an explicit write capability',
  );
  const mutationUsesApprovedEnvironment =
    request.operation !== 'mutate' ||
    mutationEnvironments.has(request.environment);
  check(
    'mutation-environment',
    mutationUsesApprovedEnvironment,
    'provider mutation requires an approved non-Production environment',
  );
  check(
    'production-mutation',
    ledger.productionMutationAuthorized === false &&
      mutationUsesApprovedEnvironment,
    'Production mutation is not authorized',
  );

  return {
    ...deniedDecision(
      request,
      errors,
      checks,
      evaluationTimestamp,
      ledger,
    ),
    allowed: errors.length === 0,
  };
}

function parseArguments(argv) {
  if (
    argv.length !== 2 ||
    argv[0] !== '--input' ||
    !argv[1] ||
    argv[1].startsWith('--')
  ) {
    throw new Error('invalid command arguments');
  }
  return { input: argv[1] };
}

function controlPlaneDatabasePath() {
  const runtimeRoot = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'SkyDevControlPlane')
    : join(homedir(), '.local', 'share', 'sky-dev-control-plane');
  return join(runtimeRoot, 'graphify.db');
}

function unavailableLifecycleAuthority() {
  return {
    programId,
    checkpointId: null,
    currentNodeId: null,
    currentStageId: null,
    active: false,
    expiresAt: null,
  };
}

function loadLifecycleAuthority(databasePath, evaluatedAt) {
  let database;
  try {
    database = new Database(databasePath, {
      readonly: true,
      fileMustExist: true,
    });
    const lease = database
      .prepare(
        `SELECT checkpoint_id, node_id, stage_id, expires_at
         FROM lifecycle_writer_leases
         WHERE program_id = ?`,
      )
      .get(programId);
    return {
      programId,
      checkpointId: lease?.checkpoint_id || null,
      currentNodeId: lease?.node_id || null,
      currentStageId: lease?.stage_id || null,
      active:
        Boolean(lease) &&
        new Date(lease.expires_at).valueOf() >= evaluatedAt.valueOf(),
      expiresAt: lease?.expires_at || null,
    };
  } catch {
    return unavailableLifecycleAuthority();
  } finally {
    database?.close();
  }
}

function readJson(path, label) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    throw new Error(`unable to read ${label}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid JSON in ${label}`);
  }
}

function main() {
  let request = {};
  let ledger = null;
  try {
    const { input } = parseArguments(process.argv.slice(2));
    const evaluatedAt = new Date();
    request = readJson(resolve(input), 'preflight input');
    ledger = readJson(
      resolve(
        repositoryRoot,
        '.agents/governance/provider-access-ledger.json',
      ),
      'canonical provider ledger',
    );
    const authority = loadLifecycleAuthority(
      controlPlaneDatabasePath(),
      evaluatedAt,
    );
    const decision = runProviderAccessPreflight(ledger, request, {
      evaluatedAt,
      authority,
    });
    process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
    if (!decision.allowed) process.exitCode = 1;
  } catch (error) {
    const safeMessage = [
      'invalid command arguments',
      'unable to read preflight input',
      'invalid JSON in preflight input',
      'unable to read canonical provider ledger',
      'invalid JSON in canonical provider ledger',
    ].includes(String(error.message))
      ? String(error.message)
      : 'preflight evaluation failed';
    process.stdout.write(
      `${JSON.stringify(
        deniedDecision(
          request,
          [`preflight input error: ${safeMessage}`],
          [],
          new Date().toISOString(),
          ledger,
        ),
        null,
        2,
      )}\n`,
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
