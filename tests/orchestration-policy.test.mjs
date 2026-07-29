import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSnapshotManifest,
  detectClaimConflicts,
  invalidateSnapshot,
  selectAgentAssignments,
  validateGithubEvidence,
  vercelPreviewDecision,
  verificationTierForChange,
} from '../scripts/lib/orchestration-policy.mjs';

const SHA_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SHA_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

test('resource and interface claims detect hidden shared dependencies', () => {
  const result = detectClaimConflicts([
    { nodeId: 'A', mode: 'write', files: ['src/api/client.ts'], interfaces: ['LeadPayload'] },
    { nodeId: 'B', mode: 'write', files: ['src/ui/form.tsx'], interfaces: ['LeadPayload'] },
    { nodeId: 'C', mode: 'read', files: ['src/api/client.ts'], interfaces: [] },
  ]);

  assert.equal(result.ok, false);
  assert.deepEqual(result.conflicts, [
    {
      kind: 'interface',
      resource: 'LeadPayload',
      nodes: ['A', 'B'],
    },
  ]);
});

test('risk-adaptive scheduling avoids fixed pairs and uses flex capacity for review bottlenecks', () => {
  const result = selectAgentAssignments({
    agents: [
      { id: 'exec-1', capabilities: ['execute'] },
      { id: 'exec-2', capabilities: ['execute'] },
      { id: 'verify-1', capabilities: ['verify'] },
      { id: 'flex-1', capabilities: ['execute', 'verify', 'specialist'] },
    ],
    readyNodes: [
      { id: 'LOW', risk: 'low', claims: ['src/a.ts'], requiredReviews: 1 },
      { id: 'HIGH', risk: 'high', claims: ['convex/schema.ts'], requiredReviews: 2 },
    ],
    verifierQueueDepth: 2,
  });

  assert.equal(result.model, 'risk-adaptive');
  assert.deepEqual(result.assignments.map((assignment) => assignment.role), [
    'executor',
    'executor',
    'verifier',
    'verifier',
  ]);
  assert.equal(result.assignments.some((assignment) => assignment.agentId === 'flex-1' && assignment.role === 'verifier'), true);
  assert.equal(result.assignments.some((assignment) => assignment.nodeId === 'HIGH' && assignment.role === 'executor'), true);
});

test('scheduling uses only bounded agents when one node is executable', () => {
  const result = selectAgentAssignments({
    agents: [
      { id: 'exec-1', capabilities: ['execute'] },
      { id: 'exec-2', capabilities: ['execute'] },
      { id: 'verify-1', capabilities: ['verify'] },
      { id: 'flex-1', capabilities: ['execute', 'verify', 'specialist'] },
    ],
    readyNodes: [{ id: 'ONLY', risk: 'low', claims: ['src/a.ts'], requiredReviews: 1 }],
    verifierQueueDepth: 0,
  });

  assert.deepEqual(result.assignments, [{ agentId: 'exec-1', nodeId: 'ONLY', role: 'executor' }]);
});

test('snapshot manifests are content addressed and invalidate on direct or transitive changes', () => {
  const manifest = createSnapshotManifest({
    gitSha: SHA_A,
    graphSha256: 'g'.repeat(64),
    files: [{ path: 'src/a.ts', sha256: '1'.repeat(64) }],
    interfaces: [{ name: 'LeadPayload', sha256: '2'.repeat(64) }],
    dependencies: [{ from: 'src/a.ts', to: 'src/types.ts', interface: 'LeadPayload' }],
  });
  const again = createSnapshotManifest({
    gitSha: SHA_A,
    graphSha256: 'g'.repeat(64),
    files: [{ sha256: '1'.repeat(64), path: 'src/a.ts' }],
    interfaces: [{ sha256: '2'.repeat(64), name: 'LeadPayload' }],
    dependencies: [{ interface: 'LeadPayload', to: 'src/types.ts', from: 'src/a.ts' }],
  });

  assert.equal(manifest.manifestSha256, again.manifestSha256);
  assert.equal(invalidateSnapshot(manifest, { gitSha: SHA_A, changedFiles: [] }).valid, true);
  assert.equal(invalidateSnapshot(manifest, { gitSha: SHA_B, changedFiles: [] }).valid, false);
  assert.deepEqual(
    invalidateSnapshot(manifest, { gitSha: SHA_A, changedFiles: ['src/a.ts'] }).reasons,
    ['source file changed: src/a.ts'],
  );
  assert.deepEqual(
    invalidateSnapshot(manifest, { gitSha: SHA_A, changedFiles: ['src/types.ts'] }).reasons,
    ['transitive dependency changed: src/types.ts'],
  );
  assert.deepEqual(
    invalidateSnapshot(manifest, { gitSha: SHA_A, changedInterfaces: ['LeadPayload'] }).reasons,
    ['interface changed: LeadPayload'],
  );
});

test('verification tiers escalate from node to wave to release with early gate triggers', () => {
  assert.equal(verificationTierForChange({ changedFiles: ['src/component.tsx'], integratedNodeCount: 1 }).tier, 'node');
  assert.equal(verificationTierForChange({ changedFiles: ['src/types.ts'], sharedInterfaceChanged: true }).tier, 'wave');
  assert.equal(verificationTierForChange({ changedFiles: ['package-lock.json'], integratedNodeCount: 1 }).tier, 'wave');
  assert.equal(verificationTierForChange({ changedFiles: ['src/page.tsx'], releaseCandidate: true }).tier, 'release');
});

test('GitHub evidence requires exact SHA, unique required checks, and non-skipped success', () => {
  const ok = validateGithubEvidence({
    headSha: SHA_A,
    requiredChecks: ['test', 'lint'],
    checkRuns: [
      { name: 'test', headSha: SHA_A, conclusion: 'success', status: 'completed' },
      { name: 'lint', headSha: SHA_A, conclusion: 'success', status: 'completed' },
    ],
  });
  assert.equal(ok.ok, true);

  const stale = validateGithubEvidence({
    headSha: SHA_A,
    requiredChecks: ['test'],
    checkRuns: [{ name: 'test', headSha: SHA_B, conclusion: 'success', status: 'completed' }],
  });
  assert.equal(stale.ok, false);
  assert.match(stale.errors[0], /exact head sha/i);

  const duplicate = validateGithubEvidence({
    headSha: SHA_A,
    requiredChecks: ['test'],
    checkRuns: [
      { name: 'test', headSha: SHA_A, conclusion: 'success', status: 'completed' },
      { name: 'test', headSha: SHA_A, conclusion: 'success', status: 'completed' },
    ],
  });
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.errors[0], /duplicate/i);
});

test('Vercel preview policy deploys wave heads only and rejects superseded or smoke-failed evidence', () => {
  assert.deepEqual(
    vercelPreviewDecision({
      headSha: SHA_A,
      waveHeadSha: SHA_A,
      isWaveGate: true,
      deployment: { commitSha: SHA_A, state: 'READY', smokeStatus: 'passed', superseded: false },
    }),
    { ok: true, action: 'accept_wave_preview', errors: [] },
  );
  assert.equal(vercelPreviewDecision({ headSha: SHA_A, waveHeadSha: SHA_A, isWaveGate: false }).action, 'skip_node_preview');
  assert.equal(
    vercelPreviewDecision({
      headSha: SHA_A,
      waveHeadSha: SHA_A,
      isWaveGate: true,
      deployment: { commitSha: SHA_A, state: 'READY', smokeStatus: 'failed', superseded: false },
    }).ok,
    false,
  );
});
