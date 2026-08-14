import { existsSync, readFileSync, readdirSync } from 'fs';
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

  const codexDir = join(root, '.codex', 'agents');
  const codexRequired = [
    ...Array.from({ length: 11 }, (_, index) => `A${index}.toml`),
    ...Array.from({ length: 11 }, (_, index) => `V${index}.toml`),
    ...Array.from({ length: 8 }, (_, index) => `S${index + 1}.toml`),
  ].sort();
  const codexActual = readdirSync(codexDir).filter((file) => file.endsWith('.toml')).sort();
  if (JSON.stringify(codexActual) !== JSON.stringify(codexRequired)) {
    throw new Error(`Codex agent set drifted: expected ${codexRequired.length}, found ${codexActual.length}`);
  }

  for (const file of codexRequired) {
    const content = readFileSync(join(codexDir, file), 'utf8');
    if (!/^name\s*=\s*".+"/m.test(content) || !/^description\s*=\s*".+"/m.test(content)) {
      throw new Error(`${file} is missing required Codex identity fields`);
    }
    if (!/^developer_instructions\s*=\s*"""/m.test(content) || /^instructions\s*=/m.test(content)) {
      throw new Error(`${file} does not use the current Codex developer_instructions schema`);
    }
    if (/C:\\Users\\|Supabase/i.test(content)) {
      throw new Error(`${file} contains a machine-specific path or obsolete backend routing`);
    }
  }

  const codexConfig = readFileSync(join(root, '.codex', 'config.toml'), 'utf8');
  if (!/^\[mcp_servers\.supabase\][\s\S]*?^enabled\s*=\s*false/m.test(codexConfig)) {
    throw new Error('Codex project config does not withhold the user-global Supabase MCP');
  }
}
