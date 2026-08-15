import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const codexDir = join(root, '.codex');
const agentsDir = join(codexDir, 'agents');

const ids = {
  agents: Array.from({ length: 11 }, (_, index) => `A${index}`),
  verifiers: Array.from({ length: 11 }, (_, index) => `V${index}`),
  specialists: Array.from({ length: 8 }, (_, index) => `S${index + 1}`),
};

const expectedFiles = Object.values(ids)
  .flat()
  .map((id) => `${id}.toml`)
  .sort();

function readAgent(id) {
  return readFileSync(join(agentsDir, `${id}.toml`), 'utf8');
}

function runHook(script, payload) {
  return spawnSync(process.execPath, [join(root, 'scripts', 'hooks', script)], {
    cwd: root,
    encoding: 'utf8',
    input: JSON.stringify(payload),
  });
}

test('Codex discovers exactly the canonical A, V, and S organization', () => {
  const actual = readdirSync(agentsDir)
    .filter((file) => file.endsWith('.toml'))
    .sort();

  assert.deepEqual(actual, expectedFiles);

  for (const file of actual) {
    const source = readFileSync(join(agentsDir, file), 'utf8');
    assert.match(source, /^name\s*=\s*".+"/m, `${file} must declare name`);
    assert.match(source, /^description\s*=\s*".+"/m, `${file} must declare description`);
    assert.match(source, /^developer_instructions\s*=\s*"""/m, `${file} must use the current Codex instruction key`);
    assert.doesNotMatch(source, /^instructions\s*=/m, `${file} must not use the obsolete instruction key`);
  }
});

test('Codex verifiers and diagnostic roles are structurally read-only', () => {
  for (const id of [...ids.verifiers, ...ids.specialists, 'A1', 'A6', 'A10']) {
    assert.match(readAgent(id), /^sandbox_mode\s*=\s*"read-only"/m, `${id} must have a read-only sandbox`);
  }

  for (const id of ids.verifiers) {
    const source = readAgent(id);
    assert.match(source, /clean.context/i, `${id} must require clean context`);
    assert.match(source, /PASS.*FAIL.*UNCERTAIN/is, `${id} must constrain verdicts`);
    assert.match(source, /parent.*conversation.*(?:denied|prohibited|must not)/is, `${id} must reject parent reasoning`);
  }

  for (const id of ids.specialists) {
    const source = readAgent(id);
    assert.match(source, /read.only/i, `${id} must be diagnostic only`);
    assert.match(source, /must not spawn|cannot spawn/i, `${id} must not spawn children`);
    assert.match(source, /report only to|may message only/i, `${id} must be parent-bound`);
  }
});

test('Codex runtime enables bounded multi-agent support and universal hooks', () => {
  const config = readFileSync(join(codexDir, 'config.toml'), 'utf8');
  assert.match(config, /^\[features\][\s\S]*?^hooks\s*=\s*true/m);
  assert.match(config, /^\[agents\][\s\S]*?^enabled\s*=\s*true/m);
  assert.match(config, /^max_concurrent_threads_per_session\s*=\s*\d+/m);

  const hooks = JSON.parse(readFileSync(join(codexDir, 'hooks.json'), 'utf8'));
  for (const event of ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop']) {
    assert.ok(Array.isArray(hooks.hooks[event]), `${event} hooks must be registered`);
  }

  const allCommands = JSON.stringify(hooks);
  for (const command of [
    'entire-codex.mjs',
    'guard-git.mjs',
    'guard-graphify.mjs',
    'guard-production.mjs',
    'guard-circuit.mjs',
    'guard-communication.mjs',
    'telemetry-post-tool.mjs',
  ]) {
    assert.match(allCommands, new RegExp(command.replaceAll('.', '\\.')));
  }

  const entireBridge = readFileSync(join(root, 'scripts', 'hooks', 'entire-codex.mjs'), 'utf8');
  assert.match(entireBridge, /\['hooks', 'codex', event\]/);
});

test('Codex hooks understand native tool payloads', () => {
  const dangerousGit = runHook('guard-git.mjs', {
    tool_name: 'Bash',
    tool_input: { command: 'git reset --hard HEAD~1' },
  });
  assert.equal(dangerousGit.status, 2);
  assert.match(dangerousGit.stderr, /blocked|denied/i);

  const boundedRead = runHook('guard-graphify.mjs', {
    tool_name: 'Bash',
    tool_input: { command: "Get-Content -Raw '.codex/config.toml'" },
  });
  assert.equal(boundedRead.status, 0);

  const productionWrite = runHook('guard-production.mjs', {
    tool_name: 'apply_patch',
    tool_input: {
      command: [
        '*** Begin Patch',
        '*** Update File: .env.production',
        '@@',
        '-OLD_SECRET=value',
        '+NEW_SECRET=value',
        '*** End Patch',
      ].join('\n'),
    },
  });
  assert.equal(productionWrite.status, 2);

  const structuredProductionWrite = runHook('guard-production.mjs', {
    tool_name: 'write_file',
    tool_input: { file_path: 'config/.env.production.local', content: 'SECRET=value' },
  });
  assert.equal(structuredProductionWrite.status, 2);

  const ordinaryPatch = runHook('guard-production.mjs', {
    tool_name: 'apply_patch',
    tool_input: {
      command: [
        '*** Begin Patch',
        '*** Update File: docs/architecture.md',
        '@@',
        '-old',
        '+new',
        '*** End Patch',
      ].join('\n'),
    },
  });
  assert.equal(ordinaryPatch.status, 0);

  const peerMessage = runHook('guard-communication.mjs', {
    tool_name: 'send_message',
    tool_input: { source_agent: 'A4', target_agent: 'A5', message: 'change the schema' },
  });
  assert.equal(peerMessage.status, 2);

  const rootMessage = runHook('guard-communication.mjs', {
    tool_name: 'send_message',
    tool_input: { source_agent: 'A4', target_agent: 'A0', message: 'backend dependency found' },
  });
  assert.equal(rootMessage.status, 0);

  const closedCircuit = runHook('guard-circuit.mjs', {
    tool_name: 'Bash',
    agent_id: 'A4',
    tool_input: { command: 'npm test' },
  });
  assert.equal(closedCircuit.status, 0);
});

test('Shared guards honor the official Antigravity JSON decision contract', () => {
  const denied = runHook('guard-git.mjs', {
    toolCall: { name: 'run_command', args: { CommandLine: 'git add .' } },
    conversationId: 'certification-fixture',
    workspacePaths: [root],
  });
  assert.equal(denied.status, 0);
  const deniedDecision = JSON.parse(denied.stdout);
  assert.equal(deniedDecision.decision, 'deny');
  assert.match(deniedDecision.reason, /blocked|denied/i);

  const allowed = runHook('guard-git.mjs', {
    toolCall: { name: 'run_command', args: { CommandLine: 'git status --short' } },
    conversationId: 'certification-fixture',
    workspacePaths: [root],
  });
  assert.equal(allowed.status, 0);
  assert.deepEqual(JSON.parse(allowed.stdout), { decision: 'allow' });
});

test('Codex repository definitions are portable and use the authoritative backend', () => {
  const config = readFileSync(join(codexDir, 'config.toml'), 'utf8');
  const agentSources = [
    ...expectedFiles.map((file) => readFileSync(join(agentsDir, file), 'utf8')),
  ].join('\n');
  const sources = [config, readFileSync(join(codexDir, 'hooks.json'), 'utf8'), agentSources].join('\n');

  assert.doesNotMatch(sources, /C:\\Users\\/i);
  assert.doesNotMatch(agentSources, /Supabase/i);
  assert.match(config, /^\[mcp_servers\.supabase\][\s\S]*?^enabled\s*=\s*false/m);
  assert.match(agentSources, /Convex/);
  assert.match(agentSources, /WorkOS/);

  const goalRunner = readFileSync(join(root, 'scripts', 'goal.mjs'), 'utf8');
  assert.match(goalRunner, /candidate_sha/, 'goal verification evidence must record the tested HEAD SHA');
});
