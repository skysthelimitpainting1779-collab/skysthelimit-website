#!/usr/bin/env node
/**
 * Run Entire CLI hooks only if `entire` is on PATH.
 * Avoids bare `sh -c` (broken when PATH still has WSL bash first, or sh missing).
 *
 * Usage: node scripts/hooks/entire-if-present.mjs <claude-code-event> [args...]
 * Example: node scripts/hooks/entire-if-present.mjs session-start
 */
import { spawnSync } from 'node:child_process';

const event = process.argv[2];
if (!event) process.exit(0);

const check = spawnSync('entire', ['--help'], {
  encoding: 'utf8',
  windowsHide: true,
  timeout: 5000,
});

if (check.error || (check.status !== 0 && check.status !== null && !/Usage|entire/i.test(`${check.stdout}${check.stderr}`))) {
  // entire not installed — only special-case session-start message
  if (event === 'session-start') {
    process.stdout.write(
      JSON.stringify({
        systemMessage:
          '\n\nEntire CLI is enabled but not installed or not on PATH.\nInstallation guide: https://docs.entire.io/cli/installation#installation-methods',
      }) + '\n',
    );
  }
  process.exit(0);
}

const args = ['hooks', 'claude-code', event, ...process.argv.slice(3)];
const r = spawnSync('entire', args, {
  stdio: 'inherit',
  windowsHide: true,
  env: process.env,
});

process.exit(r.status === 0 || r.status === null ? 0 : 0); // never block agent on entire
