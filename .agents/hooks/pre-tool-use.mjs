#!/usr/bin/env node
/**
 * Antigravity PreToolUse Hook Handler
 * Enforces Git discipline, Graphify-first discovery, production mutation protection, and communication ACL.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf-8'));
  } catch {
    return {};
  }
}

const input = readStdin();
const toolCall = input.toolCall || {};
const toolName = toolCall.name || '';
const args = toolCall.args || {};

let decision = 'allow';
let reason = '';

// 1. Git Safety Enforcements
if (toolName === 'run_command' && args.CommandLine) {
  const cmd = String(args.CommandLine).trim();

  // Block destructive / sloppy git commands
  if (/(?:git\s+add\s+\.|\bgit\s+add\s+-A\b)/i.test(cmd)) {
    decision = 'deny';
    reason = 'HARD DENIAL: "git add ." and "git add -A" are prohibited. Use explicit, surgical file staging (git add <file>).';
  } else if (/(?:git\s+push\s+.*--force|\bgit\s+push\s+.*-f\b)/i.test(cmd)) {
    decision = 'deny';
    reason = 'HARD DENIAL: Force pushing is strictly prohibited to preserve git history integrity.';
  } else if (/--no-verify\b/i.test(cmd)) {
    decision = 'deny';
    reason = 'HARD DENIAL: Bypassing git verification hooks (--no-verify) is prohibited.';
  } else if (/(?:git\s+reset\s+--hard|\bgit\s+clean\s+-(?:fd|df)\b|\bgit\s+restore\s+\.|\bgit\s+commit\b[^\n]*(?:\s-a(?:m)?\b|\s--all\b)|\bHUSKY=0\b)/i.test(cmd)) {
    decision = 'deny';
    reason = 'HARD DENIAL: Destructive, unscoped, or hook-bypassing git commands are prohibited.';
  } else if (/(?:vercel\s+--prod|deploy-production|convex\s+deploy\s+--prod)/i.test(cmd)) {
    decision = 'deny';
    reason = 'HARD DENIAL: Autonomous production deployment/promotion is prohibited. Must flow through Pull Request gate.';
  }
}

// 2. Graphify-First Code Discovery Guard
if (toolName === 'grep_search') {
  const searchPath = String(args.SearchPath || '');
  const query = String(args.Query || '');
  // Permitted if searching non-code, string literals, or specific config file
  const isCodeDir = /(?:src|convex|pages|components|app)/i.test(searchPath) && !searchPath.endsWith('.json') && !searchPath.endsWith('.md');
  if (isCodeDir && (query === '*' || query.length < 3)) {
    decision = 'deny';
    reason = 'GRAPHIFY MANDATE: Broad repository code scans via grep are prohibited. Use Graphify semantic query (npm run graph:query) first.';
  }
}

// 3. Communication ACL Guard
if (toolName === 'send_message') {
  const recipient = String(args.Recipient || '');
  // A4 to A5 direct worker-to-worker side-channel check
  if (input.agentId === 'A4' && input.agentId !== recipient && recipient === 'A5') {
    decision = 'deny';
    reason = 'COMMUNICATION ACL DENIAL: Direct worker-to-worker implementation coordination (A4 -> A5) is prohibited. Report dependencies to A0 Commander.';
  }
}

// Output contract
process.stdout.write(JSON.stringify({ decision, reason }));
