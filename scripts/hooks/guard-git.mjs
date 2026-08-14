#!/usr/bin/env node
/**
 * guard-git.mjs
 * Hard-denies dangerous git commands and unprotected branch writes.
 */
import { readFileSync } from 'node:fs';

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const cmd = (
      input?.tool_input?.CommandLine ||
      input?.toolCall?.args?.CommandLine ||
      input?.CommandLine ||
      (typeof input === 'string' ? input : '')
    );

    const deniedPatterns = [
      /git\s+add\s+\.(\s+|$)/,
      /git\s+add\s+-A(\s+|$)/,
      /git\s+add\s+-a(\s+|$)/,
      /git\s+commit\s+-a/,
      /git\s+push\s+.*--force/,
      /git\s+push\s+.*-f\b/,
      /--no-verify/,
      /git\s+reset\s+--hard/,
      /git\s+clean\s+-fd/,
      /git\s+commit\s+.*\bmain\b/,
      /git\s+commit\s+.*\bdev\b/,
      /git\s+push\s+.*main\b/,
      /git\s+push\s+.*dev\b/,
      /vercel\s+.*--prod/,
      /convex\s+.*--prod/,
    ];

    const violated = deniedPatterns.find(p => p.test(cmd));
    if (violated) {
      process.stderr.write(
        `DENY [guard-git]: Blocked command: ${cmd.trim()}\n` +
        `Violation: ${violated.toString()}\n` +
        `Use explicit "git add <file>" and follow branch/worktree/production policy.\n`
      );
      process.exit(2);
    }
  } catch (_) {}
  process.exit(0);
});
