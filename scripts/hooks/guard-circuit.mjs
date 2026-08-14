#!/usr/bin/env node
/**
 * guard-circuit.mjs
 * Blocks agent execution if the requesting agent's circuit breaker state is OPEN.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const agentId = input?.agent_id || input?.agentId || input?.senderId;

    const root = getWorkspaceRoot();
    const stateFile = join(root, '.learnings', 'CIRCUIT_STATE.json');

    if (existsSync(stateFile)) {
      const state = JSON.parse(readFileSync(stateFile, 'utf8'));
      if (agentId && state[agentId]?.state === 'OPEN') {
        process.stderr.write(
          `DENY [guard-circuit]: Circuit is OPEN for agent ${agentId}.\n` +
          `Remediation limit exceeded or critical boundary tripped.\n` +
          `Only A0 Commander may authorize HALF_OPEN recovery.\n`
        );
        process.exit(2);
      }
    }
  } catch (_) {}
  process.exit(0);
});
