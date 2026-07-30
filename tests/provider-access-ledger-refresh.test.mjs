import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { refreshVercelProviderLedger } from '../.agents/skills/provider-access-preflight/scripts/refresh-vercel-ledger.mjs';

const ledger = JSON.parse(
  readFileSync('.agents/governance/provider-access-ledger.json', 'utf8'),
);
const observation = {
  schemaVersion: '1.0.0',
  providerId: 'vercel',
  observedAt: '2026-07-30T19:32:59.302Z',
  accountId: 'vsbqTjYBFLBvFoDeklM8rzBb',
  teamId: 'team_bseTA2AuCO6A2fCOVY9ubrJo',
  projectId: 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m',
  projectName: 'website',
  environment: 'preview',
  readOnly: true,
};
const readyExport = {
  source: {
    kind: 'authoritative-lifecycle-ledger',
    programId: 'stl-post-g20-sequential-tdd-v1',
    head: '77693fa2c8129f176d83f2f34938bf27ba88c219',
  },
  target: {
    headSha: '77693fa2c8129f176d83f2f34938bf27ba88c219',
    clean: true,
  },
  boundary: {
    allowedEnvironments: ['local', 'preview', 'test', 'sandbox'],
    allowPreviewDeployments: true,
    allowProductionMutations: false,
    productionMutationAuthorized: false,
  },
  readyNodes: [
    {
      id: 'STL-206',
      permissions: ['deployment:preview:write'],
      resourceLocks: ['vercel:preview'],
      lifecycle: { authoritative: true, status: 'ready' },
    },
  ],
};

test('refreshes only the exact observed Vercel Preview binding authorized by the ready export', () => {
  const staleLedger = structuredClone(ledger);
  const staleProvider = staleLedger.providers.find(
    ({ providerId }) => providerId === 'vercel',
  );
  staleProvider.permissions = staleProvider.permissions.filter(
    (permission) => permission !== 'deployment:preview-write',
  );
  staleProvider.requiredForNodes = staleProvider.requiredForNodes.filter(
    (nodeId) => nodeId !== 'STL-206',
  );
  const refreshed = refreshVercelProviderLedger(
    staleLedger,
    observation,
    readyExport,
    'STL-206',
  );
  const provider = refreshed.providers.find(
    ({ providerId }) => providerId === 'vercel',
  );
  const project = provider.resources.find(
    ({ id }) => id === observation.projectId,
  );

  assert.equal(refreshed.capturedAt, observation.observedAt);
  assert.equal(refreshed.productionMutationAuthorized, false);
  assert.equal(project.environment, 'shared');
  assert.equal(project.verificationStatus, 'verified');
  assert.equal(
    provider.environments
      .find(({ name }) => name === 'preview')
      .resourceIds.includes(observation.projectId),
    true,
  );
  assert.equal(provider.requiredForNodes.includes('STL-206'), true);
  assert.equal(
    provider.permissions.includes('deployment:preview-write'),
    true,
  );
  assert.equal(provider.secretMaterialStored, false);
  assert.equal(
    staleLedger.providers
      .find(({ providerId }) => providerId === 'vercel')
      .requiredForNodes.includes('STL-206'),
    false,
  );
});

test('refresh rejects mismatched identity, Production, secrets, or non-authoritative readiness', () => {
  for (const candidate of [
    { ...observation, projectId: 'prj_wrong' },
    { ...observation, environment: 'production' },
    { ...observation, readOnly: false },
    { ...observation, credential: 'forbidden' },
  ]) {
    assert.throws(
      () =>
        refreshVercelProviderLedger(ledger, candidate, readyExport, 'STL-206'),
      /observation|project|preview|read-only|unknown/i,
    );
  }

  assert.throws(
    () =>
      refreshVercelProviderLedger(
        ledger,
        observation,
        {
          ...readyExport,
          boundary: {
            ...readyExport.boundary,
            productionMutationAuthorized: true,
          },
        },
        'STL-206',
      ),
    /Production|boundary/i,
  );
  assert.throws(
    () =>
      refreshVercelProviderLedger(
        ledger,
        observation,
        { ...readyExport, readyNodes: [] },
        'STL-206',
      ),
    /authoritative ready node/i,
  );
});
