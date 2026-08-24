#!/usr/bin/env node
/**
 * Re-apply Windows-safe patches to Claude plugins: semgrep + remember.
 * Run after plugin updates: npm run hooks:patch-windows
 */
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const ROOT = join(homedir(), '.claude', 'plugins', 'cache', 'claude-plugins-official');
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(REPO, 'scripts', 'hooks', 'plugin-patches');

function latestPlugin(name) {
  const base = join(ROOT, name);
  if (!existsSync(base)) return null;
  const dirs = readdirSync(base).filter((d) => {
    try {
      return statSync(join(base, d)).isDirectory();
    } catch {
      return false;
    }
  });
  if (!dirs.length) return null;
  dirs.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return join(base, dirs[0]);
}

function cp(from, to) {
  if (!existsSync(from)) {
    console.warn('missing source', from);
    return;
  }
  copyFileSync(from, to);
  console.log('→', to);
}

const semgrep = latestPlugin('semgrep');
const remember = latestPlugin('remember');

if (semgrep) {
  cp(join(SRC, 'semgrep-hook-safe.mjs'), join(semgrep, 'scripts', 'hook-safe.mjs'));
  cp(join(SRC, 'semgrep-hook.sh'), join(semgrep, 'scripts', 'hook.sh'));
  cp(join(SRC, 'semgrep-hooks.json'), join(semgrep, 'hooks', 'hooks.json'));
  cp(join(SRC, 'semgrep-mcp.json'), join(semgrep, '.mcp.json'));
  console.log('patched semgrep →', semgrep);
} else {
  console.warn('semgrep plugin not found under', ROOT);
}

if (remember) {
  cp(join(SRC, 'remember-run-bash.mjs'), join(remember, 'scripts', 'run-bash.mjs'));
  cp(join(SRC, 'remember-hooks.json'), join(remember, 'hooks', 'hooks.json'));
  console.log('patched remember →', remember);
} else {
  console.warn('remember plugin not found under', ROOT);
}

console.log('done. Restart Claude Code session to load hook changes.');
