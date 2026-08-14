import { readFileSync } from 'fs';
import { join } from 'path';

// Verify Convex ownership boundary is correctly declared in agent prompts
export default async function checkConvexBoundary() {
  const root = process.cwd();
  const agentsDir = join(root, '.agents/agents');

  // A5 must own convex/**
  const a5 = readFileSync(join(agentsDir, 'a5.md'), 'utf8');
  if (!a5.includes('convex/**')) {
    throw new Error('A5 does not declare convex/** ownership');
  }

  // A5 must not reference Supabase as runtime
  if (a5.toLowerCase().includes('supabase')) {
    throw new Error('A5 contains Supabase reference — remove it (Convex is the runtime data layer)');
  }

  // A4 must NOT claim write to convex/** in Allowed Writes
  const a4 = readFileSync(join(agentsDir, 'a4.md'), 'utf8');
  const a4Allowed = a4.match(/Allowed Writes:([^\n]+)/)?.[1] || '';
  if (a4Allowed.includes('convex')) {
    throw new Error('A4 claims write access to convex/** — boundary violation');
  }

  // A4 must declare prohibition on silent backend writes
  if (!a4.includes('convex/**') || !a4.includes('report') || !a4.includes('A0')) {
    throw new Error('A4 missing prohibition on silent backend writes + escalation to A0');
  }

  // KERNEL.md must declare Convex as application state layer
  const kernel = readFileSync(join(root, '.agents/KERNEL.md'), 'utf8');
  if (!kernel.includes('Convex')) {
    throw new Error('KERNEL.md does not mention Convex as runtime data layer');
  }
}
