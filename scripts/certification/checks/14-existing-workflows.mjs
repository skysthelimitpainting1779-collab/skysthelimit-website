import { existsSync } from 'fs';
import { join } from 'path';

// Verify existing CI/CD workflows were not deleted or replaced
export default async function checkExistingWorkflows() {
  const root = process.cwd();
  const workflowsDir = join(root, '.github/workflows');

  const required = [
    'ci.yml',
    'security.yml',
  ];

  // These may have different names — check for key keywords
  const workflowVariants = {
    'preview-verification': ['preview-verification.yml', 'preview_verification.yml', 'preview.yml'],
    'release-verification': ['release-verification.yml', 'release_verification.yml', 'release.yml'],
  };

  const missing = required.filter(f => !existsSync(join(workflowsDir, f)));
  if (missing.length > 0) {
    throw new Error(`Required workflows missing: ${missing.join(', ')}`);
  }

  // Check workflow variants
  const missingVariants = [];
  for (const [name, variants] of Object.entries(workflowVariants)) {
    const found = variants.some(v => existsSync(join(workflowsDir, v)));
    if (!found) {
      missingVariants.push(name);
    }
  }
  if (missingVariants.length > 0) {
    // Non-fatal: log warning but don't fail (they may have different names)
    console.warn(`\n  [WARN] Workflow variants not found: ${missingVariants.join(', ')} — verify manually`);
  }

  // A7 must reference existing workflows by name
  const { readFileSync, readdirSync } = await import('fs');
  const a7 = readFileSync(join(root, '.agents/agents/a7.md'), 'utf8');
  for (const f of required) {
    const baseName = f.replace('.yml', '');
    if (!a7.includes(baseName) && !a7.includes(f)) {
      throw new Error(`A7 agent does not reference existing workflow: ${f}`);
    }
  }
}
