import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('agent OS keeps quarantine self-heal wiring (no git checkout rollback)', () => {
  const harness = read('scripts/agent-os.js');

  assert.match(harness, /agent-os-core\.mjs/);
  assert.match(harness, /MAX_TASK_ATTEMPTS|shouldQuarantineTask/);
  assert.match(harness, /assertPhaseEntry|auto-seed/);
  assert.doesNotMatch(harness, /execSync\(`git checkout --/);
  assert.doesNotMatch(harness, /execSync\('git checkout --/);
});

test('agent OS self-healing quarantines failures instead of reverting user files', () => {
  const harness = read('scripts/agent-os.js');

  assert.match(harness, /Quarantine only/);
  assert.match(harness, /Manual inspection required before retry/);
  assert.doesNotMatch(harness, /execSync\(`git checkout --/);
  assert.doesNotMatch(harness, /execSync\('git checkout --/);
  assert.match(harness, /agent-os-core\.mjs/);
  assert.match(harness, /MAX_TASK_ATTEMPTS|shouldQuarantineTask/);
  assert.match(harness, /assertPhaseEntry|auto-seed/);
});

test('zero-theater kernel: only real host-native paths', () => {
  for (const path of [
    'AGENTS.md',
    '.agents/STACK.md',
    '.agents/specialists.json',
    '.agents/skills/ship-loop/SKILL.md',
    '.agents/governance/ROOT_CAUSE.md',
    'scripts/goal.mjs',
    'scripts/ship-eval.mjs',
    'scripts/compile-host-native.mjs',
    'scripts/zero-theater.mjs',
  ]) {
    assert.ok(exists(path), `${path} should exist`);
  }

  const agents = read('AGENTS.md');
  assert.match(agents, /goal:verify|ship:eval/i);
  assert.match(agents, /host:compile|specialists/i);

  // Theater must not exist
  for (const bad of [
    '.agents/domains',
    '.agents/queues',
    '.agents/hub_db.json',
    '.agents/ONTOLOGY.md',
    '.agents/operating-summary.md',
    '.agents/agent-os.db',
    '.agents/knowledge',
    '.agents/checkpoints',
  ]) {
    assert.ok(!exists(bad), `theater must be gone: ${bad}`);
  }
});

test('host-native specialists compiled for Claude Cursor Codex', () => {
  const compiler = read('scripts/compile-host-native.mjs');
  assert.match(compiler, /process\.argv\.includes\('--mirror-skills'\)/);
  assert.match(compiler, /mirrorSkillAdapters \? mirrorSkills\(\) : \[\]/);

  const specs = JSON.parse(read('.agents/specialists.json'));
  assert.ok((specs.agents || []).length >= 5);
  for (const a of specs.agents) {
    assert.ok(exists(`.claude/agents/${a.id}.md`), `claude agent ${a.id}`);
    assert.ok(exists(`.cursor/agents/${a.id}.md`), `cursor agent ${a.id}`);
    assert.ok(exists(`.codex/agents/${a.id}.toml`), `codex agent ${a.id}`);
    const codexAgent = read(`.codex/agents/${a.id}.toml`);
    assert.match(
      codexAgent,
      /^developer_instructions = """/m,
      `codex agent ${a.id} should use the current role schema`,
    );
    assert.doesNotMatch(
      codexAgent,
      /^instructions =/m,
      `codex agent ${a.id} should not use the retired role field`,
    );
  }
  assert.ok(exists('CLAUDE.md'));
  assert.ok(exists('GEMINI.md'));
  assert.match(read('CLAUDE.md'), /@AGENTS\.md/);
});
