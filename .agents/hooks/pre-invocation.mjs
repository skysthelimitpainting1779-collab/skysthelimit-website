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

const runtimeCircuitFile = join(root, '.learnings', 'CIRCUIT_STATE.json');
const defaultCircuitFile = join(root, '.agents', 'governance', 'CIRCUIT_STATE.default.json');
const circuitFile = existsSync(runtimeCircuitFile) ? runtimeCircuitFile : defaultCircuitFile;
let circuitOpen = false;
if (existsSync(circuitFile)) {
  try {
    const circuit = JSON.parse(readFileSync(circuitFile, 'utf-8'));
    const agentId = input?.agent_id || input?.agentId || input?.senderId;
    const entries = circuit.active_circuits || circuit;
    const entry = agentId
      ? entries[agentId] || Object.entries(entries).find(([key]) => key.startsWith(`${agentId}_`))?.[1]
      : null;
    circuitOpen = entry?.state === 'OPEN';
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
