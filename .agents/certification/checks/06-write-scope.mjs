import { readFileSync } from 'fs';
import { join } from 'path';

// Verify write boundary declarations exist in agent prompts
export default async function checkWriteScope() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  // Read-only agents must not have write tools
  const readOnlyAgents = ['a1', 'a6', 'a10'];
  for (const id of readOnlyAgents) {
    const content = readFileSync(join(agentsDir, `${id}.md`), 'utf8');
    // Check frontmatter doesn't include write_to_file
    if (content.includes('  - write_to_file') && id === 'a1') {
      throw new Error(`${id}.md (read-only) lists write_to_file in tools`);
    }
    // A6 default mode is read-only — verify write tools NOT listed  
    if (id === 'a6' && content.includes('  - write_to_file')) {
      throw new Error(`${id}.md (default read-only) lists write_to_file in tools`);
    }
    // A10 is read-only
    if (id === 'a10' && content.includes('  - write_to_file')) {
      throw new Error(`${id}.md (read-only) lists write_to_file in tools`);
    }
  }

  // Verifiers must have deny hook for write_to_file
  const verifiers = ['v0','v1','v4','v5','v10'];
  for (const id of verifiers) {
    const content = readFileSync(join(agentsDir, `${id}.md`), 'utf8');
    if (!content.includes('write_to_file') || !content.includes('process.exit(2)')) {
      throw new Error(`${id}.md missing write-deny hook`);
    }
  }

  // A5 must declare convex/** as allowed and NOT include src/components in allowed writes
  const a5Content = readFileSync(join(agentsDir, 'a5.md'), 'utf8');
  const a5Allowed = a5Content.match(/Allowed Writes:([^\n]+)/)?.[1] || '';
  if (!a5Allowed.includes('convex/**')) {
    throw new Error('A5 missing convex/** in Allowed Writes');
  }
  if (a5Allowed.includes('src/components')) {
    throw new Error('A5 incorrectly claims write access to src/components/**');
  }

  // A4 must not claim write access to convex/** in allowed writes
  const a4Content = readFileSync(join(agentsDir, 'a4.md'), 'utf8');
  const a4Allowed = a4Content.match(/Allowed Writes:([^\n]+)/)?.[1] || '';
  if (a4Allowed.includes('convex')) {
    throw new Error('A4 incorrectly claims write access to convex/**');
  }

  const codexDir = join(root, '.codex', 'agents');
  const codexReadOnly = [
    'A1', 'A6', 'A10',
    ...Array.from({ length: 11 }, (_, index) => `V${index}`),
    ...Array.from({ length: 8 }, (_, index) => `S${index + 1}`),
  ];
  for (const id of codexReadOnly) {
    const content = readFileSync(join(codexDir, `${id}.toml`), 'utf8');
    if (!/^sandbox_mode\s*=\s*"read-only"/m.test(content)) {
      throw new Error(`Codex ${id} is not structurally read-only`);
    }
  }
}
