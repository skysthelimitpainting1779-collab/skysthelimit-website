import { readFileSync } from 'fs';
import { join } from 'path';

// Verify WorkOS AuthKit ownership is correctly declared in A6 and KERNEL.md
export default async function checkWorkOSBoundary() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  // A6 must reference WorkOS
  const a6 = readFileSync(join(agentsDir, 'a6.md'), 'utf8');
  if (!a6.includes('WorkOS')) {
    throw new Error('A6 does not reference WorkOS');
  }
  if (!a6.includes('AuthKit')) {
    throw new Error('A6 does not reference AuthKit');
  }

  // A6 must document the trust chain
  if (!a6.includes('src/proxy.ts') && !a6.includes('middleware')) {
    throw new Error('A6 missing src/proxy.ts trust boundary reference');
  }

  // A6 must be default read-only
  const a6Frontmatter = a6.substring(0, a6.indexOf('---', 3));
  if (a6Frontmatter.includes('write_to_file')) {
    throw new Error('A6 lists write_to_file in frontmatter tools — must be read-only by default');
  }

  // KERNEL.md must document WorkOS in the trust architecture
  const kernel = readFileSync(join(root, '.agents/KERNEL.md'), 'utf8');
  if (!kernel.includes('WorkOS')) {
    throw new Error('KERNEL.md does not reference WorkOS in architecture section');
  }

  // A5 must reference WorkOS identity integration
  const a5 = readFileSync(join(agentsDir, 'a5.md'), 'utf8');
  if (!a5.includes('WorkOS') && !a5.includes('AuthKit')) {
    throw new Error('A5 (Convex engineer) missing WorkOS/AuthKit identity integration reference');
  }
}
