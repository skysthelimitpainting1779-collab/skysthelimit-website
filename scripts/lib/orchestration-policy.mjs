import { createHash } from 'node:crypto';

const GIT_SHA = /^[0-9a-f]{40}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function digest(value) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function sortedUnique(values = []) {
  return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b));
}

function conflictKeys(claim) {
  return [
    ...sortedUnique(claim.files).map((resource) => ({ kind: 'file', resource })),
    ...sortedUnique(claim.resources).map((resource) => ({ kind: 'resource', resource })),
    ...sortedUnique(claim.interfaces).map((resource) => ({ kind: 'interface', resource })),
  ];
}

export function detectClaimConflicts(claims = []) {
  const writersByResource = new Map();
  for (const claim of claims) {
    if (claim?.mode !== 'write') continue;
    for (const key of conflictKeys(claim)) {
      const id = `${key.kind}\0${key.resource}`;
      const item = writersByResource.get(id) || { ...key, nodes: [] };
      item.nodes.push(claim.nodeId);
      writersByResource.set(id, item);
    }
  }
  const conflicts = [...writersByResource.values()]
    .filter((item) => new Set(item.nodes).size > 1)
    .map((item) => ({ ...item, nodes: sortedUnique(item.nodes) }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.resource.localeCompare(b.resource));

  return { ok: conflicts.length === 0, conflicts };
}

function riskRank(node) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[node?.risk] || 1;
}

function agentWithCapability(agents, capability, used) {
  return agents.find((agent) => !used.has(agent.id) && (agent.capabilities || []).includes(capability));
}

export function selectAgentAssignments(input) {
  const agents = [...(input.agents || [])].sort((a, b) => a.id.localeCompare(b.id));
  const nodes = [...(input.readyNodes || [])]
    .filter((node) => node.blocked !== true)
    .sort((a, b) => riskRank(b) - riskRank(a) || a.id.localeCompare(b.id));
  const used = new Set();
  const assignments = [];

  const executorSlots = Math.min(2, nodes.length);
  for (const node of nodes.slice(0, executorSlots)) {
    const agent = agentWithCapability(agents, 'execute', used);
    if (!agent) break;
    assignments.push({ agentId: agent.id, nodeId: node.id, role: 'executor' });
    used.add(agent.id);
  }

  if (nodes.length > 1 || input.verifierQueueDepth > 0) {
    const reviewNodes = nodes
      .filter((node) => (node.requiredReviews || 1) > 0)
      .sort((a, b) => (b.requiredReviews || 1) - (a.requiredReviews || 1) || riskRank(b) - riskRank(a));
    let remainingVerifierSlots = Math.max(0, agents.length - used.size);
    for (const node of reviewNodes) {
      if (remainingVerifierSlots <= 0) break;
      const agent = agentWithCapability(agents, 'verify', used);
      if (!agent) break;
      assignments.push({ agentId: agent.id, nodeId: node.id, role: 'verifier' });
      used.add(agent.id);
      remainingVerifierSlots -= 1;
    }
  }

  return { model: 'risk-adaptive', assignments };
}

export function createSnapshotManifest(input) {
  const body = {
    schemaVersion: '1.0.0',
    gitSha: input.gitSha,
    graphSha256: input.graphSha256,
    files: [...(input.files || [])]
      .map((file) => (typeof file === 'string' ? { path: file, sha256: null } : file))
      .sort((a, b) => a.path.localeCompare(b.path)),
    interfaces: [...(input.interfaces || [])].sort((a, b) => a.name.localeCompare(b.name)),
    dependencies: [...(input.dependencies || [])].sort(
      (a, b) =>
        String(a.from).localeCompare(String(b.from)) ||
        String(a.to).localeCompare(String(b.to)) ||
        String(a.interface || '').localeCompare(String(b.interface || '')),
    ),
  };
  return {
    ...body,
    manifestSha256: digest(body),
  };
}

export function invalidateSnapshot(manifest, changes = {}) {
  const reasons = [];
  if (changes.gitSha && changes.gitSha !== manifest.gitSha) reasons.push('git sha changed');
  const changedFiles = new Set(changes.changedFiles || []);
  const changedInterfaces = new Set(changes.changedInterfaces || []);
  const directFiles = new Set((manifest.files || []).map((file) => file.path || file));
  for (const file of [...changedFiles].sort((a, b) => a.localeCompare(b))) {
    if (directFiles.has(file)) reasons.push(`source file changed: ${file}`);
  }
  for (const dependency of manifest.dependencies || []) {
    if (changedFiles.has(dependency.to)) reasons.push(`transitive dependency changed: ${dependency.to}`);
    if (dependency.interface && changedInterfaces.has(dependency.interface)) {
      reasons.push(`interface changed: ${dependency.interface}`);
    }
  }
  for (const item of manifest.interfaces || []) {
    if (changedInterfaces.has(item.name)) reasons.push(`interface changed: ${item.name}`);
  }
  return { valid: reasons.length === 0, reasons: sortedUnique(reasons) };
}

export function verificationTierForChange(input = {}) {
  const changedFiles = input.changedFiles || [];
  const checks = ['focused_tests'];
  let tier = 'node';
  const waveTriggers = [
    input.sharedInterfaceChanged,
    input.providerChanged,
    input.integratedNodeCount >= 4,
    changedFiles.some((file) => /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(file)),
  ];

  if (input.releaseCandidate) tier = 'release';
  else if (waveTriggers.some(Boolean)) tier = 'wave';

  if (tier === 'wave') checks.push('typecheck', 'lint', 'affected_tests', 'build');
  if (tier === 'release') checks.push('typecheck', 'lint', 'full_tests', 'production_build', 'provider_preflight');
  return { tier, checks };
}

export function validateGithubEvidence(input) {
  const errors = [];
  if (!GIT_SHA.test(String(input.headSha || ''))) errors.push('headSha must be a 40-character Git SHA');
  const byName = new Map();
  for (const run of input.checkRuns || []) {
    const list = byName.get(run.name) || [];
    list.push(run);
    byName.set(run.name, list);
  }
  for (const required of input.requiredChecks || []) {
    const runs = byName.get(required) || [];
    if (runs.length === 0) {
      errors.push(`required check missing: ${required}`);
      continue;
    }
    if (runs.length > 1) {
      errors.push(`duplicate required check name: ${required}`);
      continue;
    }
    const run = runs[0];
    if (run.headSha !== input.headSha) errors.push(`required check ${required} is not bound to exact head sha`);
    if (run.status !== 'completed') errors.push(`required check ${required} is not completed`);
    if (run.conclusion !== 'success') errors.push(`required check ${required} did not succeed`);
  }
  return { ok: errors.length === 0, errors };
}

export function vercelPreviewDecision(input = {}) {
  if (!input.isWaveGate) return { ok: true, action: 'skip_node_preview', errors: [] };
  const errors = [];
  const deployment = input.deployment || {};
  if (input.headSha !== input.waveHeadSha) errors.push('preview may only bind to the exact wave head');
  if (deployment.commitSha !== input.waveHeadSha) errors.push('deployment commit does not match wave head');
  if (deployment.state !== 'READY') errors.push('deployment is not READY');
  if (deployment.smokeStatus !== 'passed') errors.push('deployment smoke tests did not pass');
  if (deployment.superseded === true) errors.push('deployment has been superseded');
  return { ok: errors.length === 0, action: errors.length ? 'reject_wave_preview' : 'accept_wave_preview', errors };
}
