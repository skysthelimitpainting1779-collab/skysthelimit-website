import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Verify skills-lock integrity
export default async function checkSkillLock() {
  const root = process.cwd();

  // specialists.json must exist and be valid JSON
  const specialistsPath = join(root, '.agents/specialists.json');
  if (!existsSync(specialistsPath)) {
    throw new Error('.agents/specialists.json not found');
  }

  let specialists;
  try {
    specialists = JSON.parse(readFileSync(specialistsPath, 'utf8'));
  } catch (err) {
    throw new Error(`.agents/specialists.json is invalid JSON: ${err.message}`);
  }

  // Must have agents array with all 11 agents
  if (!Array.isArray(specialists.agents)) {
    throw new Error('specialists.json missing agents array');
  }

  const ids = specialists.agents.map(a => a.id);
  const required = ['A0','A1','A2','A3','A4','A5','A6','A7','A8','A9','A10'];
  const missing = required.filter(id => !ids.includes(id));
  if (missing.length > 0) {
    throw new Error(`specialists.json missing agent entries: ${missing.join(', ')}`);
  }

  // Current Antigravity discovers per-sidecar sidecar.json files, not a
  // workspace-level aggregate registry. The legacy hardcoded file must stay retired.
  const sidecarsPath = join(root, '.agents/sidecars.json');
  if (existsSync(sidecarsPath)) throw new Error('Unsupported legacy .agents/sidecars.json is present');

  const mcpPath = join(root, '.agents/mcp_config.json');
  const mcpSource = readFileSync(mcpPath, 'utf8');
  JSON.parse(mcpSource);
  if (/C:\\Users\\/i.test(mcpSource)) throw new Error('mcp_config.json contains a machine-specific path');

  // hooks.json must be valid JSON
  const hooksPath = join(root, '.agents/hooks.json');
  try {
    const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
    if (!hooks['git-discipline'] || !hooks['graphify-enforcer']) {
      throw new Error('hooks.json missing git-discipline or graphify-enforcer entries');
    }
  } catch (err) {
    throw new Error(`hooks.json error: ${err.message}`);
  }
}
