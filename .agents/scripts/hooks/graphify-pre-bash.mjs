#!/usr/bin/env node
/**
 * PreToolUse for Bash: if command looks like raw grep/find, inject graphify reminder.
 * Replaces fragile sh + python3 one-liner in .claude/settings.json.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function readStdin() {
  try {
    if (process.stdin.isTTY) return '';
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let cmd = '';
try {
  const d = JSON.parse(readStdin() || '{}');
  const input = d.tool_input || d.toolInput || d.input || {};
  cmd = String(input.command || '');
} catch {
  process.exit(0);
}

const rawSearch = /\b(grep|rg\s|ripgrep|find\s|fd\s|ack\s|ag\s)/i.test(cmd);
if (!rawSearch) process.exit(0);

const graph = join(process.cwd(), 'graphify-out', 'graph.json');
if (!existsSync(graph)) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext:
        'ONTOLOGY v2 + graphify: run npm run graph:query before raw grep. Kernel .agents/AGENTS.md. Never dump GRAPH_REPORT or recreate archives.',
    },
  }) + '\n',
);
process.exit(0);
