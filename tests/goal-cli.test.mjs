import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const goalScript = resolve('scripts/goal.mjs');

function createGoalWorkspace() {
  const root = join(tmpdir(), `goal-cli-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const goals = join(root, '.agents', 'goals');
  mkdirSync(goals, { recursive: true });
  return { root, goals };
}

function runGoal(root, ...args) {
  return spawnSync(process.execPath, [goalScript, ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

test('pause preserves the active goal and resume restores it', (t) => {
  const { root, goals } = createGoalWorkspace();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const slug = 'guapo-upgrade-campaign';
  const goalDir = join(goals, slug);
  const active = {
    slug,
    title: 'Guapo Upgrade Campaign',
    status: 'active',
    phase: 'implement',
    path: `.agents/goals/${slug}`,
  };
  mkdirSync(goalDir, { recursive: true });
  writeFileSync(join(goalDir, 'GOAL.md'), '# Preserve me\n');
  writeFileSync(join(goalDir, 'meta.json'), `${JSON.stringify(active, null, 2)}\n`);
  writeFileSync(join(goals, 'active.json'), `${JSON.stringify(active, null, 2)}\n`);

  const paused = runGoal(root, 'pause');
  assert.equal(paused.status, 0, paused.stderr);
  assert.equal(existsSync(join(goals, 'active.json')), false);
  const pausedMeta = JSON.parse(readFileSync(join(goalDir, 'meta.json'), 'utf8'));
  assert.equal(pausedMeta.status, 'paused');
  assert.ok(pausedMeta.paused);
  assert.equal(readFileSync(join(goalDir, 'GOAL.md'), 'utf8'), '# Preserve me\n');

  const resumed = runGoal(root, 'resume', slug);
  assert.equal(resumed.status, 0, resumed.stderr);
  const resumedActive = JSON.parse(readFileSync(join(goals, 'active.json'), 'utf8'));
  assert.equal(resumedActive.status, 'active');
  assert.equal(resumedActive.slug, slug);
  const resumedMeta = JSON.parse(readFileSync(join(goalDir, 'meta.json'), 'utf8'));
  assert.equal(resumedMeta.status, 'active');
  assert.ok(resumedMeta.resumed);
});

test('resume refuses to replace another active goal', (t) => {
  const { root, goals } = createGoalWorkspace();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const active = { slug: 'current', title: 'Current', status: 'active', phase: 'research' };
  mkdirSync(join(goals, 'paused'), { recursive: true });
  writeFileSync(
    join(goals, 'paused', 'meta.json'),
    `${JSON.stringify({ slug: 'paused', title: 'Paused', status: 'paused', phase: 'plan' }, null, 2)}\n`,
  );
  writeFileSync(join(goals, 'active.json'), `${JSON.stringify(active, null, 2)}\n`);

  const result = runGoal(root, 'resume', 'paused');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Already active: current/);
});

test('start refuses to overwrite an existing goal directory', (t) => {
  const { root, goals } = createGoalWorkspace();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const goalDir = join(goals, 'existing-goal');
  mkdirSync(goalDir, { recursive: true });
  writeFileSync(join(goalDir, 'GOAL.md'), '# Existing content\n');

  const result = runGoal(root, 'start', 'Existing Goal');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /already exists/i);
  assert.equal(readFileSync(join(goalDir, 'GOAL.md'), 'utf8'), '# Existing content\n');
});
