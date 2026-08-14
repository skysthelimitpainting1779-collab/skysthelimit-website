import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Verify Next.js 16 / React 19 / Motion 12 / Tailwind 4 / Convex stack declarations
export default async function checkNextRuntime() {
  const root = process.cwd();

  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Next.js 16
  if (!deps.next) throw new Error('next not in package.json dependencies');
  if (!deps.next.includes('16')) throw new Error(`Next.js is not version 16 (found: ${deps.next})`);

  // React 19
  if (!deps.react) throw new Error('react not in package.json dependencies');
  if (!deps.react.includes('19')) throw new Error(`React is not version 19 (found: ${deps.react})`);

  // Motion 12
  const motionPkg = deps['motion'] || deps['framer-motion'];
  if (!motionPkg) throw new Error('Motion package not found in dependencies');

  // Tailwind CSS 4
  const twPkg = deps['tailwindcss'];
  if (!twPkg || !twPkg.includes('4')) throw new Error('Tailwind CSS 4 not found in dependencies');

  // TypeScript
  if (!deps['typescript']) throw new Error('TypeScript not found in dependencies');

  // Verify KERNEL.md documents the active platform stack (Next 16, React 19, Convex, WorkOS)
  const kernel = readFileSync(join(root, '.agents/KERNEL.md'), 'utf8');
  if (!kernel.includes('Next.js 16') || !kernel.includes('React 19') || !kernel.includes('Convex') || !kernel.includes('WorkOS')) {
    throw new Error('KERNEL.md does not accurately declare the full platform stack (Next.js 16, React 19, Convex, WorkOS)');
  }
}
