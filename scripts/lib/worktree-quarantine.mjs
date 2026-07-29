import { createHash } from 'node:crypto';

function sha256(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function parsePorcelainLine(line) {
  if (!line.trim()) return null;
  if (line.startsWith('?? ')) {
    return { status: '??', path: line.slice(3).trim(), untracked: true };
  }
  const status = line.slice(0, 2);
  const rawPath = line.slice(3).trim();
  const path = rawPath.includes(' -> ') ? rawPath.split(' -> ').at(-1).trim() : rawPath;
  return { status, path, untracked: false };
}

export function parsePorcelain(porcelain = '') {
  return String(porcelain)
    .split(/\r?\n/)
    .map(parsePorcelainLine)
    .filter(Boolean);
}

export function classifyWorktree(input) {
  const changes = parsePorcelain(input.porcelain);
  const changedFiles = [...new Set(changes.map((change) => change.path))].sort((a, b) => a.localeCompare(b));
  const untrackedFiles = [...new Set(changes.filter((change) => change.untracked).map((change) => change.path))].sort(
    (a, b) => a.localeCompare(b),
  );
  const base = {
    path: input.path,
    branch: input.branch,
    headSha: input.headSha,
    checkpointHeadSha: input.checkpointHeadSha || null,
    changedFiles,
    untrackedFiles,
    changeCount: changes.length,
    preservationRequired: false,
    safeToResume: false,
    reason: null,
  };

  if (input.branch !== input.expectedBranch) {
    return {
      ...base,
      classification: 'QUARANTINE',
      reason: `worktree branch ${input.branch || 'unknown'} does not match ${input.expectedBranch || 'unknown'}`,
    };
  }
  if (input.auditedHeadIsAncestor !== true) {
    return {
      ...base,
      classification: 'QUARANTINE',
      reason: 'audited head is not an ancestor of the worktree head',
    };
  }
  if (changes.length > 0) {
    return {
      ...base,
      classification: 'DIRTY_PRESERVE',
      preservationRequired: true,
      reason: 'worktree has uncommitted or untracked changes',
    };
  }
  if (input.checkpointHeadSha && input.headSha !== input.checkpointHeadSha) {
    return {
      ...base,
      classification: 'QUARANTINE',
      reason: 'worktree head is a descendant or sibling without a matching completed checkpoint',
    };
  }
  return {
    ...base,
    classification: 'CLEAN_RESUMABLE',
    safeToResume: true,
  };
}

export function createQuarantinePlan(classification, options = {}) {
  const capturedAt = options.capturedAt || new Date().toISOString();
  const diffText = String(options.diffText || '');
  const payload = {
    schemaVersion: '1.0.0',
    capturedAt,
    worktree: {
      path: classification.path,
      branch: classification.branch,
      headSha: classification.headSha,
      checkpointHeadSha: classification.checkpointHeadSha,
      classification: classification.classification,
      reason: classification.reason,
      changedFiles: classification.changedFiles,
      untrackedFiles: classification.untrackedFiles,
    },
    diffSha256: sha256(diffText),
  };
  const quarantineId = sha256(JSON.stringify(payload));
  return {
    action:
      classification.classification === 'CLEAN_RESUMABLE'
        ? 'NO_QUARANTINE_REQUIRED'
        : 'PRESERVE_AND_QUARANTINE',
    discardAllowed: false,
    quarantineId,
    capturedAt,
    artifacts: [
      {
        kind: 'git_diff',
        sha256: payload.diffSha256,
        bytes: Buffer.byteLength(diffText, 'utf8'),
      },
      {
        kind: 'quarantine_manifest',
        sha256: quarantineId,
      },
    ],
    manifest: payload,
  };
}
