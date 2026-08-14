import { readFileSync } from 'fs';
import { join } from 'path';

// Verify verifier isolation: clean-context inputs declared, no parent transcript received
export default async function checkVerifierIsolation() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  const verifiers = ['v0','v1','v2','v3','v4','v5','v6','v7','v8','v9','v10'];
  for (const id of verifiers) {
    const content = readFileSync(join(agentsDir, `${id}.md`), 'utf8');

    // Must declare clean-context inputs
    if (!content.includes('Clean-Context') && !content.includes('clean_context')) {
      throw new Error(`${id}.md missing Clean-Context Inputs declaration`);
    }

    // Must declare write_access: false or have write-deny hooks
    const hasWriteDeny = content.includes('process.exit(2)') || content.includes('write_access: false');
    if (!hasWriteDeny) {
      throw new Error(`${id}.md missing write access denial`);
    }

    // Must declare output format with PASS/FAIL/UNCERTAIN
    if (!content.includes('PASS') || !content.includes('FAIL') || !content.includes('UNCERTAIN')) {
      throw new Error(`${id}.md missing PASS/FAIL/UNCERTAIN verdict format`);
    }

    // Must NOT contain implementation write tools
    const frontmatterEnd = content.indexOf('---', 3);
    const frontmatter = content.substring(0, frontmatterEnd);
    if (frontmatter.includes('write_to_file') && !content.includes('process.exit(2)')) {
      throw new Error(`${id}.md has write_to_file without denial hook — verifier isolation broken`);
    }
  }

  const codexDir = join(root, '.codex', 'agents');
  for (let index = 0; index <= 10; index++) {
    const id = `V${index}`;
    const content = readFileSync(join(codexDir, `${id}.toml`), 'utf8');
    if (!/clean.context/i.test(content)) throw new Error(`Codex ${id} lacks clean-context isolation`);
    if (!/Parent conversation history is prohibited/i.test(content)) {
      throw new Error(`Codex ${id} does not reject parent reasoning`);
    }
    if (!/PASS.*FAIL.*UNCERTAIN/is.test(content)) throw new Error(`Codex ${id} lacks bounded verdicts`);
    if (!/^sandbox_mode\s*=\s*"read-only"/m.test(content)) throw new Error(`Codex ${id} can write`);
  }
}
