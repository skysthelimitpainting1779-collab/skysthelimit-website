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

test('repository has exactly the three Vercel-native workflows', () => {
  assert.deepEqual(workflowNames(), [
    'ci.yml',
    'deployment-verification.yml',
    'security.yml',
  ]);
});

test('GitHub Actions validates and verifies but never deploys or rebuilds Vercel', () => {
  const workflows = workflowText();

  assert.doesNotMatch(workflows, /\bvercel\s+(?:build|deploy|promote|alias|domains?)\b/i);
  assert.doesNotMatch(workflows, /\bnpm\s+run\s+build\b/);
  assert.doesNotMatch(workflows, /\bVERCEL_TOKEN\b/);
});

test('CI owns repository standards, typechecking, and tests', () => {
  const ci = read('.github/workflows/ci.yml');

  assert.match(ci, /pull_request:/);
  assert.match(ci, /push:/);
  assert.match(ci, /node-version-file:\s*['"]?\.nvmrc/);
  assert.match(ci, /npm ci/);
  assert.match(ci, /npm run ci:contract/);
  assert.match(ci, /node scripts\/enforce-git\.js/);
  assert.match(ci, /npm run lint:ci/);
  assert.match(ci, /npm test/);
});

test('security workflow consolidates CodeQL, dependency review, and npm audit', () => {
  const security = read('.github/workflows/security.yml');

  assert.match(security, /github\/codeql-action\/init@/);
  assert.match(security, /github\/codeql-action\/analyze@/);
  assert.match(security, /actions\/dependency-review-action@/);
  assert.match(security, /fail-on-severity:\s*moderate/);
  assert.match(security, /npm audit --audit-level=critical --omit=dev/);
  assert.match(security, /schedule:/);
});

test('deployment verification consumes Vercel events and runs route smoke only', () => {
  const verification = read('.github/workflows/deployment-verification.yml');

  assert.match(verification, /repository_dispatch:/);
  assert.match(verification, /vercel\.deployment\.success/);
  assert.match(verification, /vercel\.deployment\.promoted/);
  assert.match(verification, /deployment_status:/);
  assert.match(verification, /github\.event\.deployment\.environment\s*==\s*'Production'/);
  assert.match(verification, /github\.event\.client_payload\.url/);
  assert.match(verification, /github\.event\.deployment_status\.(?:target_url|environment_url)/);
  assert.match(
    verification,
    /elif \[\[ "\$GITHUB_EVENT_NAME" == "deployment_status" \]\]; then\s+site_url="https:\/\/www\.skysthelimitpaintingllc\.com"/,
  );
  assert.match(verification, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(verification, /npm run smoke:site/);
  assert.match(verification, /https:\/\/www\.skysthelimitpaintingllc\.com/);
});

test('Vercel Git integration owns main deployment and the release marker is gone', () => {
  const config = JSON.parse(read('vercel.json'));

  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.git?.deploymentEnabled?.main, true);
  assert.equal(config.git?.deploymentEnabled?.['entire/*'], false);
  assert.equal(exists('.github/production-release.json'), false);
});
