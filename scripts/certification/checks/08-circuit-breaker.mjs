import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Verify circuit breaker state file exists and pre-invocation hook reads it
export default async function checkCircuitBreaker() {
  const root = process.cwd();

  // Circuit state file must exist with correct structure
  const circuitPath = join(root, '.learnings/CIRCUIT_STATE.json');
  if (!existsSync(circuitPath)) {
    throw new Error('.learnings/CIRCUIT_STATE.json not found');
  }

  const state = JSON.parse(readFileSync(circuitPath, 'utf8'));
  const requiredAgents = ['A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10'];
  const missingAgents = requiredAgents.filter(id => !(id in state));
  if (missingAgents.length > 0) {
    throw new Error(`CIRCUIT_STATE.json missing agents: ${missingAgents.join(', ')}`);
  }

  // All required agents must have a valid state field
  for (const id of requiredAgents) {
    const entry = state[id];
    if (!entry || !['CLOSED','OPEN','HALF_OPEN'].includes(entry.state)) {
      throw new Error(`CIRCUIT_STATE.json agent ${id} has invalid state: ${entry?.state}`);
    }
  }

  // Pre-invocation hook must reference circuit state
  const preInvPath = join(root, '.agents/hooks/pre-invocation.mjs');
  if (!existsSync(preInvPath)) {
    throw new Error('.agents/hooks/pre-invocation.mjs not found');
  }
  const hookContent = readFileSync(preInvPath, 'utf8');
  if (!hookContent.includes('CIRCUIT_STATE') && !hookContent.includes('circuit')) {
    throw new Error('pre-invocation.mjs does not reference circuit state');
  }
}
