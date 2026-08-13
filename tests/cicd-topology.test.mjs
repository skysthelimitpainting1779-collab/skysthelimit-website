import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const rootUrl = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, rootUrl), 'utf8');
const exists = (path) => existsSync(new URL(path, rootUrl));

function workflowNames() {
  return readdirSync(new URL('.github/workflows/', rootUrl))
    .filter((name) => /\.ya?ml$/i.test(name))
    .sort();
}

function workflowText() {
  return workflowNames()
    .map((name) => `# ${name}\n${read(`.github/workflows/${name}`)}`)
    .join('\n');
}

test('repository has only the five governed workflows', () => {
  assert.deepEqual(workflowNames(), [
    'branch-policy.yml',
    'ci.yml',
    'deployment-verification.yml',
    'pr-approval.yml',
    'security.yml',
  ]);
});

test('GitHub Actions validates and verifies but never deploys or rebuilds Vercel', () => {
  const workflows = workflowText();

  assert.doesNotMatch(workflows, /\bvercel\s+(?:build|deploy|promote|alias|domains?)\b/i);
  assert.doesNotMatch(workflows, /\bnpm\s+run\s+build\b/);
  assert.doesNotMatch(read('.github/workflows/ci.yml'), /\bVERCEL_TOKEN\b/);
  assert.doesNotMatch(read('.github/workflows/security.yml'), /\bVERCEL_TOKEN\b/);
});

test('CI owns repository standards, typechecking, and tests', () => {
  const ci = read('.github/workflows/ci.yml');

  assert.match(ci, /pull_request:/);
  assert.match(ci, /push:/);
  assert.match(ci, /node-version-file:\s*['"]?\.nvmrc/);
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run ci:contract/);
  assert.match(ci, /npm run lifecycle:verify/);
  assert.match(ci, /ref:\s*\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.match(ci, /LIFECYCLE_HEAD_SHA:\s*\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.doesNotMatch(ci, /node scripts\/verify-pr-review\.mjs/);
  assert.match(ci, /node scripts\/enforce-git\.js/);
  assert.match(ci, /npm run lint:ci/);
  assert.match(ci, /npm test/);
});

test('independent approval runs trusted base code for every review state transition', () => {
  const approval = read('.github/workflows/pr-approval.yml');

  assert.match(approval, /pull_request_target:/);
  assert.match(approval, /ready_for_review/);
  assert.match(approval, /converted_to_draft/);
  assert.match(approval, /pull_request_review:/);
  assert.match(approval, /submitted/);
  assert.match(approval, /dismissed/);
  assert.match(approval, /name:\s*Independent PR Approval/);
  assert.match(approval, /ref:\s*\$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(approval, /persist-credentials:\s*false/);
  assert.match(approval, /node scripts\/verify-pr-review\.mjs/);
  assert.match(approval, /PR_HEAD_SHA:\s*\$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(approval, /if:\s*github\.event\.pull_request\.draft/);
  assert.doesNotMatch(approval, /workflow_dispatch:/);
  assert.doesNotMatch(approval, /ref:\s*\$\{\{ github\.event\.pull_request\.head\.sha/);
});

test('security workflow consolidates CodeQL, dependency review, and npm audit', () => {
  const security = read('.github/workflows/security.yml');

  assert.match(security, /github\/codeql-action\/init@/);
  assert.match(security, /github\/codeql-action\/analyze@/);
  assert.match(security, /actions\/dependency-review-action@/);
  assert.match(security, /fail-on-severity:\s*moderate/);
  assert.match(security, /npm audit --audit-level=high --omit=dev/);
  assert.match(security, /schedule:/);
});

test('deployment verification consumes Vercel events and runs route smoke only', () => {
  const verification = read('.github/workflows/deployment-verification.yml');

  assert.match(verification, /pull_request:/);
  assert.match(verification, /push:/);
  assert.match(verification, /repository_dispatch:/);
  assert.match(verification, /vercel\.deployment\.success/);
  assert.match(verification, /vercel\.deployment\.promoted/);
  assert.match(verification, /deployment_status:/);
  assert.doesNotMatch(verification, /^\s*schedule:/m);
  assert.doesNotMatch(verification, /^\s*workflow_dispatch:/m);
  assert.match(verification, /github\.event\.client_payload\.url/);
  assert.match(verification, /github\.event\.client_payload\.git\.sha/);
  assert.match(verification, /github\.event\.deployment\.sha/);
  assert.match(verification, /github\.event\.deployment_status\.(?:target_url|environment_url)/);
  assert.match(verification, /ref:\s*\$\{\{\s*steps\.target\.outputs\.sha\s*\}\}/);
  assert.match(verification, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(verification, /node scripts\/verify-vercel-deployment\.mjs/);
  assert.match(verification, /DEPLOYMENT_URL:\s*\$\{\{ steps\.target\.outputs\.deployment_url \}\}/);
  assert.match(verification, /SITE_URL:\s*\$\{\{ steps\.target\.outputs\.smoke_url \}\}/);
  assert.doesNotMatch(verification, /--url "\$\{\{/);
  assert.match(verification, /npm run smoke:site/);
  assert.match(verification, /https:\/\/www\.skysthelimitpaintingllc\.com/);
  assert.match(verification, /name:\s*Vercel\s*$/m);
  assert.match(
    verification,
    /ref:\s*\$\{\{ github\.event\.pull_request\.base\.sha \|\| github\.sha \}\}/
  );
  assert.doesNotMatch(
    verification,
    /ref:\s*\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/
  );
  assert.match(
    verification,
    /DEPLOYMENT_SHA:\s*\$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/
  );
  assert.match(verification, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
});

test('Vercel Git integration owns main deployment and the release marker is gone', () => {
  const config = JSON.parse(read('vercel.json'));

  assert.equal(config.framework, 'nextjs');
  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.buildCommand, 'npm run build:vercel');
  assert.equal(config.git?.deploymentEnabled?.main, true);
  assert.equal(config.git?.deploymentEnabled?.['entire/*'], false);
  assert.equal(exists('.github/production-release.json'), false);
});
