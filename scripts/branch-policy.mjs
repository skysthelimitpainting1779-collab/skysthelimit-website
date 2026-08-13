#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const defaultPolicyPath = resolve(root, 'config/platform-foundation.json');

function matchesBranchPattern(branch, pattern) {
  const candidate = String(branch || '').trim();
  const rule = String(pattern || '').trim();
  if (!candidate || !rule) return false;
  if (rule.endsWith('/*')) {
    const prefix = rule.slice(0, -1);
    return candidate.startsWith(prefix) && candidate.length > prefix.length;
  }
  return candidate === rule;
}

function matchesAny(branch, patterns = []) {
  return patterns.some((pattern) => matchesBranchPattern(branch, pattern));
}

export function loadPlatformPolicy(path = defaultPolicyPath) {
  const policy = JSON.parse(readFileSync(path, 'utf8'));
  if (policy.schemaVersion !== 1) {
    throw new Error('platform policy schemaVersion must equal 1');
  }
  return policy;
}

export function evaluatePullRequest({ base, head, policy = loadPlatformPolicy() }) {
  const production = policy.branches.production;
  const integration = policy.branches.integration;

  if (base === production) {
    const allowed = matchesAny(head, policy.branches.releaseSources);
    return {
      allowed,
      rule: 'production-release-source',
      message: allowed
        ? `${head} may open a release pull request to ${production}`
        : `${production} accepts pull requests only from ${policy.branches.releaseSources.join(', ')}`,
    };
  }

  if (base === integration) {
    const allowed = matchesAny(head, policy.branches.integrationSources);
    return {
      allowed,
      rule: 'integration-source',
      message: allowed
        ? `${head} may integrate into ${integration}`
        : `${integration} accepts pull requests only from ${policy.branches.integrationSources.join(', ')}`,
    };
  }

  return {
    allowed: false,
    rule: 'unsupported-base',
    message: `pull requests to ${base || '<missing>'} are outside the governed branch flow`,
  };
}

export function canDirectPush(branch, policy = loadPlatformPolicy()) {
  if (policy.branches.protected.includes(branch)) return false;
  const allowlist = policy.branches.directPushAllowed || [];
  return allowlist.length === 0 || matchesAny(branch, allowlist);
}

export function isCanonicalDeployment(candidate, policy = loadPlatformPolicy()) {
  return (
    candidate?.teamId === policy.vercel.teamId &&
    candidate?.projectId === policy.vercel.projectId &&
    candidate?.statusContext === policy.vercel.statusContext
  );
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function runCli() {
  const command = process.argv[2] || '';
  if (command !== 'check-pr') {
    console.error('Usage: node scripts/branch-policy.mjs check-pr [--base <branch>] [--head <branch>]');
    return 2;
  }

  const base =
    argumentValue('--base') ||
    process.env.BASE_REF ||
    process.env.GITHUB_BASE_REF ||
    '';
  const head =
    argumentValue('--head') ||
    process.env.HEAD_REF ||
    process.env.GITHUB_HEAD_REF ||
    '';

  if (!base || !head) {
    console.error('[branch-policy] base and head branch names are required');
    return 2;
  }

  const result = evaluatePullRequest({ base, head });
  const method = result.allowed ? 'log' : 'error';
  console[method](`[branch-policy] ${result.message}`);
  return result.allowed ? 0 : 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  process.exitCode = runCli();
}
