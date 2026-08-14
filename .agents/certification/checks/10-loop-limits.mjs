import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Verify loop limits and Quality Constitution tamper guard
export default async function checkLoopLimitsAndQualityConstitution() {
  const root = process.cwd();

  // KERNEL.md must declare loop caps
  const kernelContent = readFileSync(join(root, '.agents/KERNEL.md'), 'utf8');
  const loopPatterns = ['remediation attempts', 'verifier rejections', 'Protected Quality Constitution'];
  for (const p of loopPatterns) {
    if (!kernelContent.includes(p)) {
      throw new Error(`KERNEL.md missing loop limit or constitution reference: "${p}"`);
    }
  }

  // Quality Constitution must exist and be protected
  const constitutionPath = join(root, 'evals/constitution.json');
  if (!existsSync(constitutionPath)) {
    throw new Error('evals/constitution.json not found');
  }

  const constitution = JSON.parse(readFileSync(constitutionPath, 'utf8'));
  if (constitution.governance?.tamper_protection?.write_authority !== 'HUMAN_GOVERNOR_ONLY') {
    throw new Error('evals/constitution.json write_authority must be HUMAN_GOVERNOR_ONLY');
  }

  // Held-out cases must exist
  const heldOutDir = join(root, 'evals/held_out');
  if (!existsSync(heldOutDir)) {
    throw new Error('evals/held_out directory missing');
  }
}
