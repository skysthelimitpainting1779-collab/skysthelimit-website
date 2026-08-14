#!/usr/bin/env node
/**
 * Antigravity PreInvocation Hook Handler
 * Inspects agent identity, circuit state, graph health, and injects context before model turn.
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
const root = process.cwd();

const circuitFile = join(root, '.learnings', 'CIRCUIT_STATE.json');
let circuitOpen = false;
if (existsSync(circuitFile)) {
  try {
    const circuit = JSON.parse(readFileSync(circuitFile, 'utf-8'));
    if (circuit.state === 'OPEN') {
      circuitOpen = true;
    }
  } catch {}
}

const injectSteps = [];
if (circuitOpen) {
  injectSteps.push({
    ephemeralMessage: "[CIRCUIT_BREAKER_OPEN]: Automated retries are currently paused. Escalating to A0 Commander for strategy reconciliation."
  });
}

// Output contract expected by Antigravity engine
const output = {
  injectSteps
};

process.stdout.write(JSON.stringify(output));
