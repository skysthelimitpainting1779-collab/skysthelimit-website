const CONVENTIONAL_SUBJECT =
  /^(feat|fix|chore|docs|infra|refactor|test|style|ci|build|perf|revert)(?:\([a-z0-9_./-]+\))*!?: .{1,200}$/i;
const GIT_SHA = /^[a-f0-9]{40}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;
const CHECKPOINT_ID = /^cp-[a-z0-9][a-z0-9-]{5,100}$/i;

const REQUIRED_TRAILERS = [
  'Execution-Program',
  'Execution-Node',
  'Checkpoint-ID',
  'Evidence-SHA256',
];

const FORBIDDEN_PATH_PATTERNS = [
  /(^|\/)(?:dev\/)?[^/]*\.db(?:-(?:wal|shm|journal))?$/i,
  /(^|\/)graphify-out\//i,
  /(^|\/)\.multigraph\//i,
  /(^|\/)\.agents\/checkpoints\/(?!README\.md$|\.gitkeep$)/i,
  /(^|\/)(?:output|tmp|logs?)\/.*\.log$/i,
];

export function parseLifecycleTrailers(message) {
  const result = new Map();
  for (const line of String(message).split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.+)$/);
    if (match) result.set(match[1], match[2].trim());
  }
  return result;
}

export function validateGovernedCommit(message) {
  const text = String(message || '').trim();
  const subject = text.split(/\r?\n/, 1)[0] || '';
  const values = parseLifecycleTrailers(text);
  const errors = [];
  if (!CONVENTIONAL_SUBJECT.test(subject)) {
    errors.push('subject must follow Conventional Commits');
  }
  for (const name of REQUIRED_TRAILERS) {
    const value = values.get(name);
    if (name === 'Evidence-SHA256') {
      if (!SHA256.test(value || '')) {
        errors.push('missing or invalid Evidence-SHA256 trailer');
      }
    } else if (!value) {
      errors.push(`missing ${name} trailer`);
    }
  }
  return errors;
}

export function validateEvidenceReceipt({
  message,
  config,
  nodeIds,
  receipt,
  receiptSha256,
}) {
  const values = parseLifecycleTrailers(message);
  const errors = [];
  const programId = values.get('Execution-Program');
  const nodeId = values.get('Execution-Node');
  const checkpointId = values.get('Checkpoint-ID');
  const evidenceSha256 = values.get('Evidence-SHA256');
  const knownNodes = nodeIds instanceof Set ? nodeIds : new Set(nodeIds || []);
  const document = receipt && typeof receipt === 'object' ? receipt : {};

  if (programId !== config.programId) {
    errors.push(`Execution-Program must equal ${config.programId}`);
  }
  if (!knownNodes.has(nodeId)) {
    errors.push(`Execution-Node is not present in the audited graph: ${nodeId || '<missing>'}`);
  }
  if (!CHECKPOINT_ID.test(checkpointId || '')) {
    errors.push('Checkpoint-ID must use the cp-<stable-id> format');
  }
  if (evidenceSha256 !== receiptSha256) {
    errors.push('Evidence-SHA256 does not match the committed evidence receipt');
  }
  if (document.schemaVersion !== 1) {
    errors.push('evidence receipt schemaVersion must be 1');
  }
  for (const [field, expected] of [
    ['programId', programId],
    ['nodeId', nodeId],
    ['checkpointId', checkpointId],
    ['graphSha256', config.executionGraph?.sha256],
  ]) {
    if (document[field] !== expected) {
      errors.push(`evidence receipt ${field} does not match its governed commit`);
    }
  }
  if (!GIT_SHA.test(String(document.baseHeadSha || ''))) {
    errors.push('evidence receipt baseHeadSha must be a 40-character Git SHA');
  }
  const verification = Array.isArray(document.verification) ? document.verification : [];
  if (
    verification.length === 0 ||
    verification.some(
      (entry) =>
        !String(entry?.command || '').trim() ||
        entry?.status !== 'passed'
    )
  ) {
    errors.push('evidence receipt requires named passing verification commands');
  }
  return errors;
}

export function findForbiddenPaths(paths) {
  return [...new Set(paths.map((path) => String(path).replaceAll('\\', '/')))]
    .filter((path) => FORBIDDEN_PATH_PATTERNS.some((pattern) => pattern.test(path)))
    .sort();
}

export function validateCheckpointEnvelope(envelope) {
  const document = envelope && typeof envelope === 'object' ? envelope : {};
  const errors = [];
  for (const name of ['programId', 'nodeId', 'stageId', 'repository', 'branch']) {
    if (!String(document[name] || '').trim()) errors.push(`${name} is required`);
  }
  if (!GIT_SHA.test(String(document.headSha || ''))) {
    errors.push('headSha must be a 40-character Git SHA');
  }
  if (!GIT_SHA.test(String(document.treeSha || ''))) {
    errors.push('treeSha must be a 40-character Git SHA');
  }
  if (!SHA256.test(String(document.evidenceSha256 || ''))) {
    errors.push('evidenceSha256 must be a 64-character SHA-256');
  }
  if (document.clean !== true) errors.push('checkpoint requires a clean worktree');
  for (const name of ['nextNode', 'nextStage']) {
    if (!String(document[name] || '').trim()) errors.push(`${name} is required`);
  }
  return errors;
}

export function resolveDeploymentCommit({
  eventName,
  clientPayload = {},
  deployment = {},
}) {
  const candidate =
    eventName === 'repository_dispatch'
      ? clientPayload.git?.sha || clientPayload.sha || clientPayload.commitSha
      : eventName === 'deployment_status'
        ? deployment.sha
        : null;
  return GIT_SHA.test(String(candidate || '')) ? String(candidate) : null;
}
