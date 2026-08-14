#!/usr/bin/env node
/**
 * guard-git.mjs
 * Hard-denies dangerous git commands and unprotected branch writes.
 */
import { allowHook, commandFrom, denyHook, readHookInput } from './hook-input.mjs';

const input = await readHookInput();
const cmd = commandFrom(input);

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

const violated = deniedPatterns.find((pattern) => pattern.test(cmd));
if (violated) {
  denyHook(
    input,
    `DENY [guard-git]: Blocked command: ${cmd.trim()}\n` +
    `Violation: ${violated.toString()}\n` +
    'Use explicit "git add <file>" and follow branch/worktree/production policy.',
  );
}

allowHook(input);
