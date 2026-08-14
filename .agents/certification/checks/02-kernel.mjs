import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Verify KERNEL.md exists and contains all 10 required sections
export default async function checkKernel() {
  const root = process.cwd();
  const kernelPath = join(root, '.agents/KERNEL.md');

  if (!existsSync(kernelPath)) {
    throw new Error('.agents/KERNEL.md not found');
  }

  const content = readFileSync(kernelPath, 'utf8');
  const required = [
    'Graphify-First',
    'Context7',
    'Git',
    'Exact-Head',
    'Hub-and-Spoke',
    'Production Hard-Stops',
    'Bounded Remediation',
    'Circuit Breaker',
    'Independent Verification',
    'Error Learning',
  ];

  const missing = required.filter(r => !content.includes(r));
  if (missing.length > 0) {
    throw new Error(`KERNEL.md missing sections: ${missing.join(', ')}`);
  }

  // Verify agents reference the kernel
  const agentsDir = join(root, '.agents/agents');
  for (const id of ['a0','a1','a4','a5']) {
    const agentContent = readFileSync(join(agentsDir, `${id}.md`), 'utf8');
    if (!agentContent.includes('KERNEL.md')) {
      throw new Error(`${id}.md does not reference KERNEL.md`);
    }
  }

  const adapter = readFileSync(join(root, '.agents', 'AGENTS.md'), 'utf8');
  const kernelRule = readFileSync(join(root, '.agents', 'rules', '00-kernel.md'), 'utf8');
  if (!adapter.includes('KERNEL.md') || !kernelRule.includes('@../KERNEL.md')) {
    throw new Error('Antigravity runtime adapter does not inherit the canonical kernel');
  }
}
