import { execFileSync } from 'child_process';
import { join } from 'path';

// Verify production deployment commands are blocked
export default async function checkProductionSafety() {
  const root = process.cwd();
  const hookScript = join(root, '.agents/hooks/git-discipline.js');

  const prodCommands = [
    'vercel --prod',
    'npx vercel --prod',
    'vercel deploy --prod',
    'convex deploy --prod',
    'git push origin main',
  ];

  for (const cmd of prodCommands) {
    const payload = JSON.stringify({ toolCall: { name: 'run_command', args: { CommandLine: cmd } } });
    let denied = false;
    try {
      execFileSync('node', [hookScript], {
        input: payload,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: root,
      });
    } catch (err) {
      if (err.status === 2) denied = true;
    }
    if (!denied) {
      throw new Error(`Production command NOT denied: "${cmd}"`);
    }
  }

  // Verify pre-tool-use.mjs also has production stop
  const { readFileSync } = await import('fs');
  const preToolContent = readFileSync(join(root, '.agents/hooks/pre-tool-use.mjs'), 'utf8');
  if (!preToolContent.includes('vercel') || !preToolContent.includes('prod')) {
    throw new Error('pre-tool-use.mjs missing production deployment guard');
  }
}
