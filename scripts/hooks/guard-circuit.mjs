#!/usr/bin/env node
/**
 * guard-circuit.mjs
 * Blocks agent execution if the requesting agent's circuit breaker state is OPEN.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';
import { allowHook, denyHook, readHookInput, sourceAgent, targetAgent } from './hook-input.mjs';

const input = await readHookInput();
const agentId = sourceAgent(input) || targetAgent(input);

const root = getWorkspaceRoot();
const runtimeStateFile = join(root, '.learnings', 'CIRCUIT_STATE.json');
const defaultStateFile = join(root, '.agents', 'governance', 'CIRCUIT_STATE.default.json');
const stateFile = existsSync(runtimeStateFile) ? runtimeStateFile : defaultStateFile;

if (agentId && existsSync(stateFile)) {
  try {
    const state = JSON.parse(readFileSync(stateFile, 'utf8'));
    const circuits = state?.active_circuits ?? state;
    const circuit =
      circuits?.[agentId] ??
      Object.entries(circuits ?? {}).find(([key]) => key === agentId || key.startsWith(`${agentId}_`))?.[1];

    if (circuit?.state === 'OPEN') {
      denyHook(
        input,
        `DENY [guard-circuit]: Circuit is OPEN for agent ${agentId}.\n` +
        'Remediation limit exceeded or a critical boundary tripped.\n' +
        'Only A0 Commander may authorize HALF_OPEN recovery.',
      );
    }
  } catch {
    denyHook(input, 'DENY [guard-circuit]: Circuit ledger is malformed; execution cannot be proven safe.');
  }
}

allowHook(input);
