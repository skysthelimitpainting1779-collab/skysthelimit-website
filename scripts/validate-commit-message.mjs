#!/usr/bin/env node
import { readFileSync } from 'node:fs';

import { validateGovernedCommit } from './lib/development-lifecycle.mjs';

const messagePath = process.argv[2];
if (!messagePath) {
  console.error('[Lifecycle] commit message file is required');
  process.exit(2);
}

const message = readFileSync(messagePath, 'utf8');
if (/^Merge\b/.test(message.trimStart())) process.exit(0);

const errors = validateGovernedCommit(message);
if (errors.length) {
  console.error('[Lifecycle] Commit rejected:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
