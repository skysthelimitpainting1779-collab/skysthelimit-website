#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import Database from 'better-sqlite3';

const programId = 'stl-post-g20-sequential-tdd-v1';
const expectedPolicySha256 =
  '4f27c422c05fd2aa92bb06044fad2643b6d717f33624cf48afad4cedf2aac5be';
const repositoryRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const requestFields = new Set([
  'schemaVersion',
  'programId',
  'nodeId',
  'checkpointId',
  'observedAt',
  'metrics',
]);
const metricFields = [
  'inputTokens',
  'outputTokens',
  'toolCalls',
  'retries',
  'waitMilliseconds',
  'agentSpawns',
  'externalProviderCalls',
  'elapsedMilliseconds',
  'aiUsd',
  'infrastructureUsd',
  'externalUsd',
];
const integerMetricFields = new Set([
  'inputTokens',
  'outputTokens',
  'toolCalls',
  'retries',
  'waitMilliseconds',
  'agentSpawns',
  'externalProviderCalls',
  'elapsedMilliseconds',
]);
const credentialPatterns = [
  /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+/,
  /whsec_[A-Za-z0-9]+/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bbearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i,
  /(?:postgres(?:ql)?|libsql):\/\/[^/\s:@]+:[^@\s]+@/i,
  /[A-Za-z]:[\\/]Users[\\/]/,
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validUtcTimestamp(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
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

function serialize(value) {
  try {
    return JSON.stringify(canonicalize(value));
  } catch {
    return '"[Unserializable]"';
  }
}

function containsCredentialMaterial(value) {
  const text = serialize(value);
  return credentialPatterns.some((pattern) => pattern.test(text));
}

function digest(value) {
  return createHash('sha256').update(serialize(value ?? null)).digest('hex');
}

export function validateTelemetryRequest(request) {
  const errors = [];
  if (!isRecord(request)) return ['request must be an object'];
  if (containsCredentialMaterial(request)) {
    return ['request contains secret-shaped or machine-specific material'];
  }
  if (Object.keys(request).some((field) => !requestFields.has(field))) {
    errors.push('request contains unknown fields');
  }
  for (const field of [
    'schemaVersion',
    'programId',
    'nodeId',
    'checkpointId',
    'observedAt',
  ]) {
    if (typeof request[field] !== 'string' || !request[field].trim()) {
      errors.push(`${field} must be a non-empty string`);
    } else if (request[field] !== request[field].trim()) {
      errors.push(`${field} must not contain surrounding whitespace`);
    }
  }
  if (request.schemaVersion !== '1.0.0') {
    errors.push('schemaVersion must be 1.0.0');
  }
  if (!validUtcTimestamp(request.observedAt)) {
    errors.push('observedAt must be a valid UTC date-time');
  }
  if (!isRecord(request.metrics)) {
    errors.push('metrics must be an object');
  } else {
    if (
      Object.keys(request.metrics).some(
        (field) => !metricFields.includes(field),
      )
    ) {
      errors.push('metrics contains unknown fields');
    }
    for (const field of metricFields) {
      const value = request.metrics[field];
      const valid =
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        (!integerMetricFields.has(field) || Number.isSafeInteger(value));
      if (!valid) errors.push(`metrics.${field} must be a non-negative finite ${integerMetricFields.has(field) ? 'integer' : 'number'}`);
    }
  }
  return errors;
}

function deniedDecision(
  request,
  errors,
  checks = [],
  warnings = [],
  evaluatedAt = new Date().toISOString(),
  policy = null,
) {
  return {
    schemaVersion: '1.0.0',
    allowed: false,
    programId: programId,
    nodeId: errors.length ? 'unresolved' : String(request?.nodeId || 'unresolved'),
    checkpointId: errors.length
      ? 'unresolved'
      : String(request?.checkpointId || 'unresolved'),
    checks,
    warnings,
    errors,
    requestSha256: digest(request),
    policySha256: digest(policy),
    productionMutationAuthorized: false,
    evaluatedAt,
  };
}

function validatePolicy(policy) {
  const errors = [];
  if (!isRecord(policy)) return ['telemetry policy must be an object'];
  if (
    policy.schemaVersion !== '1.0.0' ||
    policy.programId !== programId ||
    policy.productionMutationAuthorized !== false
  ) {
    errors.push('telemetry policy identity or Production guard is invalid');
  }
  if (digest(policy) !== expectedPolicySha256) {
    errors.push('telemetry policy integrity mismatch');
  }
  for (const field of [
    'maxObservationAgeMilliseconds',
    'maxTotalTokens',
    'maxToolCalls',
    'maxWaitMilliseconds',
    'maxAgentSpawns',
    'maxExternalProviderCalls',
    'maxElapsedMilliseconds',
  ]) {
    if (!Number.isSafeInteger(policy[field]) || policy[field] <= 0) {
      errors.push(`telemetry policy ${field} must be a positive integer`);
    }
  }
  return errors;
}

export function evaluateNodeTelemetry(
  node,
  policy,
  request,
  { authority = null, evaluatedAt = new Date() } = {},
) {
  const evaluationDate = new Date(evaluatedAt);
  const effectiveDate = Number.isNaN(evaluationDate.valueOf())
    ? new Date()
    : evaluationDate;
  const timestamp = effectiveDate.toISOString();
  const validationErrors = [
    ...validateTelemetryRequest(request),
    ...validatePolicy(policy),
  ];
  if (!isRecord(node) || node.programId !== programId) {
    validationErrors.push('audited execution node is missing or invalid');
  }
  if (validationErrors.length) {
    return deniedDecision(
      request,
      validationErrors,
      [],
      [],
      timestamp,
      policy,
    );
  }

  const checks = [];
  const warnings = [];
  const errors = [];
  const check = (name, passed, error) => {
    checks.push({ name, status: passed ? 'passed' : 'failed' });
    if (!passed) errors.push(error);
  };
  const checkLimit = (
    name,
    value,
    hardLimit,
    warningPercent,
    hardStopPercent,
    label,
  ) => {
    const utilization = hardLimit === 0 ? (value === 0 ? 0 : Infinity) : (value / hardLimit) * 100;
    const passed = utilization < hardStopPercent;
    check(name, passed, `${label} reached its hard stop`);
    if (passed && utilization >= warningPercent) {
      warnings.push(`${label} reached warning threshold: ${utilization.toFixed(2)}%`);
    }
  };

  const authorityExpiry = new Date(authority?.expiresAt || 0);
  check(
    'program-binding',
    request.programId === programId &&
      node.programId === programId &&
      policy.programId === programId &&
      authority?.programId === programId,
    'program binding mismatch',
  );
  check(
    'active-lifecycle-lease',
    authority?.active === true &&
      !Number.isNaN(authorityExpiry.valueOf()) &&
      authorityExpiry.valueOf() >= effectiveDate.valueOf(),
    'an active lifecycle lease is required',
  );
  check(
    'active-lifecycle-node',
    request.nodeId === node.nodeId && authority?.nodeId === node.nodeId,
    'request does not match the active lifecycle node',
  );
  check(
    'checkpoint-binding',
    request.checkpointId === authority?.checkpointId,
    'checkpoint binding mismatch',
  );
  check(
    'reported-activity',
    request.metrics.inputTokens + request.metrics.outputTokens > 0 &&
      request.metrics.toolCalls > 0 &&
      request.metrics.elapsedMilliseconds > 0,
    'telemetry must report nonzero checkpoint activity',
  );
  const observationAge =
    effectiveDate.valueOf() - new Date(request.observedAt).valueOf();
  check(
    'observation-freshness',
    observationAge >= -30_000 &&
      observationAge <= policy.maxObservationAgeMilliseconds,
    'telemetry observation is stale or in the future',
  );

  const warningPercent = node.costWarningPercent;
  const hardPercent = node.costHardStopPercent;
  const hardScale = hardPercent / 100;
  checkLimit(
    'tokens',
    request.metrics.inputTokens + request.metrics.outputTokens,
    policy.maxTotalTokens,
    warningPercent,
    hardPercent,
    'tokens',
  );
  checkLimit(
    'tool-calls',
    request.metrics.toolCalls,
    policy.maxToolCalls,
    warningPercent,
    hardPercent,
    'tool calls',
  );
  check(
    'retries',
    request.metrics.retries < node.maxAttempts,
    'retries reached the audited max-attempt stop',
  );
  checkLimit(
    'wait-time',
    request.metrics.waitMilliseconds,
    policy.maxWaitMilliseconds,
    warningPercent,
    hardPercent,
    'wait time',
  );
  checkLimit(
    'agent-spawns',
    request.metrics.agentSpawns,
    policy.maxAgentSpawns,
    warningPercent,
    hardPercent,
    'agent spawns',
  );
  checkLimit(
    'provider-calls',
    request.metrics.externalProviderCalls,
    policy.maxExternalProviderCalls,
    warningPercent,
    hardPercent,
    'external provider calls',
  );
  const elapsedLimit = Math.min(
    policy.maxElapsedMilliseconds,
    node.costBudget.laborHoursExpected * 60 * 60 * 1000,
  );
  checkLimit(
    'elapsed-time',
    request.metrics.elapsedMilliseconds,
    elapsedLimit,
    warningPercent,
    hardPercent,
    'elapsed time',
  );
  const aiHardLimit = node.costBudget.aiUsdHigh * hardScale;
  const aiWarningLimit =
    node.costBudget.aiUsdHigh * (warningPercent / 100);
  check(
    'ai-cost',
    request.metrics.aiUsd < aiHardLimit,
    'AI cost reached the audited hard stop',
  );
  check(
    'ai-cost-regression',
    request.metrics.aiUsd <= node.costBudget.aiUsdExpected * 1.5,
    'AI cost exceeded the audited expected-cost deviation ceiling',
  );
  if (
    request.metrics.aiUsd >= aiWarningLimit &&
    request.metrics.aiUsd < aiHardLimit
  ) {
    const utilization =
      node.costBudget.aiUsdHigh === 0
        ? 0
        : (request.metrics.aiUsd / node.costBudget.aiUsdHigh) * 100;
    warnings.push(
      `AI cost reached warning threshold: ${utilization.toFixed(2)}%`,
    );
  }
  checkLimit(
    'infrastructure-cost',
    request.metrics.infrastructureUsd,
    node.costBudget.infrastructureUsd,
    warningPercent,
    hardPercent,
    'infrastructure cost',
  );
  checkLimit(
    'external-cost',
    request.metrics.externalUsd,
    node.costBudget.externalUsd,
    warningPercent,
    hardPercent,
    'external cost',
  );
  return {
    ...deniedDecision(request, errors, checks, warnings, timestamp, policy),
    allowed: errors.length === 0,
  };
}

export function controlPlaneDatabasePath() {
  let root;
  if (process.platform === 'win32') {
    const trustedRegistryExecutable = realpathSync.native(
      'C:\\Windows\\System32\\reg.exe',
    );
    if (
      trustedRegistryExecutable.toLowerCase() !==
      'c:\\windows\\system32\\reg.exe'
    ) {
      throw new Error('trusted local application data path is unavailable');
    }
    const registry = spawnSync(
      trustedRegistryExecutable,
      [
        'query',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Folders',
        '/v',
        'Local AppData',
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    const match = registry.stdout?.match(
      /^\s*Local AppData\s+REG_\w+\s+(.+?)\s*$/m,
    );
    if (registry.status !== 0 || !match) {
      throw new Error('trusted local application data path is unavailable');
    }
    root = join(match[1], 'SkyDevControlPlane');
  } else {
    root = join(
      userInfo().homedir,
      '.local',
      'share',
      'sky-dev-control-plane',
    );
  }
  const canonicalRoot = realpathSync.native(root);
  if (lstatSync(canonicalRoot).isSymbolicLink()) {
    throw new Error('trusted local application data path is unavailable');
  }
  const databasePath = realpathSync.native(join(canonicalRoot, 'graphify.db'));
  if (lstatSync(databasePath).isSymbolicLink()) {
    throw new Error('trusted local application data path is unavailable');
  }
  return databasePath;
}

export function validateExecutionAuthoritySnapshot({
  graphText,
  leaseGraphText = graphText,
  expectedGraphSha256,
  nodeId,
  nodeRawJson,
}) {
  const normalizedGraphText = graphText.replace(/\r\n/g, '\n');
  const normalizedLeaseGraphText = leaseGraphText.replace(/\r\n/g, '\n');
  if (normalizedGraphText !== normalizedLeaseGraphText) {
    throw new Error('execution graph lease revision mismatch');
  }
  const actualGraphSha256 = createHash('sha256')
    .update(leaseGraphText)
    .digest('hex');
  if (actualGraphSha256 !== expectedGraphSha256) {
    throw new Error('execution graph integrity mismatch');
  }
  let canonicalNode = null;
  for (const line of leaseGraphText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (record.recordType === 'node' && record.nodeId === nodeId) {
      if (canonicalNode) {
        throw new Error('execution node authority is not unique');
      }
      canonicalNode = record;
    }
  }
  const databaseNode = JSON.parse(nodeRawJson);
  if (!canonicalNode || digest(canonicalNode) !== digest(databaseNode)) {
    throw new Error('execution node integrity mismatch');
  }
  return databaseNode;
}

function loadControlPlane(evaluatedAt) {
  const database = new Database(controlPlaneDatabasePath(), {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const row = database
      .prepare(
        `SELECT l.checkpoint_id, l.node_id, l.expires_at, l.head_sha,
                i.validation_ok, i.graph_path, i.graph_sha256, n.raw_json
         FROM lifecycle_writer_leases AS l
         JOIN execution_graph_imports AS i
           ON i.program_id = l.program_id
         JOIN execution_nodes AS n
           ON n.graph_id = i.graph_id AND n.node_id = l.node_id
         WHERE l.program_id = ?`,
      )
      .get(programId);
    if (!row || row.validation_ok !== 1) {
      throw new Error('validated execution authority is unavailable');
    }
    const canonicalGraphPath = realpathSync.native(
      join(
        repositoryRoot,
        '.agents',
        'execution',
        'skys-limit-sequential-tdd-execution-graph-audited.jsonl',
      ),
    );
    const importedGraphPath = realpathSync.native(row.graph_path);
    const graphText = readFileSync(canonicalGraphPath, 'utf8');
    if (importedGraphPath !== canonicalGraphPath) {
      throw new Error('execution graph integrity mismatch');
    }
    const leaseGraph = spawnSync(
      'git',
      [
        'show',
        `${row.head_sha}:.agents/execution/skys-limit-sequential-tdd-execution-graph-audited.jsonl`,
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
      },
    );
    if (leaseGraph.status !== 0) {
      throw new Error('execution graph lease revision mismatch');
    }
    const node = validateExecutionAuthoritySnapshot({
      graphText,
      leaseGraphText: leaseGraph.stdout,
      expectedGraphSha256: row.graph_sha256,
      nodeId: row.node_id,
      nodeRawJson: row.raw_json,
    });
    const ancestor = spawnSync(
      'git',
      ['merge-base', '--is-ancestor', row.head_sha, 'HEAD'],
      { cwd: repositoryRoot, windowsHide: true },
    );
    if (ancestor.status !== 0) {
      throw new Error('lifecycle Git binding mismatch');
    }
    return {
      authority: {
        programId,
        checkpointId: row.checkpoint_id,
        nodeId: row.node_id,
        active:
          new Date(row.expires_at).valueOf() >= evaluatedAt.valueOf(),
        expiresAt: row.expires_at,
      },
      node,
    };
  } finally {
    database.close();
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`unable to read or parse ${label}`);
  }
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
  return argv[1];
}

function main() {
  let request = {};
  let policy = null;
  try {
    const input = parseArguments(process.argv.slice(2));
    const evaluatedAt = new Date();
    request = readJson(resolve(input), 'telemetry input');
    policy = readJson(
      join(
        repositoryRoot,
        '.agents',
        'governance',
        'node-telemetry-policy.json',
      ),
      'canonical telemetry policy',
    );
    const { authority, node } = loadControlPlane(evaluatedAt);
    const decision = evaluateNodeTelemetry(node, policy, request, {
      authority,
      evaluatedAt,
    });
    process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
    if (!decision.allowed) process.exitCode = 1;
  } catch (error) {
    const safeErrors = [
      'invalid command arguments',
      'unable to read or parse telemetry input',
      'unable to read or parse canonical telemetry policy',
      'validated execution authority is unavailable',
      'execution graph integrity mismatch',
      'execution graph lease revision mismatch',
      'lifecycle Git binding mismatch',
      'trusted local application data path is unavailable',
      'execution node authority is not unique',
      'execution node integrity mismatch',
    ];
    const message = safeErrors.includes(String(error.message))
      ? String(error.message)
      : 'telemetry gate evaluation failed';
    process.stdout.write(
      `${JSON.stringify(
        deniedDecision(
          request,
          [message],
          [],
          [],
          new Date().toISOString(),
          policy,
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
