#!/usr/bin/env node
/**
 * guard-production.mjs
 * Blocks writes to production secrets, live environment configs, and production promotions.
 */
import { allowHook, commandFrom, denyHook, readHookInput, targetText } from './hook-input.mjs';

const input = await readHookInput();
const targets = targetText(input);
const cmd = commandFrom(input);

const forbiddenFiles = [
      /\.env\.production(\.local)?$/i,
      /\.env\.prod$/i,
      /prod\.secret/i,
      /vercel\.prod\.json/i,
];

if (forbiddenFiles.some((pattern) => pattern.test(targets))) {
  denyHook(input, 'DENY [guard-production]: Modifications to production environment secrets are hard-blocked.');
}

if (/vercel\s+.*--prod|convex\s+deploy(?:\s+.*)?--prod|git\s+push\s+.*main\b/i.test(cmd)) {
  denyHook(input, 'DENY [guard-production]: Autonomous production deployment commands are hard-blocked.');
}

allowHook(input);
