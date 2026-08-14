#!/usr/bin/env node
/**
 * Antigravity PostToolUse Hook Handler
 * Records errors, tracks failure frequencies, and logs learning signals into .learnings/.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf-8'));
  } catch {
    return {};
  }
}

const input = readStdin();
const root = process.cwd();
const learningsDir = join(root, '.learnings');

if (input.error) {
  try {
    mkdirSync(learningsDir, { recursive: true });
    const logFile = join(learningsDir, 'PROVISIONAL_ERRORS.jsonl');
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      stepIdx: input.stepIdx,
      error: input.error,
      agentId: input.agentId || 'unknown'
    }) + '\n';
    writeFileSync(logFile, entry, { flag: 'a' });
  } catch {}
}

process.stdout.write(JSON.stringify({}));
