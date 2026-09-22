#!/usr/bin/env node
/**
 * Branch name normalization for Agent OS / Git policy.
 *
 * Maps common aliases → allowed prefixes (feat/ fix/ chore/ docs/ infra/ …).
 * In GitHub Actions on pull_request: can rename the head branch via API.
 *
 * Usage:
 *   node scripts/normalize-branch.mjs              # dry report (local or CI)
 *   node scripts/normalize-branch.mjs --apply       # rename via gh when possible
 *   node scripts/normalize-branch.mjs --json
 *
 * Env (CI):
 *   GITHUB_HEAD_REF, GITHUB_REPOSITORY, GH_TOKEN / GITHUB_TOKEN
 *   BRANCH_NORMALIZE_APPLY=1  same as --apply
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ALLOWED = [
  'feat/',
  'fix/',
  'chore/',
  'docs/',
  'infra/',
  'slice/',
  'devin/',
  'agent/',
  'dependabot/',
];

/** First matching alias wins */
const ALIASES = [
  [/^feature(s)?[/_-]/i, 'feat/'],
  [/^feat[_-]/i, 'feat/'],
  [/^bugfix[/_-]/i, 'fix/'],
  [/^bug[/_-]/i, 'fix/'],
  [/^hotfix[/_-]/i, 'fix/'],
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
  [/^refactor[/_-]/i, 'chore/'],
  [/^test(s|ing)?[/_-]/i, 'chore/'],
  [/^wip[/_-]/i, 'chore/'],
  [/^agent[_-]/i, 'agent/'],
  [/^devin[_-]/i, 'devin/'],
];

const PROTECTED = new Set(['main', 'staging', 'master', 'production', 'prod']);

function parseArgs(argv) {
  return {
    apply: argv.includes('--apply') || process.env.BRANCH_NORMALIZE_APPLY === '1',
    json: argv.includes('--json'),
  };
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function currentBranch() {
  if (process.env.GITHUB_HEAD_REF) return process.env.GITHUB_HEAD_REF;
  if (process.env.GITHUB_REF_NAME && process.env.GITHUB_EVENT_NAME !== 'pull_request') {
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
  if (name.startsWith('entire/')) return true; // Vercel ignoreCommand branches
  return ALLOWED.some((p) => name.startsWith(p));
}

function slugTail(raw) {
  return String(raw)
    .replace(/^\/+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'work';
}

/**
 * @returns {{ ok: boolean, original: string, normalized: string|null, action: string, reason: string }}
 */
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

  for (const [re, prefix] of ALIASES) {
    if (re.test(original)) {
      const rest = original.replace(re, '');
      const normalized = `${prefix}${slugTail(rest)}`;
      return {
        ok: false,
        original,
        normalized,
        action: 'rename',
        reason: `map ${re} → ${prefix}`,
      };
    }
  }

  // No slash / unknown prefix → feat/<slug>
  const cleaned = original.includes('/')
    ? original.split('/').slice(1).join('/') || original
    : original;
  const normalized = `feat/${slugTail(cleaned)}`;
  return {
    ok: false,
    original,
    normalized,
    action: 'rename',
    reason: 'default to feat/',
  };
}

function renameBranchOnGitHub(oldName, newName) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    throw new Error('GITHUB_REPOSITORY and GH_TOKEN/GITHUB_TOKEN required to rename');
  }
  // gh encodes path segments; pass branch as-is in API path
  const res = execFileSync(
    'gh',
    [
      'api',
      '--method',
      'POST',
      '-H',
      'Accept: application/vnd.github+json',
      `repos/${repo}/branches/${encodeURIComponent(oldName)}/rename`,
      '-f',
      `new_name=${newName}`,
    ],
    {
      encoding: 'utf8',
      windowsHide: true,
      env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    }
  );
  let body;
  try {
    body = JSON.parse(res);
  } catch {
    body = { raw: res };
  }
  if (body.message && !body.name && !body.ref) {
    throw new Error(`GitHub rename failed: ${body.message}`);
  }
  return body;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const branch = currentBranch();
  const plan = planNormalization(branch);

  if (opts.json) {
    console.log(JSON.stringify(plan, null, 2));
  } else {
    console.log(`[branch-normalize] current: ${plan.original}`);
    console.log(`[branch-normalize] action:  ${plan.action} (${plan.reason})`);
    if (plan.normalized && plan.normalized !== plan.original) {
      console.log(`[branch-normalize] target:  ${plan.normalized}`);
    }
  }

  if (plan.action === 'rename' && opts.apply) {
    if (process.env.GITHUB_ACTIONS !== 'true') {
      console.error('[branch-normalize] --apply in CI only renames via GitHub API. Locally run:');
      console.error(`  git branch -m ${plan.normalized}`);
      console.error(`  git push -u origin ${plan.normalized}`);
      console.error(`  git push origin --delete ${plan.original}  # optional`);
      process.exit(2);
    }
    try {
      const result = renameBranchOnGitHub(plan.original, plan.normalized);
      console.log(
        `[branch-normalize] renamed on GitHub: ${plan.original} → ${plan.normalized}`
      );
      if (!opts.json) console.log(JSON.stringify({ renamed: true, result: result.name || true }));
      process.exit(0);
    } catch (err) {
      console.error(`[branch-normalize] rename failed: ${err.message}`);
      process.exit(1);
    }
  }

  // Exit codes: 0 = ok/skip, 3 = needs rename (for CI gate without apply)
  if (plan.action === 'rename' && !opts.apply) {
    process.exit(3);
  }
  if (plan.action === 'error') process.exit(1);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].includes('normalize-branch')) {
  main();
}
