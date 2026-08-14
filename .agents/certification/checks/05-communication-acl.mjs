import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

// Verify agent communication ACL rules are declared in agent prompts
export default async function checkCommunicationACL() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  // All worker agents must declare ACL
  const workers = ['a1','a2','a3','a4','a5','a6','a7','a8','a9','a10'];
  for (const id of workers) {
    const content = readFileSync(join(agentsDir, `${id}.md`), 'utf8');
    if (!content.includes('Communication ACL') && !content.includes('communication')) {
      throw new Error(`${id}.md missing Communication ACL section`);
    }
    if (!content.includes('May NOT message')) {
      throw new Error(`${id}.md missing 'May NOT message' restriction`);
    }
  }

  // All verifiers must only message A0
  const verifiers = ['v0','v1','v2','v3','v4','v5','v6','v7','v8','v9','v10'];
  for (const id of verifiers) {
    const content = readFileSync(join(agentsDir, `${id}.md`), 'utf8');
    if (!content.includes('May message:') && !content.includes('may_message')) {
      throw new Error(`${id}.md missing communication declaration`);
    }
    // Verifiers should only message A0
    if (content.includes('May message:') && !content.match(/May message.*A0/)) {
      throw new Error(`${id}.md verifier communicates beyond A0`);
    }
  }

  // A4 must not be able to message A5 directly (worker→worker prohibition)
  const a4Content = readFileSync(join(agentsDir, 'a4.md'), 'utf8');
  if (!a4Content.includes('May NOT message') || !a4Content.match(/May NOT message.*A5|A5.*May NOT/)) {
    throw new Error('A4 does not explicitly prohibit messaging A5 (worker→worker violation)');
  }

  const codexGuard = join(root, 'scripts', 'hooks', 'guard-communication.mjs');
  let peerDenied = false;
  try {
    execFileSync('node', [codexGuard], {
      cwd: root,
      input: JSON.stringify({
        tool_name: 'send_message',
        tool_input: { source_agent: 'A4', target_agent: 'A5' },
      }),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error) {
    peerDenied = error.status === 2;
  }
  if (!peerDenied) throw new Error('Codex ACL guard allowed A4 → A5 worker side channel');

  execFileSync('node', [codexGuard], {
    cwd: root,
    input: JSON.stringify({
      tool_name: 'send_message',
      tool_input: { source_agent: 'A4', target_agent: 'A0' },
    }),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
