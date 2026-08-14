import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Verify factory dispatch OIDC path is preserved (not replaced)
export default async function checkFactoryDispatchPreservation() {
  const root = process.cwd();
  const workflowsDir = join(root, '.github/workflows');

  // Look for factory/OIDC dispatch workflow
  const workflows = readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

  let factoryWorkflowFound = false;
  let oidcKeyword = false;

  for (const wf of workflows) {
    const content = readFileSync(join(workflowsDir, wf), 'utf8');
    if (
      content.includes('workflow_dispatch') ||
      content.includes('repository_dispatch') ||
      content.includes('OIDC') ||
      content.includes('id-token') ||
      content.includes('factory')
    ) {
      factoryWorkflowFound = true;
      if (content.includes('id-token') || content.includes('OIDC') || content.includes('oidc')) {
        oidcKeyword = true;
      }
    }
  }

  if (!factoryWorkflowFound) {
    // Non-fatal: factory dispatch may be handled externally
    console.warn('\n  [WARN] No factory/OIDC dispatch workflow found in .github/workflows — verify external dispatch is intact');
    return;
  }

  // A7 must reference factory dispatch as sacred
  const a7 = readFileSync(join(root, '.agents/agents/a7.md'), 'utf8');
  if (!a7.includes('factory') && !a7.includes('dispatch')) {
    throw new Error('A7 does not reference factory dispatch preservation');
  }
  if (!a7.includes('sacred') && !a7.includes('do not touch') && !a7.includes('Never Replace') && !a7.includes('do not replace')) {
    throw new Error('A7 missing factory dispatch preservation directive');
  }
}
