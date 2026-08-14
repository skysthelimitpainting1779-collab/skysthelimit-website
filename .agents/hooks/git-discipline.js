#!/usr/bin/env node
// git-discipline.js
// Hard-deny hook: blocks dangerous git commands and production mutations
// Antigravity passes tool input via stdin as JSON
'use strict';
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const cmd = (
      input?.tool_input?.CommandLine ||
      input?.toolCall?.args?.CommandLine ||
      input?.CommandLine ||
      (typeof input === 'string' ? input : '')
    );
    const deniedPatterns = [
      /git\s+add\s+\./,
      /git\s+add\s+-A/,
      /git\s+add\s+-a/,
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
        'DENY [git-discipline]: Blocked command: ' + cmd.trim() + '\n' +
        'Violation: ' + violated.toString() + '\n' +
        'Use explicit "git add <file>" and follow branch/worktree/production policy.\n'
      );
      process.exit(2);
    }
  } catch (_) {}
  process.exit(0);
});
