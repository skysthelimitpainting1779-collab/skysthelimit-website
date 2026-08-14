#!/usr/bin/env node
/**
 * Antigravity Stop Hook Handler
 * Prevents premature model stop when verification or required evidence contracts are unfulfilled.
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
let decision = 'allow';
let reason = '';

// Check if background tasks are completely idle
if (input.fullyIdle === false) {
  decision = 'continue';
  reason = 'Background verification or test tasks are still executing. Awaiting completion.';
}

process.stdout.write(JSON.stringify({ decision, reason }));
