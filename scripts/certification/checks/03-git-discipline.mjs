import { execFileSync } from 'child_process';
import { join } from 'path';

// Simulate banned git commands through the git-discipline hook
export default async function checkGitDiscipline() {
  const root = process.cwd();
  const hookScript = join(root, '.agents/hooks/git-discipline.js');

  const banned = [
    'git add .',
    'git add -A',
    'git commit -a -m "test"',
    'git push --force',
    'git push -f origin main',
    'git reset --hard HEAD',
    'git clean -fd',
  ];

  for (const cmd of banned) {
    const payload = JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine: cmd } } });
    let exited2 = false;
    try {
      execFileSync('node', [hookScript], {
        input: payload,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: root,
      });
    } catch (err) {
      if (err.status === 2) exited2 = true;
    }
    if (!exited2) {
      throw new Error(`git-discipline hook DID NOT deny: "${cmd}"`);
    }
  }
}
