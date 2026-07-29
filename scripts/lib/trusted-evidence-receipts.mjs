import { createHash } from 'node:crypto';

const TRUSTED_ISSUERS = new Set(['trusted-local-runner', 'github-actions', 'vercel-api']);
const GIT_SHA = /^[0-9a-f]{40}$/i;

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

function receiptBody(input) {
  return {
    schemaVersion: '1.0.0',
    issuer: input.issuer,
    kind: input.kind,
    command: input.command || null,
    exitCode: Number.isInteger(input.exitCode) ? input.exitCode : null,
    providerId: input.providerId || null,
    providerEvidenceId: input.providerEvidenceId || null,
    status: input.status || null,
    conclusion: input.conclusion || null,
    headSha: input.headSha,
    treeSha: input.treeSha || null,
    outputSha256: input.outputSha256 || digest(input.output || ''),
    observedAt: input.observedAt,
  };
}

export function createEvidenceReceipt(input) {
  const body = receiptBody(input);
  return {
    ...body,
    receiptSha256: digest(body),
  };
}

export function validateEvidenceReceipt(receipt) {
  const errors = [];
  if (!isRecord(receipt)) return { ok: false, errors: ['receipt must be an object'] };
  if (receipt.schemaVersion !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (!TRUSTED_ISSUERS.has(receipt.issuer)) errors.push(`issuer is not trusted: ${receipt.issuer || 'missing'}`);
  if (typeof receipt.kind !== 'string' || !receipt.kind.trim()) errors.push('kind is required');
  if (!GIT_SHA.test(String(receipt.headSha || ''))) errors.push('headSha must be a 40-character Git SHA');
  if (receipt.treeSha !== null && !GIT_SHA.test(String(receipt.treeSha || ''))) {
    errors.push('treeSha must be null or a 40-character Git SHA');
  }
  if (!/^[0-9a-f]{64}$/i.test(String(receipt.outputSha256 || ''))) {
    errors.push('outputSha256 must be a SHA-256 digest');
  }
  if (Number.isNaN(Date.parse(receipt.observedAt || ''))) errors.push('observedAt must be a valid timestamp');

  if (receipt.issuer === 'trusted-local-runner') {
    if (typeof receipt.command !== 'string' || !receipt.command.trim()) {
      errors.push('trusted local evidence requires a command');
    }
    if (receipt.exitCode !== 0) errors.push('trusted local command did not pass');
    if (!GIT_SHA.test(String(receipt.treeSha || ''))) {
      errors.push('trusted local evidence requires treeSha');
    }
  }

  if (receipt.issuer === 'github-actions' || receipt.issuer === 'vercel-api') {
    if (typeof receipt.providerEvidenceId !== 'string' || !receipt.providerEvidenceId.trim()) {
      errors.push('provider evidence requires an immutable provider evidence id');
    }
    if (!['passed', 'ready', 'success'].includes(String(receipt.status || receipt.conclusion || '').toLowerCase())) {
      errors.push('provider evidence is not passing');
    }
  }

  const expected = digest(receiptBody(receipt));
  if (receipt.receiptSha256 !== expected) errors.push('receipt integrity hash mismatch');

  return { ok: errors.length === 0, errors };
}
