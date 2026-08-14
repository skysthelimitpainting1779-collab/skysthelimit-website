import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Check all A0-A10 and V0-V10 agent files exist
export default async function checkDiscovery() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  const required = [
    'a0.md','a1.md','a2.md','a3.md','a4.md','a5.md',
    'a6.md','a7.md','a8.md','a9.md','a10.md',
    'v0.md','v1.md','v2.md','v3.md','v4.md','v5.md',
    'v6.md','v7.md','v8.md','v9.md','v10.md',
  ];

  const missing = required.filter(f => !existsSync(join(agentsDir, f)));
  if (missing.length > 0) {
    throw new Error(`Missing agent files: ${missing.join(', ')}`);
  }

  // Verify each has YAML frontmatter with name field
  for (const f of required) {
    const content = readFileSync(join(agentsDir, f), 'utf8');
    if (!content.startsWith('---')) {
      throw new Error(`${f} missing YAML frontmatter`);
    }
    if (!content.includes('name:')) {
      throw new Error(`${f} missing 'name:' in frontmatter`);
    }
  }
}
