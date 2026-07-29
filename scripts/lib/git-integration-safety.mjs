const GIT_SHA = /^[0-9a-f]{40}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;

function validGitSha(value) {
  return GIT_SHA.test(String(value || ''));
}

function validSha256(value) {
  return SHA256.test(String(value || ''));
}

function result(errors, warnings = []) {
  return { ok: errors.length === 0, errors, warnings };
}

export function validateIntegrationCandidate(input) {
  const errors = [];
  const warnings = [];
  const ancestors = new Set(input.integrationHeadAncestors || []);

  for (const field of ['auditedHeadSha', 'integrationHeadSha', 'workerBaseSha', 'workerHeadSha']) {
    if (!validGitSha(input[field])) errors.push(`${field} must be a 40-character Git SHA`);
  }
  if (input.workerClean !== true) errors.push('worker integration candidate is dirty');
  if (!ancestors.has(input.auditedHeadSha)) {
    errors.push('audited head is not ancestral to the integration head');
  }
  if (input.workerBaseSha !== input.integrationHeadSha) {
    errors.push('worker candidate was produced from a stale base');
  }
  if (input.workerHeadSha === input.integrationHeadSha) {
    warnings.push('worker candidate has no new commit beyond integration head');
  }

  const authorityFiles = input.executionAuthorityFiles || [];
  const auditedAuthorityFiles = authorityFiles.filter((file) => /-audited\.jsonl$/i.test(file));
  if (auditedAuthorityFiles.length !== 1) {
    errors.push('duplicate execution authority files are not allowed');
  }

  return result(errors, warnings);
}

export function validateWorktreeCleanup(input) {
  const errors = [];
  const reachable = new Set(input.reachableShas || []);
  const headReachable = reachable.has(input.headSha);
  const hasQuarantine = validSha256(input.quarantineId);
  const hasArchive = validSha256(input.archiveSha256);

  if (!validGitSha(input.headSha)) errors.push('headSha must be a 40-character Git SHA');
  if (input.classification === 'DIRTY_PRESERVE' && !hasQuarantine) {
    errors.push('dirty worktree cleanup requires a quarantine preservation record');
  }
  if (!headReachable && !hasArchive) {
    errors.push('worktree head must be reachable or archived before cleanup');
  }
  if (input.classification === 'QUARANTINE' && !hasQuarantine) {
    errors.push('quarantined worktree cleanup requires a quarantine id');
  }

  return errors.length
    ? { ok: false, action: 'REMOVE_WORKTREE_BLOCKED', errors }
    : { ok: true, action: 'REMOVE_WORKTREE_ALLOWED', errors: [] };
}
