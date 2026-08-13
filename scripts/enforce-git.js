#!/usr/bin/env node
/**
 * Git standards: protected branches, governed branch patterns, and Conventional Commits.
 * Safe on Windows and CI: execFileSync only, with no shell expansion.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const policy = JSON.parse(
  readFileSync(resolve(root, 'config/platform-foundation.json'), 'utf8'),
);
const PROTECTED = new Set(policy.branches.protected);
const ALLOWED_PATTERNS = [
  ...policy.branches.integrationSources,
  ...policy.branches.releaseSources,
];

const CC_RE =
  /^(feat|fix|chore|docs|infra|refactor|test|style|ci|build|perf|revert)(?:\([a-z0-9_./-]+\))*!?: .{1,200}/i;
const MERGE_RE = /^Merge (pull request|branch|remote-tracking branch)\b/i;
const REVERT_RE = /^Revert\b/i;

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function matchesPattern(branch, pattern) {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return branch.startsWith(prefix) && branch.length > prefix.length;
  }
  return branch === pattern;
}

function getBranchName() {
  if (process.env.GITHUB_ACTIONS) {
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      return process.env.GITHUB_HEAD_REF || '';
    }
    return process.env.GITHUB_REF_NAME || '';
  }
  return git(['rev-parse', '--abbrev-ref', 'HEAD']);
}

function readPullRequestTitle() {
  if (!process.env.GITHUB_EVENT_PATH) return '';
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    return String(event?.pull_request?.title || '').trim();
  } catch {
    return '';
  }
}

export function getCommitMessagesToCheck() {
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const title = readPullRequestTitle();
    return title ? [title] : [];
  }

  try {
    const head = git(['log', '-1', '--pretty=format:%B']);
    return head ? [head] : [];
  } catch {
    return [];
  }
}

export function isCommitOk(msg) {
  const first = String(msg || '').trim().split(/\r?\n/)[0] || '';
  if (!first) return false;
  if (MERGE_RE.test(first) || REVERT_RE.test(first)) return true;
  if (CC_RE.test(first)) return true;
  if (/^Bump /i.test(first)) return true;
  return false;
}

export function runGitGuard() {
  console.log('[Git Guard] Running Git standards compliance check...');

  try {
    const branchName = getBranchName();
    console.log(`[Git Guard] Branch: "${branchName}"`);

    if (!branchName) {
      console.warn('[Git Guard] Could not resolve branch name; skipping branch check.');
    } else if (PROTECTED.has(branchName)) {
      console.log(
        `\x1b[33m[WARNING] On protected branch "${branchName}". Changes require a governed pull request.\x1b[0m`,
      );
    } else if (branchName === 'HEAD') {
      console.log('[Git Guard] Detached HEAD — skipping branch check.');
    } else {
      const ok = ALLOWED_PATTERNS.some((pattern) =>
        matchesPattern(branchName, pattern),
      );
      if (!ok) {
        console.error(`\x1b[31m[ERROR] Invalid branch name: "${branchName}".\x1b[0m`);
        console.error('[ERROR] Allowed patterns:', ALLOWED_PATTERNS.join(' '));
        return 1;
      }
      console.log('\x1b[32m[Git Guard] Branch name OK.\x1b[0m');
    }

    const messages = getCommitMessagesToCheck();
    if (messages.length === 0) {
      console.log('[Git Guard] No commit messages to validate.');
      return 0;
    }

    let anyOk = false;
    for (const msg of messages) {
      const first = msg.trim().split(/\r?\n/)[0];
      console.log(`[Git Guard] Checking: "${first}"`);
      if (isCommitOk(msg)) {
        anyOk = true;
        console.log('\x1b[32m[Git Guard] Commit message OK.\x1b[0m');
      }
    }

    if (anyOk) return 0;

    const strict =
      process.env.GIT_GUARD_STRICT === '1' ||
      process.env.GIT_GUARD_STRICT === 'true';
    const text = 'Commit message should follow Conventional Commits: type(scope): subject';
    if (strict) {
      console.error(`\x1b[31m[ERROR] ${text}\x1b[0m`);
      return 1;
    }

    console.log(`\x1b[33m[WARNING] ${text}\x1b[0m`);
    return 0;
  } catch (error) {
    console.error('[Git Guard] Failed:', error.message);
    return 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  process.exitCode = runGitGuard();
}
