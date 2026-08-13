#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findForbiddenPaths,
  parseLifecycleTrailers,
  validateEvidenceReceipt,
  validateGovernedCommit,
} from './lib/development-lifecycle.mjs';

const root = resolve(import.meta.dirname, '..');
const configPath = resolve(root, '.agents/governance/development-lifecycle.json');

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function gitBuffer(args) {
  return execFileSync('git', args, {
    cwd: root,
    env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJson(path, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
    return null;
  }
}

function readCommitEvidence(commit, message, config, executionGraph, errors) {
  const errorCount = errors.length;
  const values = parseLifecycleTrailers(message);
  const evidenceSha256 = values.get('Evidence-SHA256');
  if (!/^[a-f0-9]{64}$/.test(evidenceSha256 || '')) {
    return { valid: false, receipt: null, receiptSha256: null };
  }
  const directory = config.evidenceReceipts?.directory;
  if (!directory) {
    errors.push('evidenceReceipts.directory is required');
    return { valid: false, receipt: null, receiptSha256: null };
  }
  const receiptPath = `${directory.replace(/\/+$/, '')}/${evidenceSha256}.json`;
  let bytes;
  try {
    bytes = gitBuffer(['show', `${commit}:${receiptPath}`]);
  } catch {
    errors.push(`${commit}: missing committed evidence receipt ${receiptPath}`);
    return { valid: false, receipt: null, receiptSha256: null };
  }
  const digest = sha256Bytes(bytes);
  let receipt;
  try {
    receipt = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    errors.push(`${commit}: invalid evidence receipt JSON: ${error.message}`);
    return { valid: false, receipt: null, receiptSha256: digest };
  }
  for (const detail of validateEvidenceReceipt({
    message,
    config,
    nodeIds: executionGraph.nodeIds,
    receipt,
    receiptSha256: digest,
  })) {
    errors.push(`${commit}: ${detail}`);
  }
  return {
    valid: errors.length === errorCount,
    receipt,
    receiptSha256: digest,
  };
}

export function validateRemoteMergeReconciliation({
  commit,
  parents,
  receipt,
  receiptSha256,
  config,
  gitRun,
}) {
  const errors = [];
  const policies = Array.isArray(config.remoteStartReconciliations)
    ? config.remoteStartReconciliations
    : [];
  const matchingPolicies = policies.filter(
    (candidate) => candidate?.mergeCommitSha === commit
  );
  if (matchingPolicies.length !== 1) {
    errors.push(`${commit}: merge is not authorized by one exact reconciliation policy`);
    return { errors, reconciledCommits: [] };
  }
  const policy = matchingPolicies[0];
  const reconciliation = receipt?.remoteStartReconciliation;
  if (parents.length !== 2) {
    errors.push(`${commit}: reconciled merge must have exactly two parents`);
    return { errors, reconciledCommits: [] };
  }
  if (!reconciliation || typeof reconciliation !== 'object') {
    errors.push(`${commit}: merge commit lacks remote-start reconciliation evidence`);
    return { errors, reconciledCommits: [] };
  }

  const exactShaFields = [
    'mergeCommitSha',
    'mergeTreeSha',
    'firstParentSha',
    'remoteStartSha',
    'mergeBaseSha',
  ];
  for (const field of exactShaFields) {
    if (!/^[a-f0-9]{40}$/.test(policy[field] || '')) {
      errors.push(`${commit}: reconciliation policy ${field} is invalid`);
    }
  }
  if (!/^[a-f0-9]{64}$/.test(policy.evidenceSha256 || '')) {
    errors.push(`${commit}: reconciliation policy evidenceSha256 is invalid`);
  }
  if (policy.pushedRef !== `refs/heads/${config.integrationBranch}`) {
    errors.push(`${commit}: reconciliation policy does not target the integration branch`);
  }
  if (
    !Number.isSafeInteger(policy.ungovernedCommitCount) ||
    policy.ungovernedCommitCount < 1
  ) {
    errors.push(`${commit}: reconciliation policy commit count is invalid`);
  }
  if (receiptSha256 !== policy.evidenceSha256) {
    errors.push(`${commit}: reconciliation evidence is not the allowlisted receipt`);
  }
  if (receipt.baseHeadSha !== policy.firstParentSha) {
    errors.push(`${commit}: reconciliation receipt base head is not the merge first parent`);
  }
  if (parents[0] !== policy.firstParentSha || parents[1] !== policy.remoteStartSha) {
    errors.push(`${commit}: reconciliation parent order does not match policy`);
  }

  const {
    commitSha: remoteStart,
    fromGovernedHead,
    pushedRef,
    ungovernedCommitCount,
  } = reconciliation;
  if (!/^[a-f0-9]{40}$/.test(remoteStart || '')) {
    errors.push(`${commit}: reconciliation remote start is invalid`);
  }
  if (!/^[a-f0-9]{40}$/.test(fromGovernedHead || '')) {
    errors.push(`${commit}: reconciliation governed head is invalid`);
  }
  if (
    remoteStart !== policy.remoteStartSha ||
    fromGovernedHead !== policy.mergeBaseSha ||
    pushedRef !== policy.pushedRef ||
    ungovernedCommitCount !== policy.ungovernedCommitCount
  ) {
    errors.push(`${commit}: reconciliation receipt does not match exact policy`);
  }
  if (errors.length) return { errors, reconciledCommits: [] };

  const probe = (args, description) => {
    try {
      return gitRun(args);
    } catch {
      errors.push(`${commit}: unable to verify ${description}`);
      return null;
    }
  };
  const isAncestor = (ancestor, descendant) => {
    try {
      gitRun(['merge-base', '--is-ancestor', ancestor, descendant]);
      return true;
    } catch {
      return false;
    }
  };
  if (!isAncestor(config.enforceAfter, policy.mergeBaseSha)) {
    errors.push(`${commit}: reconciled governed head predates the audited baseline`);
  }
  if (!isAncestor(policy.mergeBaseSha, policy.firstParentSha)) {
    errors.push(`${commit}: reconciled governed head is not on the local parent history`);
  }
  if (!isAncestor(policy.mergeBaseSha, policy.remoteStartSha)) {
    errors.push(`${commit}: reconciled governed head is not on the remote history`);
  }
  if (isAncestor(policy.remoteStartSha, policy.firstParentSha)) {
    errors.push(`${commit}: reconciled remote start is already on the local parent history`);
  }
  if (errors.length) return { errors, reconciledCommits: [] };

  const mergeBase = probe(
    ['merge-base', policy.firstParentSha, policy.remoteStartSha],
    'the exact merge base'
  );
  if (mergeBase !== policy.mergeBaseSha) {
    errors.push(`${commit}: reconciliation policy does not name the exact merge base`);
  }
  const mergeTree = probe(
    ['show', '-s', '--format=%T', commit],
    'the allowlisted merge tree'
  );
  if (mergeTree !== policy.mergeTreeSha) {
    errors.push(`${commit}: reconciliation merge tree does not match policy`);
  }
  if (errors.length) return { errors, reconciledCommits: [] };

  const firstParentHistory = probe(
    ['rev-list', '--first-parent', `${policy.mergeBaseSha}..${policy.remoteStartSha}`],
    'the remote first-parent range'
  ) || '';
  const firstParentCommits = firstParentHistory
    .split(/\r?\n/)
    .filter(Boolean);
  const fullHistory = probe(
    ['rev-list', `${policy.mergeBaseSha}..${policy.remoteStartSha}`],
    'the full remote range'
  ) || '';
  const fullCommits = fullHistory
    .split(/\r?\n/)
    .filter(Boolean);
  if (
    firstParentCommits.length !== policy.ungovernedCommitCount ||
    firstParentCommits[0] !== policy.remoteStartSha
  ) {
    errors.push(`${commit}: reconciliation count does not match remote first-parent history`);
  }
  if (
    fullCommits.length !== firstParentCommits.length ||
    fullCommits.some((candidate, index) => candidate !== firstParentCommits[index])
  ) {
    errors.push(`${commit}: reconciled remote range contains side history`);
  }
  for (const candidate of firstParentCommits) {
    const candidateParentText = probe(
      ['show', '-s', '--format=%P', candidate],
      `the parents of reconciled commit ${candidate}`
    ) || '';
    const candidateParents = candidateParentText
      .split(/\s+/)
      .filter(Boolean);
    if (candidateParents.length > 1) {
      errors.push(`${commit}: reconciled remote range contains a merge commit`);
    }
  }
  return {
    errors,
    reconciledCommits: errors.length ? [] : firstParentCommits,
  };
}

export function collectCommitPaths(commits, gitRun) {
  return commits.flatMap((commit) =>
    gitRun([
      'diff-tree',
      '--root',
      '--no-commit-id',
      '--name-only',
      '-r',
      '--diff-merges=first-parent',
      commit,
      '--',
    ])
      .split(/\r?\n/)
      .filter(Boolean)
  );
}

function verifyCommits(config, executionGraph, errors, { head, requireClean }) {
  try {
    git(['cat-file', '-e', `${config.enforceAfter}^{commit}`]);
    git(['cat-file', '-e', `${head}^{commit}`]);
    git(['merge-base', '--is-ancestor', config.enforceAfter, head]);
  } catch {
    errors.push(`audited baseline ${config.enforceAfter} is not an ancestor of ${head}`);
    return {
      commitsChecked: 0,
      reconciledCommitsChecked: 0,
      reconciliationsChecked: 0,
      pathsChecked: 0,
    };
  }

  const commits = git(['rev-list', '--reverse', `${config.enforceAfter}..${head}`])
    .split(/\r?\n/)
    .filter(Boolean);
  const metadata = new Map(
    commits.map((commit) => [
      commit,
      {
        message: git(['show', '-s', '--format=%B', commit]),
        parents: git(['show', '-s', '--format=%P', commit])
          .split(/\s+/)
          .filter(Boolean),
      },
    ])
  );
  const reconciledCommits = new Set();
  const validatedMerges = new Set();
  let commitsChecked = 0;
  let reconciliationsChecked = 0;
  for (const [commit, { message, parents }] of metadata) {
    if (parents.length > 1) {
      commitsChecked += 1;
      reconciliationsChecked += 1;
      validatedMerges.add(commit);
      for (const detail of validateGovernedCommit(message)) {
        errors.push(`${commit}: ${detail}`);
      }
      const evidence = readCommitEvidence(
        commit,
        message,
        config,
        executionGraph,
        errors
      );
      const reconciliation = validateRemoteMergeReconciliation({
        commit,
        parents,
        receipt: evidence.receipt,
        receiptSha256: evidence.valid ? evidence.receiptSha256 : null,
        config,
        gitRun: git,
      });
      for (const detail of reconciliation.errors) errors.push(detail);
      for (const candidate of reconciliation.reconciledCommits) {
        if (!metadata.has(candidate)) {
          errors.push(`${commit}: reconciled remote commit is outside the governed range`);
        } else {
          reconciledCommits.add(candidate);
        }
      }
    }
  }
  for (const [commit, { message }] of metadata) {
    if (validatedMerges.has(commit) || reconciledCommits.has(commit)) continue;
    commitsChecked += 1;
    for (const detail of validateGovernedCommit(message)) {
      errors.push(`${commit}: ${detail}`);
    }
    const evidence = readCommitEvidence(
      commit,
      message,
      config,
      executionGraph,
      errors
    );
    if (evidence.receipt?.remoteStartReconciliation) {
      errors.push(`${commit}: reconciliation evidence is allowed only on its exact merge`);
    }
  }

  const tracked = collectCommitPaths(commits, git);
  const localHead = git(['rev-parse', 'HEAD']);
  const untracked =
    head === localHead
      ? git(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/).filter(Boolean)
      : [];
  const paths = [...new Set([...tracked, ...untracked])];
  for (const path of findForbiddenPaths(paths)) {
    errors.push(`${path}: runtime/generated state must not be committed`);
  }
  if (requireClean && git(['status', '--porcelain=v1', '--untracked-files=all'])) {
    errors.push('worktree must be clean for this lifecycle gate');
  }
  return {
    commitsChecked,
    reconciledCommitsChecked: reconciledCommits.size,
    reconciliationsChecked,
    pathsChecked: paths.length,
  };
}

function verifyExecutionGraph(config, errors) {
  const document = config.executionGraph || {};
  const required = ['path', 'schemaPath', 'validationPath', 'manifestPath', 'sha256'];
  for (const field of required) {
    if (!document[field]) errors.push(`executionGraph.${field} is required`);
  }
  if (document.authoritative !== true) {
    errors.push('executionGraph.authoritative must be true');
  }
  if (errors.length) return null;

  const paths = Object.fromEntries(
    required
      .filter((field) => field.endsWith('Path') || field === 'path')
      .map((field) => [field, resolve(root, document[field])])
  );
  for (const [field, path] of Object.entries(paths)) {
    if (!existsSync(path)) errors.push(`executionGraph.${field} does not exist: ${path}`);
  }
  if (errors.length) return null;

  const digest = sha256(paths.path);
  if (digest !== document.sha256) {
    errors.push(`execution graph SHA-256 mismatch: expected ${document.sha256}, got ${digest}`);
  }
  const validation = readJson(paths.validationPath, errors);
  const manifest = readJson(paths.manifestPath, errors);
  const nodeIds = new Set();
  const sourceRecords = [];
  for (const [index, line] of readFileSync(paths.path, 'utf8').split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      if (record.recordType === 'node' && record.nodeId) nodeIds.add(record.nodeId);
      if (record.recordType === 'source') sourceRecords.push(record);
    } catch (error) {
      errors.push(`execution graph line ${index + 1} is invalid JSON: ${error.message}`);
    }
  }
  if (validation) {
    if (
      validation.ok !== true ||
      validation.parseErrorCount !== 0 ||
      validation.schemaErrorCount !== 0 ||
      validation.semanticErrorCount !== 0
    ) {
      errors.push('audited execution validation is not clean');
    }
    if (validation.sha256 !== digest) {
      errors.push('validation sidecar does not match the execution graph SHA-256');
    }
  }
  if (manifest?.audited?.sha256 !== digest || manifest?.audited?.validationOk !== true) {
    errors.push('audit manifest does not authorize the execution graph SHA-256');
  }
  const sourceBundle = manifest?.retainedSourceBundle;
  const sourceBundlePath = sourceBundle?.path ? resolve(root, sourceBundle.path) : null;
  if (!sourceBundlePath || !existsSync(sourceBundlePath)) {
    errors.push('retained audited source bundle is missing');
  } else {
    const sourceDigest = sha256(sourceBundlePath);
    if (sourceDigest !== sourceBundle.sha256) {
      errors.push('retained audited source bundle SHA-256 mismatch');
    }
    for (const source of sourceRecords) {
      if (
        source.sha256 !== sourceDigest ||
        !String(source.path || '').startsWith(`zip://${sourceBundle.path}!/`)
      ) {
        errors.push(`execution source ${source.recordId} is not bound to the retained bundle`);
      }
    }
  }
  return {
    sha256: digest,
    currentCursor: validation?.currentCursor || null,
    nodeIds,
  };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

export function verifyDevelopmentLifecycle(options = {}) {
  const errors = [];
  const config = readJson(configPath, errors);
  if (!config) return { ok: false, errors };
  if (config.version !== 1) errors.push('development lifecycle version must be 1');
  if (!config.programId) errors.push('programId is required');

  const executionGraph = verifyExecutionGraph(config, errors);
  const head =
    options.head ||
    argumentValue('--head') ||
    process.env.LIFECYCLE_HEAD_SHA ||
    'HEAD';
  const requireClean =
    options.requireClean === true || process.argv.includes('--require-clean');
  const gitState = executionGraph
    ? verifyCommits(config, executionGraph, errors, { head, requireClean })
    : {
        commitsChecked: 0,
        reconciledCommitsChecked: 0,
        reconciliationsChecked: 0,
        pathsChecked: 0,
      };
  return {
    ok: errors.length === 0,
    programId: config.programId,
    baseline: config.enforceAfter,
    head,
    ...gitState,
    executionGraph,
    errors,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  const result = verifyDevelopmentLifecycle();
  if (process.argv.includes('--json') || !result.ok) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      `[Lifecycle] OK: ${result.programId}; ${result.commitsChecked} governed commit(s); ` +
        `graph ${result.executionGraph.sha256.slice(0, 12)}`
    );
  }
  if (!result.ok) process.exitCode = 1;
}
