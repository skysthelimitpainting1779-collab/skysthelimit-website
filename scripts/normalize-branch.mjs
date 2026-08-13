#!/usr/bin/env node
/**
 * Branch-name normalization for the governed repository policy.
 *
 * Usage:
 *   node scripts/normalize-branch.mjs
 *   node scripts/normalize-branch.mjs --apply
 *   node scripts/normalize-branch.mjs --json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const policy = JSON.parse(
  readFileSync(resolve(root, 'config/platform-foundation.json'), 'utf8'),
);

const ALLOWED_PATTERNS = [
  ...policy.branches.integrationSources,
  ...policy.branches.releaseSources,
];
const PROTECTED = new Set([
  ...policy.branches.protected,
  'master',
  'production',
  'prod',
]);

const ALIASES = [
  [/^feature(s)?[/_-]/i, 'feat/'],
  [/^feat[_-]/i, 'feat/'],
  [/^bugfix[/_-]/i, 'fix/'],
  [/^bug[/_-]/i, 'fix/'],
  [/^hotfix[/_-]/i, 'hotfix/'],
  [/^patch[/_-]/i, 'fix/'],
  [/^fixes?[/_-]/i, 'fix/'],
  [/^documentation[/_-]/i, 'docs/'],
  [/^docs?[_-]/i, 'docs/'],
  [/^infrastructure[/_-]/i, 'infra/'],
  [/^infra[_-]/i, 'infra/'],
  [/^devops[/_-]/i, 'infra/'],
  [/^ci[/_-]/i, 'infra/'],
  [/^deps?[/_-]/i, 'chore/'],
  [/^dependenc(y|ies)[/_-]/i, 'chore/'],
  [/^chore[_-]/i, 'chore/'],
  [/^release[/_-]/i, 'chore/'],
  [/^maint(enance)?[/_-]/i, 'chore/'],
  [/^refactor[/_-]/i, 'refactor/'],
  [/^test(s|ing)?[/_-]/i, 'test/'],
  [/^wip[/_-]/i, 'chore/'],
  [/^agent[_-]/i, 'agent/'],
  [/^devin[_-]/i, 'devin/'],
  [/^dependabot[_-]/i, 'dependabot/'],
  [/^renovate[_-]/i, 'renovate/'],
];

function matchesPattern(branch, pattern) {
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1);
    return branch.startsWith(prefix) && branch.length > prefix.length;
  }
  return branch === pattern;
}

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply') || process.env.BRANCH_NORMALIZE_APPLY === '1',
    json: argv.includes('--json'),
  };
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function currentBranch() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  if (
    process.env.GITHUB_REF_NAME &&
    process.env.GITHUB_EVENT_NAME !== 'pull_request'
  ) {
    return process.env.GITHUB_REF_NAME;
  }
  try {
    return git(['rev-parse', '--abbrev-ref', 'HEAD']);
  } catch {
    return '';
  }
}

function isAllowed(name) {
  if (!name || PROTECTED.has(name)) return true;
  if (name.startsWith('entire/')) return true;
  return ALLOWED_PATTERNS.some((pattern) => matchesPattern(name, pattern));
}

function slugTail(raw) {
  return (
    String(raw)
      .replace(/^\/+/, '')
      .toLowerCase()
      .replace(/[^a-z0-9/_-]+/g, '-')
      .replace(/\/+/g, '/')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'work'
  );
}

export function planNormalization(branch) {
  const original = String(branch || '').trim();
  if (!original) {
    return {
      ok: false,
      original,
      normalized: null,
      action: 'error',
      reason: 'empty branch name',
    };
  }
  if (PROTECTED.has(original)) {
    return {
      ok: true,
      original,
      normalized: original,
      action: 'skip',
      reason: 'protected branch',
    };
  }
  if (isAllowed(original)) {
    return {
      ok: true,
      original,
      normalized: original,
      action: 'ok',
      reason: 'already compliant',
    };
  }

  for (const [pattern, prefix] of ALIASES) {
    if (pattern.test(original)) {
      const rest = original.replace(pattern, '');
      return {
        ok: false,
        original,
        normalized: `${prefix}${slugTail(rest)}`,
        action: 'rename',
        reason: `map ${pattern} -> ${prefix}`,
      };
    }
  }

  const cleaned = original.includes('/')
    ? original.split('/').slice(1).join('/') || original
    : original;
  return {
    ok: false,
    original,
    normalized: `feat/${slugTail(cleaned)}`,
    action: 'rename',
    reason: 'default to feat/',
  };
}

function renameBranchOnGitHub(oldName, newName) {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!repository || !token) {
    throw new Error('GITHUB_REPOSITORY and GH_TOKEN/GITHUB_TOKEN are required');
  }

  const response = execFileSync(
    'gh',
    [
      'api',
      '--method',
      'POST',
      '-H',
      'Accept: application/vnd.github+json',
      `repos/${repository}/branches/${encodeURIComponent(oldName)}/rename`,
      '-f',
      `new_name=${newName}`,
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    },
  );

  let body;
  try {
    body = JSON.parse(response);
  } catch {
    body = { raw: response };
  }
  if (body.message && !body.name && !body.ref) {
    throw new Error(`GitHub rename failed: ${body.message}`);
  }
  return body;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = planNormalization(currentBranch());

  if (options.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(`[branch-normalize] current: ${plan.original}`);
    console.log(`[branch-normalize] action:  ${plan.action} (${plan.reason})`);
    if (plan.normalized && plan.normalized !== plan.original) {
      console.log(`[branch-normalize] target:  ${plan.normalized}`);
    }
  }

  if (plan.action === 'rename' && options.apply) {
    if (process.env.GITHUB_ACTIONS !== 'true') {
      console.error('[branch-normalize] --apply renames through GitHub only in CI.');
      console.error(`Locally run: git branch -m ${plan.normalized}`);
      process.exit(2);
    }
    try {
      const result = renameBranchOnGitHub(plan.original, plan.normalized);
      console.log(
        `[branch-normalize] renamed on GitHub: ${plan.original} -> ${plan.normalized}`,
      );
      if (!options.json) {
        console.log(JSON.stringify({ renamed: true, result: result.name || true }));
      }
      process.exit(0);
    } catch (error) {
      console.error(`[branch-normalize] rename failed: ${error.message}`);
      process.exit(1);
    }
  }

  if (plan.action === 'rename' && !options.apply) process.exit(3);
  if (plan.action === 'error') process.exit(1);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].includes('normalize-branch')) {
  main();
}
