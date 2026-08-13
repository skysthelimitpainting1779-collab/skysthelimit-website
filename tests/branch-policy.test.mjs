import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('CI and Security target main and dev, never the retired staging branch', () => {
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/security.yml']) {
    const source = read(path);
    const branchDeclarations = [...source.matchAll(/branches:\s*\[([^\]]+)\]/g)].map(
      (match) => match[1].replaceAll(' ', '')
    );
    assert.ok(branchDeclarations.length >= 2, `${path} must declare push and pull-request branches`);
    assert.ok(
      branchDeclarations.every((value) => value === 'main,dev'),
      `${path} must target exactly main and dev`
    );
    assert.doesNotMatch(source, /\bstaging\b/);
  }
});

test('the repository declares one canonical Vercel project and a dev preview branch', () => {
  const policyPath = resolve(root, 'config/platform-foundation.json');
  assert.equal(existsSync(policyPath), true, 'platform policy manifest must exist');

  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  assert.equal(policy.branches.production, 'main');
  assert.equal(policy.branches.integration, 'dev');
  assert.equal(policy.vercel.projectId, 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m');
  assert.equal(policy.vercel.teamId, 'team_bseTA2AuCO6A2fCOVY9ubrJo');
  assert.equal(policy.vercel.statusContext, 'Vercel');

  const vercel = JSON.parse(read('vercel.json'));
  assert.equal(vercel.git.deploymentEnabled.main, true);
  assert.equal(vercel.git.deploymentEnabled.dev, true);
  assert.equal(vercel.git.deploymentEnabled['entire/*'], false);
});

test('branch policy accepts only governed integration and release paths', async () => {
  const modulePath = resolve(root, 'scripts/branch-policy.mjs');
  assert.equal(existsSync(modulePath), true, 'branch policy implementation must exist');
  const {
    canDirectPush,
    evaluatePullRequest,
    isCanonicalDeployment,
    loadPlatformPolicy,
  } = await import(modulePath);

  const policy = loadPlatformPolicy();
  assert.equal(evaluatePullRequest({ base: 'main', head: 'dev', policy }).allowed, true);
  assert.equal(evaluatePullRequest({ base: 'main', head: 'hotfix/outage', policy }).allowed, true);
  assert.equal(evaluatePullRequest({ base: 'main', head: 'feat/new-page', policy }).allowed, false);

  assert.equal(evaluatePullRequest({ base: 'dev', head: 'feat/new-page', policy }).allowed, true);
  assert.equal(evaluatePullRequest({ base: 'dev', head: 'infra/platform-foundation', policy }).allowed, true);
  assert.equal(evaluatePullRequest({ base: 'dev', head: 'main', policy }).allowed, false);

  assert.equal(canDirectPush('main', policy), false);
  assert.equal(canDirectPush('dev', policy), false);
  assert.equal(canDirectPush('feat/example', policy), true);

  assert.equal(
    isCanonicalDeployment(
      {
        teamId: 'team_bseTA2AuCO6A2fCOVY9ubrJo',
        projectId: 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m',
        statusContext: 'Vercel',
      },
      policy
    ),
    true
  );
  assert.equal(
    isCanonicalDeployment(
      {
        teamId: 'team_bseTA2AuCO6A2fCOVY9ubrJo',
        projectId: 'wrong-project',
        statusContext: 'Vercel',
      },
      policy
    ),
    false
  );
});

test('Dependabot, rulesets, agents, and deployment verification agree with the branch policy', () => {
  const dependabot = read('.github/dependabot.yml');
  assert.equal((dependabot.match(/target-branch:\s*dev/g) || []).length, 2);

  for (const branch of ['main', 'dev']) {
    const ruleset = JSON.parse(read(`.github/rulesets/${branch}.json`));
    assert.deepEqual(ruleset.conditions.ref_name.include, [`refs/heads/${branch}`]);
    assert.ok(ruleset.rules.some((rule) => rule.type === 'non_fast_forward'));
    const pullRequest = ruleset.rules.find((rule) => rule.type === 'pull_request');
    assert.ok(pullRequest);
    assert.deepEqual(pullRequest.parameters.allowed_merge_methods, ['rebase']);
    assert.ok(ruleset.rules.some((rule) => rule.type === 'required_status_checks'));
    const required = ruleset.rules.find((rule) => rule.type === 'required_status_checks');
    assert.ok(
      required.parameters.required_status_checks.some((check) => check.context === 'Vercel'),
      `${branch} must require the repository-owned canonical Vercel check`
    );
  }

  const agents = read('AGENTS.md');
  assert.match(agents, /`main` is production-only/);
  assert.match(agents, /`dev` is the non-production integration branch/);

  const deployment = read('.github/workflows/deployment-verification.yml');
  assert.match(deployment, /prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m/);
  assert.match(deployment, /team_bseTA2AuCO6A2fCOVY9ubrJo/);
  assert.match(deployment, /website-\*\.vercel\.app/);
});

test('approval, lifecycle, normalization, and operator docs use the dev branch model', async () => {
  const approval = read('.github/workflows/pr-approval.yml');
  const approvalBranches = [...approval.matchAll(/branches:\s*\[([^\]]+)\]/g)].map(
    (match) => match[1].replaceAll(' ', '')
  );
  assert.ok(
    approvalBranches.some((value) => value === 'main,dev'),
    '.github/workflows/pr-approval.yml must target main and dev'
  );
  assert.doesNotMatch(approval, /\bstaging\b/);

  const lifecycle = JSON.parse(read('.agents/governance/development-lifecycle.json'));
  assert.equal(lifecycle.operationalIntegrationBranch, 'dev');
  assert.equal(lifecycle.productionBranch, 'main');
  assert.equal(lifecycle.branchPolicyPath, 'config/platform-foundation.json');

  const normalizeSource = read('scripts/normalize-branch.mjs');
  assert.match(normalizeSource, /config\/platform-foundation\.json/);
  assert.doesNotMatch(normalizeSource, /['"]staging['"]/);

  const decisions = read('.agents/CURRENT_DECISIONS.md');
  assert.match(decisions, /Clerk proves identity/);
  assert.match(decisions, /team_bseTA2AuCO6A2fCOVY9ubrJo/);
  assert.match(decisions, /prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m/);

  const workflowGuide = read('.github/WORKFLOW_TROUBLESHOOTING.md');
  assert.doesNotMatch(workflowGuide, /main and staging/);
  assert.doesNotMatch(workflowGuide, /Exactly these three YAML files/);
});

test('dev bootstrap uses checks that run before governance reaches the default branch', () => {
  const devRuleset = JSON.parse(read('.github/rulesets/dev.json'));
  const requiredRule = devRuleset.rules.find((rule) => rule.type === 'required_status_checks');
  const contexts = requiredRule.parameters.required_status_checks
    .map((check) => check.context)
    .sort();

  assert.deepEqual(contexts, [
    'CodeQL JavaScript and TypeScript',
    'Production Dependency Audit',
    'Repository Quality',
    'Vercel',
  ]);

  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /Validate current pull request branch flow/);
  assert.match(ci, /node scripts\/branch-policy\.mjs check-pr/);
  assert.match(ci, /BASE_REF: \$\{\{ github\.event\.pull_request\.base\.ref \}\}/);
  assert.match(ci, /HEAD_REF: \$\{\{ github\.event\.pull_request\.head\.ref \}\}/);

  const settings = read('docs/SETTINGS_CHECKLIST.md');
  assert.match(
    settings,
    /Do not require `Validate Branch Flow` or `Independent PR Approval` on `dev` until/
  );
});

test('Vercel builds proceed only for the canonical project and governed branches', async () => {
  const config = JSON.parse(read('vercel.json'));
  assert.equal(config.ignoreCommand, 'node scripts/vercel-ignore-build.mjs');

  const { shouldIgnoreVercelBuild } = await import(
    resolve(root, 'scripts/vercel-ignore-build.mjs')
  );
  const canonical = 'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m';
  assert.equal(
    shouldIgnoreVercelBuild({ projectId: canonical, branch: 'fix/ci-recovery' }),
    false
  );
  assert.equal(
    shouldIgnoreVercelBuild({ projectId: 'prj_duplicate', branch: 'fix/ci-recovery' }),
    true
  );
  assert.equal(
    shouldIgnoreVercelBuild({ projectId: canonical, branch: 'entire/checkpoint' }),
    true
  );
  assert.equal(shouldIgnoreVercelBuild({ projectId: '', branch: 'dev' }), false);
});
