#!/usr/bin/env node
/**
 * guard-production.mjs
 * Blocks writes to production secrets, live environment configs, and production promotions.
 */
import { allowHook, commandFrom, denyHook, readHookInput, targetText } from './hook-input.mjs';

const input = await readHookInput();
const targets = targetText(input);
const cmd = commandFrom(input);

// Match protected basenames wherever they occur in a structured path or an
// apply_patch header. Do not anchor to the end of the complete hook payload:
// a real patch includes file headers followed by the patch body.
const pathBoundary = String.raw`(?:^|[\s\\/"'=:({\[])`;
const pathEnd = String.raw`(?=$|[\s"';,)\]}])`;
const forbiddenFiles = [
  new RegExp(`${pathBoundary}(?:\\./)?\\.env\\.production(?:\\.local)?${pathEnd}`, 'im'),
  new RegExp(`${pathBoundary}(?:\\./)?\\.env\\.prod${pathEnd}`, 'im'),
  new RegExp(`${pathBoundary}(?:[^\\s"']*[\\/])?prod\\.secret${pathEnd}`, 'im'),
  new RegExp(`${pathBoundary}(?:[^\\s"']*[\\/])?vercel\\.prod\\.json${pathEnd}`, 'im'),
];

if (forbiddenFiles.some((pattern) => pattern.test(targets))) {
  denyHook(input, 'DENY [guard-production]: Modifications to production environment secrets are hard-blocked.');
}

if (/vercel\s+.*--prod|convex\s+deploy(?:\s+.*)?--prod|git\s+push\s+.*main\b/i.test(cmd)) {
  denyHook(input, 'DENY [guard-production]: Autonomous production deployment commands are hard-blocked.');
}

allowHook(input);
