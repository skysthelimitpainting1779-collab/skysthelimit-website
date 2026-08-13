import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  controlPlaneDatabasePath,
  evaluateNodeTelemetry,
  validateExecutionAuthoritySnapshot,
  validateTelemetryRequest,
} from '../scripts/node-telemetry-gate.mjs';

const policy = JSON.parse(
  readFileSync('.agents/governance/node-telemetry-policy.json', 'utf8'),
);
const node = {
  nodeId: 'ORCH-004',
  programId: 'stl-post-g20-sequential-tdd-v1',
  costBudget: {
    aiUsdExpected: 0.75,
    aiUsdHigh: 1.5,
    laborHoursExpected: 1.5,
    infrastructureUsd: 0,
    externalUsd: 0,
  },
  costWarningPercent: 70,
  costHardStopPercent: 95,
  maxAttempts: 2,
};
const authority = {
  programId: node.programId,
  checkpointId: 'cp-20260729-orch004-001',
  nodeId: node.nodeId,
  active: true,
  expiresAt: '2026-07-29T18:48:08Z',
};
const request = {
  schemaVersion: '1.0.0',
  programId: node.programId,
  nodeId: node.nodeId,
  checkpointId: authority.checkpointId,
  observedAt: '2026-07-29T17:50:00Z',
  metrics: {
    inputTokens: 1000,
    outputTokens: 500,
    toolCalls: 10,
    retries: 0,
    waitMilliseconds: 1000,
    agentSpawns: 1,
    externalProviderCalls: 0,
    elapsedMilliseconds: 60_000,
    aiUsd: 0.1,
    infrastructureUsd: 0,
    externalUsd: 0,
  },
};
const options = {
  authority,
  evaluatedAt: new Date('2026-07-29T17:51:00Z'),
};

test('telemetry gate allows an exact active node under every budget', () => {
  assert.deepEqual(validateTelemetryRequest(request), []);
  const decision = evaluateNodeTelemetry(node, policy, request, options);
  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.errors, []);
  assert.equal(decision.productionMutationAuthorized, false);
  assert.match(decision.requestSha256, /^[a-f0-9]{64}$/);
  assert.equal(decision.checks.every(({ status }) => status === 'passed'), true);
});

test('telemetry gate fails closed for every hard-cap dimension', () => {
  const elapsedLimit = Math.min(
    policy.maxElapsedMilliseconds,
    node.costBudget.laborHoursExpected * 60 * 60 * 1000,
  );
  const cases = [
    [
      'inputTokens',
      policy.maxTotalTokens * 0.95 - request.metrics.outputTokens,
      /tokens/i,
    ],
    ['toolCalls', Math.ceil(policy.maxToolCalls * 0.95), /tool/i],
    ['retries', node.maxAttempts, /retr/i],
    [
      'waitMilliseconds',
      policy.maxWaitMilliseconds * 0.95,
      /wait/i,
    ],
    ['agentSpawns', policy.maxAgentSpawns, /agent/i],
    [
      'externalProviderCalls',
      policy.maxExternalProviderCalls * 0.95,
      /provider/i,
    ],
    ['elapsedMilliseconds', elapsedLimit * 0.95, /elapsed/i],
    ['aiUsd', node.costBudget.aiUsdHigh * 0.95, /AI cost/i],
    ['infrastructureUsd', 0.01, /infrastructure/i],
    ['externalUsd', 0.01, /external cost/i],
  ];

  for (const [metric, value, pattern] of cases) {
    const decision = evaluateNodeTelemetry(
      node,
      policy,
      {
        ...request,
        metrics: { ...request.metrics, [metric]: value },
      },
      options,
    );
    assert.equal(decision.allowed, false, metric);
    assert.match(decision.errors.join('\n'), pattern, metric);
  }
});

test('AI cost enforces the audited expected-cost deviation ceiling', () => {
  const overExpectedCost = {
    ...request,
    metrics: {
      ...request.metrics,
      aiUsd: node.costBudget.aiUsdExpected * 1.6,
    },
  };
  const decision = evaluateNodeTelemetry(
    node,
    policy,
    overExpectedCost,
    options,
  );
  assert.equal(decision.allowed, false);
  assert.match(decision.errors.join('\n'), /expected-cost deviation/i);
});

test('telemetry cannot pass with an all-zero activity report', () => {
  const zeroMetrics = Object.fromEntries(
    Object.keys(request.metrics).map((field) => [field, 0]),
  );
  const decision = evaluateNodeTelemetry(
    node,
    policy,
    { ...request, metrics: zeroMetrics },
    options,
  );
  assert.equal(decision.allowed, false);
  assert.match(decision.errors.join('\n'), /nonzero checkpoint activity/i);
});

test('warning thresholds are visible without silently becoming hard stops', () => {
  const decision = evaluateNodeTelemetry(
    node,
    policy,
    {
      ...request,
      metrics: {
        ...request.metrics,
        aiUsd: node.costBudget.aiUsdHigh * 0.7,
      },
    },
    options,
  );
  assert.equal(decision.allowed, true);
  assert.match(decision.warnings.join('\n'), /AI cost/i);
});

test('telemetry gate binds program, node, checkpoint, lease, and freshness', () => {
  const mismatches = [
    [{ ...authority, programId: 'wrong-program' }, /program/i],
    [{ ...authority, nodeId: 'STL-301' }, /active lifecycle node/i],
    [{ ...authority, checkpointId: 'wrong-checkpoint' }, /checkpoint/i],
    [{ ...authority, active: false }, /active lifecycle lease/i],
  ];
  for (const [candidate, pattern] of mismatches) {
    const decision = evaluateNodeTelemetry(node, policy, request, {
      ...options,
      authority: candidate,
    });
    assert.equal(decision.allowed, false);
    assert.match(decision.errors.join('\n'), pattern);
  }

  const stale = evaluateNodeTelemetry(
    node,
    policy,
    { ...request, observedAt: '2020-01-01T00:00:00Z' },
    options,
  );
  assert.equal(stale.allowed, false);
  assert.match(stale.errors.join('\n'), /stale/i);
});

test('request validation rejects unknown, negative, non-finite, and secret data', () => {
  assert.match(
    validateTelemetryRequest({ ...request, token: 'sk_live_secretvalue' }).join(
      '\n',
    ),
    /unknown|secret/i,
  );
  assert.match(
    validateTelemetryRequest({
      ...request,
      metrics: { ...request.metrics, retries: -1 },
    }).join('\n'),
    /retries/i,
  );
  assert.match(
    validateTelemetryRequest({
      ...request,
      metrics: { ...request.metrics, aiUsd: Number.POSITIVE_INFINITY },
    }).join('\n'),
    /aiUsd/i,
  );
  const cyclic = { ...request };
  cyclic.self = cyclic;
  assert.doesNotThrow(() =>
    evaluateNodeTelemetry(node, policy, cyclic, options),
  );
  assert.equal(evaluateNodeTelemetry(node, policy, cyclic, options).allowed, false);

  const secretKey = 'sk_live_SECRET_IN_PROPERTY_NAME';
  const secretNamedProperty = { ...request, [secretKey]: 'value' };
  const secretDecision = evaluateNodeTelemetry(
    node,
    policy,
    secretNamedProperty,
    options,
  );
  assert.equal(secretDecision.allowed, false);
  assert.doesNotMatch(JSON.stringify(secretDecision), new RegExp(secretKey));

  const unmatchedSecretKey = 'sk-proj-EXAMPLESECRET1234567890';
  const unmatchedSecretDecision = evaluateNodeTelemetry(
    node,
    policy,
    { ...request, [unmatchedSecretKey]: 'value' },
    options,
  );
  assert.equal(unmatchedSecretDecision.allowed, false);
  assert.doesNotMatch(
    JSON.stringify(unmatchedSecretDecision),
    new RegExp(unmatchedSecretKey),
  );
});

test('telemetry policy integrity is fixed and fails closed on budget inflation', () => {
  const inflated = { ...policy, maxTotalTokens: policy.maxTotalTokens * 100 };
  const decision = evaluateNodeTelemetry(node, inflated, request, options);
  assert.equal(decision.allowed, false);
  assert.match(decision.errors.join('\n'), /policy integrity/i);
});

test('control-plane graph and node records are integrity-bound', () => {
  const nodeRecord = {
    ...node,
    recordId: 'node:ORCH-004',
    recordType: 'node',
  };
  const graphText = [
    JSON.stringify({ recordId: 'program:root', recordType: 'program' }),
    JSON.stringify(nodeRecord),
  ].join('\n');
  const graphSha256 = createHash('sha256').update(graphText).digest('hex');
  assert.deepEqual(
    validateExecutionAuthoritySnapshot({
      graphText,
      expectedGraphSha256: graphSha256,
      nodeId: node.nodeId,
      nodeRawJson: JSON.stringify(nodeRecord),
    }),
    nodeRecord,
  );
  assert.throws(
    () =>
      validateExecutionAuthoritySnapshot({
        graphText,
        expectedGraphSha256: graphSha256,
        nodeId: node.nodeId,
        nodeRawJson: JSON.stringify({
          ...nodeRecord,
          costBudget: { ...nodeRecord.costBudget, aiUsdHigh: 1000 },
        }),
      }),
    /node integrity/i,
  );
  assert.throws(
    () =>
      validateExecutionAuthoritySnapshot({
        graphText,
        leaseGraphText: `${graphText}\n{"recordType":"node"}`,
        expectedGraphSha256: graphSha256,
        nodeId: node.nodeId,
        nodeRawJson: JSON.stringify(nodeRecord),
      }),
    /lease revision/i,
  );
});

test('control-plane path ignores caller USERPROFILE overrides', () => {
  if (process.platform !== 'win32') return;
  const original = process.env.USERPROFILE;
  const originalPath = process.env.PATH;
  const before = controlPlaneDatabasePath();
  try {
    process.env.USERPROFILE = 'C:\\untrusted-runtime-root';
    process.env.PATH = 'C:\\untrusted-command-path';
    assert.equal(controlPlaneDatabasePath(), before);
  } finally {
    if (original === undefined) delete process.env.USERPROFILE;
    else process.env.USERPROFILE = original;
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test('CLI rejects malformed arguments with a machine-readable denial', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/node-telemetry-gate.mjs', '--input'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  const decision = JSON.parse(result.stdout);
  assert.equal(decision.allowed, false);
  assert.match(decision.errors.join('\n'), /invalid command arguments/i);
});

test('governed lifecycle requires the telemetry gate before completion', () => {
  const agents = readFileSync('AGENTS.md', 'utf8');
  const localSkill = readFileSync(
    '.agents/skills/execution-graph-gate/SKILL.md',
    'utf8',
  );
  const githubSkill = readFileSync(
    '.github/skills/execution-graph-gate/SKILL.md',
    'utf8',
  );
  assert.equal(localSkill, githubSkill);
  assert.match(agents, /telemetry:gate/);
  assert.match(agents, /lifecycle_record_telemetry_decision/);
  assert.match(localSkill, /telemetry:gate/);
  assert.match(localSkill, /lifecycle_record_telemetry_decision/);
  assert.match(localSkill, /before.*checkpoint.*complete/is);
});
