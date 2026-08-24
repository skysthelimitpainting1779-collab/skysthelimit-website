#!/usr/bin/env node
/**
 * hooks:status — verify all configured hook scripts resolve without path errors.
 *
 * Checks:
 *   1. All Node.js hook entry-points exist relative to project root
 *   2. Hook config files (.claude/settings.json, .agents/hooks.json, etc.) parse
 *   3. Commands referenced in configs point to reachable scripts
 *   4. Optional: graphify Python path resolves (if .graphify_python present)
 *
 * Exit 0 = all reachable, exit 1 = one or more failures.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

/** Resolve a hook command to a script path and check existence. */
function checkCommand(cmd) {
  // Only check node-based commands; sh -c / entire are external CLI
  const nodeMatch = cmd.match(/^node\s+(.+?)(\s|$)/);
  if (!nodeMatch) return { cmd, reachable: true, note: 'external (sh/entire)' };
  const script = nodeMatch[1];
  const abs = resolve(ROOT, script);
  return { cmd, script, abs, reachable: existsSync(abs) };
}

/** Extract all commands from a hooks config object. */
function extractCommands(config) {
  const commands = [];
  // .claude/settings.json shape: { hooks: { Event: [{ matcher, hooks: [{command}] }] } }
  // .agents/hooks.json shape: { "agent-os": { Event: [{ matcher, hooks: [{command}] }] } }
  const roots = config.hooks ? [config.hooks] : [config];
  for (const root of roots) {
    for (const [, entries] of Object.entries(root)) {
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        const hooks = entry.hooks || [];
        for (const h of hooks) {
          if (h.command) commands.push(h.command);
        }
      }
    }
  }
  return commands;
}

const results = [];
let failures = 0;

// --- 1. Core hook scripts existence ---
const coreScripts = [
  'scripts/hooks/run.mjs',
  'scripts/hooks/graphify-pre-bash.mjs',
  'scripts/hooks/entire-if-present.mjs',
  'scripts/active-prevention.mjs',
  'scripts/entire-to-agentos.mjs',
];

for (const rel of coreScripts) {
  const abs = join(ROOT, rel);
  const ok = existsSync(abs);
  results.push({ type: 'script', path: rel, reachable: ok });
  if (!ok) failures++;
}

// --- 2. Hook config files parse + commands reachable ---
const configFiles = [
  '.claude/settings.json',
  '.agents/hooks.json',
  '.cursor/hooks.json',
  '.codex/hooks.json',
];

for (const rel of configFiles) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    results.push({ type: 'config', path: rel, reachable: false, note: 'missing' });
    failures++;
    continue;
  }
  let config;
  try {
    config = JSON.parse(readFileSync(abs, 'utf8'));
    results.push({ type: 'config', path: rel, reachable: true });
  } catch (err) {
    results.push({ type: 'config', path: rel, reachable: false, note: `parse error: ${err.message}` });
    failures++;
    continue;
  }
  // Check commands within
  const commands = extractCommands(config);
  for (const cmd of commands) {
    const chk = checkCommand(cmd);
    if (!chk.reachable) {
      results.push({ type: 'command', config: rel, ...chk });
      failures++;
    }
  }
}

// --- 3. Graphify Python (optional) ---
const pyFile = join(ROOT, 'graphify-out', '.graphify_python');
if (existsSync(pyFile)) {
  const python = readFileSync(pyFile, 'utf8').trim();
  if (python) {
    const pyCheck = spawnSync(python, ['--version'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000,
    });
    const pyOk = !pyCheck.error && pyCheck.status === 0;
    results.push({
      type: 'python',
      path: python,
      reachable: pyOk,
      note: pyOk ? pyCheck.stdout.trim() : (pyCheck.error?.message || `exit ${pyCheck.status}`),
    });
    if (!pyOk) failures++;
  }
} else {
  results.push({ type: 'python', path: null, reachable: true, note: 'not configured (optional)' });
}

// --- 4. Smoke-execute the main runner in status mode ---
const runCheck = spawnSync(process.execPath, [join(ROOT, 'scripts/hooks/run.mjs'), 'status'], {
  cwd: ROOT,
  encoding: 'utf8',
  windowsHide: true,
  timeout: 10_000,
  env: { ...process.env, HOOKS_SKIP: undefined },
});
const runOk = !runCheck.error && runCheck.status === 0;
results.push({
  type: 'exec',
  path: 'scripts/hooks/run.mjs status',
  reachable: runOk,
  note: runOk ? 'executed OK' : (runCheck.error?.message || runCheck.stderr?.slice(0, 200) || `exit ${runCheck.status}`),
});
if (!runOk) failures++;

// --- Output ---
const summary = {
  ok: failures === 0,
  failures,
  checked: results.length,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failures === 0 ? 0 : 1);
