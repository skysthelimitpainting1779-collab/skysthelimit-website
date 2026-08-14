#!/usr/bin/env node
/** Cross-platform bridge that preserves Entire CLI checkpoint hooks for Codex. */
import { spawnSync } from 'node:child_process';

const event = process.argv[2];
const input = await new Promise((resolve) => {
  const chunks = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk));
  process.stdin.on('end', () => resolve(Buffer.concat(chunks)));
});

const result = spawnSync('entire', ['hooks', 'codex', event], {
  input,
  encoding: 'buffer',
  shell: false,
});

if (result.error?.code === 'ENOENT') {
  if (event === 'session-start') {
    process.stdout.write(JSON.stringify({
      systemMessage: 'Entire CLI is enabled but not installed or not on PATH. Installation: https://docs.entire.io/cli/installation#installation-methods',
    }));
  }
  process.exit(0);
}

if (result.stdout?.length) process.stdout.write(result.stdout);
if (result.stderr?.length) process.stderr.write(result.stderr);
process.exit(result.status ?? 0);
