import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  runProviderAccessPreflight,
  validatePreflightRequest,
} from '../scripts/provider-access-preflight.mjs';

const programId = 'stl-post-g20-sequential-tdd-v1';
const ledger = JSON.parse(
  readFileSync('.agents/governance/provider-access-ledger.json', 'utf8'),
);
const evaluatedAt = new Date(Date.parse(ledger.capturedAt) + 60_000);
const authority = {
  programId,
  checkpointId: 'cp-test-stl104',
  currentNodeId: 'STL-104',
  currentStageId: 'stage:STL-104:implement',
  active: true,
  expiresAt: new Date(evaluatedAt.valueOf() + 15 * 60_000).toISOString(),
};

const validRequest = {
  schemaVersion: '1.0.0',
  nodeId: 'STL-104',
  providerId: 'vercel',
  operation: 'read',
  accountId: 'vsbqTjYBFLBvFoDeklM8rzBb',
  teamId: 'team_bseTA2AuCO6A2fCOVY9ubrJo',
  resourceType: 'deployment',
  resourceId: 'dpl_69Y7A2m1wZsGqy1N1goHp7bLcBFw',
  environment: 'preview',
  permission: 'deployment:preview',
  observedAt: ledger.capturedAt,
};

function evaluate(ledgerInput, request, options = {}) {
  return runProviderAccessPreflight(ledgerInput, request, {
    evaluatedAt,
    authority,
    ...options,
  });
}

function clone(value) {
  return structuredClone(value);
}

test('provider preflight permits only an exact verified non-Production binding', () => {
  assert.deepEqual(validatePreflightRequest(validRequest), []);
  const decision = evaluate(ledger, validRequest);
  assert.equal(decision.allowed, true);
  assert.equal(decision.productionMutationAuthorized, false);
  assert.equal(decision.checks.every(({ status }) => status === 'passed'), true);
  assert.deepEqual(decision.errors, []);
  assert.match(decision.requestSha256, /^[a-f0-9]{64}$/);
  assert.match(decision.providerLedgerSha256, /^[a-f0-9]{64}$/);

  const changedRequest = evaluate(ledger, {
    ...validRequest,
    resourceId: 'different-resource',
  });
  assert.notEqual(changedRequest.requestSha256, decision.requestSha256);
  assert.equal(
    changedRequest.providerLedgerSha256,
    decision.providerLedgerSha256,
  );
});

test('provider preflight fails closed on every binding mismatch', () => {
  const cases = [
    ['accountId', 'wrong-account', /account identity mismatch/i],
    ['teamId', 'wrong-team', /team identity mismatch/i],
    ['resourceType', 'project', /resource mismatch/i],
    ['resourceId', 'wrong-resource', /resource mismatch/i],
    ['environment', 'production', /environment mismatch|Production mutation/i],
    ['permission', 'project:write', /permission mismatch/i],
    ['nodeId', 'STL-999', /node binding mismatch|active lifecycle node/i],
    ['providerId', 'missing-provider', /provider is not present/i],
  ];

  for (const [field, value, pattern] of cases) {
    const decision = evaluate(ledger, {
      ...validRequest,
      [field]: value,
    });
    assert.equal(decision.allowed, false, field);
    assert.match(decision.errors.join('\n'), pattern, field);
  }
});

test('OAuth and provider mutation reject unverified access and Production', () => {
  const oauth = evaluate(ledger, {
    ...validRequest,
    operation: 'oauth',
    accountId: 'wrong-account',
  });
  assert.equal(oauth.allowed, false);
  assert.match(oauth.errors.join('\n'), /account identity mismatch/i);

  const stripe = evaluate(ledger, {
    ...validRequest,
    nodeId: 'STL-208',
    providerId: 'stripe',
    accountId: 'not-observed',
    teamId: null,
    resourceType: 'account',
    resourceId: 'not-observed',
    environment: 'test',
    permission: 'test:unverified',
  });
  assert.equal(stripe.allowed, false);
  assert.match(
    stripe.errors.join('\n'),
    /provider access is not verified|account identity is not verified/i,
  );

  const production = evaluate(ledger, {
    ...validRequest,
    operation: 'mutate',
    environment: 'production',
  });
  assert.equal(production.allowed, false);
  assert.equal(production.productionMutationAuthorized, false);
  assert.match(
    production.errors.join('\n'),
    /Production mutation|approved non-Production environment/i,
  );

  const readOnlyMutation = evaluate(ledger, {
    ...validRequest,
    operation: 'mutate',
    permission: 'project:read',
  });
  assert.equal(readOnlyMutation.allowed, false);
  assert.match(
    readOnlyMutation.errors.join('\n'),
    /read-only permission|write capability/i,
  );

  const staleObservation = evaluate(ledger, {
    ...validRequest,
    observedAt: '2020-01-01T00:00:00Z',
  });
  assert.equal(staleObservation.allowed, false);
  assert.match(staleObservation.errors.join('\n'), /stale observation/i);
});

test('preflight binds to the canonical program and active lifecycle node', () => {
  const wrongProgram = clone(ledger);
  wrongProgram.programId = 'different-program';
  assert.match(
    evaluate(wrongProgram, validRequest).errors.join('\n'),
    /program/i,
  );

  const wrongNode = evaluate(ledger, validRequest, {
    authority: { ...authority, currentNodeId: 'ORCH-003' },
  });
  assert.equal(wrongNode.allowed, false);
  assert.match(wrongNode.errors.join('\n'), /active lifecycle node/i);

  const expired = evaluate(ledger, validRequest, {
    authority: { ...authority, active: false },
  });
  assert.equal(expired.allowed, false);
  assert.match(expired.errors.join('\n'), /active lifecycle lease/i);
});

test('stale or unverified provider evidence cannot authorize access', () => {
  const staleLedger = clone(ledger);
  staleLedger.capturedAt = '2020-01-01T00:00:00Z';
  const stale = evaluate(staleLedger, validRequest);
  assert.equal(stale.allowed, false);
  assert.match(stale.errors.join('\n'), /ledger observation is stale/i);

  const unverifiedLedger = clone(ledger);
  const provider = unverifiedLedger.providers.find(
    ({ providerId }) => providerId === 'vercel',
  );
  for (const evidence of provider.evidence) {
    evidence.verificationStatus = 'unverified';
  }
  const unverified = evaluate(unverifiedLedger, validRequest);
  assert.equal(unverified.allowed, false);
  assert.match(unverified.errors.join('\n'), /provider evidence/i);
});

test('mutation requires an explicit write capability in an approved environment', () => {
  const mutationLedger = clone(ledger);
  const provider = mutationLedger.providers.find(
    ({ providerId }) => providerId === 'vercel',
  );
  if (!provider.permissions.includes('deployment:preview-write')) {
    provider.permissions.push('deployment:preview-write');
  }
  provider.permissions.push('deployment:viewer');

  const validMutation = evaluate(mutationLedger, {
    ...validRequest,
    operation: 'mutate',
    permission: 'deployment:preview-write',
  });
  assert.equal(validMutation.allowed, true);

  const viewerMutation = evaluate(mutationLedger, {
    ...validRequest,
    operation: 'mutate',
    permission: 'deployment:viewer',
  });
  assert.equal(viewerMutation.allowed, false);
  assert.match(viewerMutation.errors.join('\n'), /write capability/i);

  for (const environmentName of ['prod', 'production ', 'customer']) {
    const hostileLedger = clone(mutationLedger);
    const hostileProvider = hostileLedger.providers.find(
      ({ providerId }) => providerId === 'vercel',
    );
    const resource = hostileProvider.resources.find(
      ({ id }) => id === validRequest.resourceId,
    );
    const environment = hostileProvider.environments.find(
      ({ name }) => name === 'preview',
    );
    resource.environment = environmentName;
    environment.name = environmentName;

    const decision = evaluate(hostileLedger, {
      ...validRequest,
      operation: 'mutate',
      environment: environmentName,
      permission: 'deployment:preview-write',
    });
    assert.equal(decision.allowed, false, environmentName);
    assert.match(
      decision.errors.join('\n'),
      /approved non-Production environment|environment.*canonical|production access must be blocked/i,
      environmentName,
    );
  }
});

test('verified shared project is valid only through exact non-Production environment membership', () => {
  const sharedProjectLedger = clone(ledger);
  const provider = sharedProjectLedger.providers.find(
    ({ providerId }) => providerId === 'vercel',
  );
  if (!provider.permissions.includes('deployment:preview-write')) {
    provider.permissions.push('deployment:preview-write');
  }
  if (!provider.requiredForNodes.includes('STL-206')) {
    provider.requiredForNodes.push('STL-206');
  }

  const request = {
    ...validRequest,
    nodeId: 'STL-206',
    operation: 'mutate',
    resourceType: 'project',
    resourceId: 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m',
    permission: 'deployment:preview-write',
  };
  const stl206Authority = {
    ...authority,
    currentNodeId: 'STL-206',
    checkpointId: 'cp-test-stl206',
  };

  const allowed = evaluate(sharedProjectLedger, request, {
    authority: stl206Authority,
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.productionMutationAuthorized, false);
  assert.equal(allowed.checks.every(({ status }) => status === 'passed'), true);

  for (const mutation of [
    (candidate) => {
      candidate.environments.find(({ name }) => name === 'preview').resourceIds =
        [];
    },
    (candidate) => {
      candidate.environments.find(
        ({ name }) => name === 'preview',
      ).verificationStatus = 'unverified';
    },
    (candidate) => {
      candidate.resources.find(
        ({ id }) => id === request.resourceId,
      ).verificationStatus = 'unverified';
    },
  ]) {
    const hostileLedger = clone(sharedProjectLedger);
    mutation(
      hostileLedger.providers.find(
        ({ providerId }) => providerId === 'vercel',
      ),
    );
    const denied = evaluate(hostileLedger, request, {
      authority: stl206Authority,
    });
    assert.equal(denied.allowed, false);
    assert.match(
      denied.errors.join('\n'),
      /resource mismatch|environment mismatch/i,
    );
  }

  const production = evaluate(sharedProjectLedger, {
    ...request,
    environment: 'production',
  }, {
    authority: stl206Authority,
  });
  assert.equal(production.allowed, false);
  assert.equal(production.productionMutationAuthorized, false);
  assert.match(
    production.errors.join('\n'),
    /approved non-Production environment|Production mutation/i,
  );
});

test('preflight request validation rejects unknown, malformed, or secret input', () => {
  assert.match(
    validatePreflightRequest({
      ...validRequest,
      apiToken: 'sk_live_not_allowed_here',
    }).join('\n'),
    /unknown field|secret/i,
  );
  assert.match(
    validatePreflightRequest({
      ...validRequest,
      accountId: 'ghp_abcdefghijklmnopqrstuvwxyz123456',
    }).join('\n'),
    /secret/i,
  );
  assert.match(
    validatePreflightRequest({
      ...validRequest,
      observedAt: '2026-02-30T00:00:00Z',
    }).join('\n'),
    /observedAt/i,
  );

  const cyclic = { ...validRequest };
  cyclic.self = cyclic;
  assert.doesNotThrow(() => evaluate(ledger, cyclic));
  assert.equal(evaluate(ledger, cyclic).allowed, false);
  assert.doesNotThrow(() =>
    evaluate(ledger, { ...validRequest, unexpected: 1n }),
  );

  const secretProvider = evaluate(ledger, {
    ...validRequest,
    providerId: 'ghp_abcdefghijklmnopqrstuvwxyz123456',
  });
  assert.equal(secretProvider.allowed, false);
  assert.doesNotMatch(
    JSON.stringify(secretProvider),
    /ghp_abcdefghijklmnopqrstuvwxyz123456/,
  );
});

test('CLI emits a machine-readable decision and uses its exit status as the gate', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'provider-preflight-'));
  const input = join(workspace, 'request.json');
  const runCli = (args) =>
    spawnSync(
      process.execPath,
      ['scripts/provider-access-preflight.mjs', ...args],
      { encoding: 'utf8' },
    );

  try {
    writeFileSync(input, JSON.stringify(validRequest), 'utf8');
    const governed = runCli(['--input', input]);
    assert.equal(governed.status, 1, governed.stderr || governed.stdout);
    const governedDecision = JSON.parse(governed.stdout);
    assert.equal(governedDecision.allowed, false);
    assert.match(
      governedDecision.errors.join('\n'),
      /active lifecycle node|active lifecycle lease|stale/i,
    );

    writeFileSync(
      input,
      JSON.stringify({ ...validRequest, teamId: 'wrong-team' }),
      'utf8',
    );
    const denied = runCli(['--input', input]);
    assert.equal(denied.status, 1);
    assert.equal(JSON.parse(denied.stdout).allowed, false);

    const missing = runCli(['--input', join(workspace, 'missing.json')]);
    assert.equal(missing.status, 1);
    assert.doesNotMatch(
      missing.stdout,
      new RegExp(workspace.replace(/\\/g, '\\\\')),
    );

    for (const args of [
      ['--input', input, '--ledger'],
      ['--input', input, '--unknown', 'value'],
      ['--input', input, '--input', input],
    ]) {
      const malformedArguments = runCli(args);
      assert.equal(malformedArguments.status, 1);
      assert.match(malformedArguments.stdout, /invalid command arguments/i);
    }

    const secret = 'sk_live_SUPERSECRETVALUE';
    writeFileSync(input, `{"providerId":${secret}}`, 'utf8');
    const malformedJson = runCli(['--input', input]);
    assert.equal(malformedJson.status, 1);
    assert.doesNotMatch(malformedJson.stdout, new RegExp(secret));

    const invalidLedgerPath = join(workspace, 'invalid-ledger.json');
    writeFileSync(
      invalidLedgerPath,
      `{"providerId":${secret}}`,
      'utf8',
    );
    const ledgerVerification = spawnSync(
      process.execPath,
      ['scripts/verify-provider-access-ledger.mjs', invalidLedgerPath],
      { encoding: 'utf8' },
    );
    assert.equal(ledgerVerification.status, 1);
    assert.doesNotMatch(
      `${ledgerVerification.stdout}${ledgerVerification.stderr}`,
      new RegExp(secret),
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('Codex and GitHub install the same fail-closed preflight skill', () => {
  const agentsSkill = readFileSync(
    '.agents/skills/provider-access-preflight/SKILL.md',
    'utf8',
  );
  const githubSkill = readFileSync(
    '.github/skills/provider-access-preflight/SKILL.md',
    'utf8',
  );
  assert.equal(agentsSkill, githubSkill);
  assert.match(agentsSkill, /providers:preflight/);
  assert.match(agentsSkill, /stop on any nonzero exit/i);
  assert.match(agentsSkill, /before OAuth or provider mutation/i);
  assert.match(agentsSkill, /never performs the provider operation/i);
  assert.match(agentsSkill, /active lifecycle lease/i);
  assert.match(agentsSkill, /canonical provider ledger/i);
  assert.match(agentsSkill, /deployment:preview-write/);
  assert.match(agentsSkill, /classified as `shared`/i);
  assert.match(agentsSkill, /refresh-vercel-ledger\.mjs/);
});
