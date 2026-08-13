#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const files = {
  decisions: '.agents/CURRENT_DECISIONS.md',
  agents: 'AGENTS.md',
  stack: '.agents/STACK.md',
  specialists: '.agents/specialists.json',
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]),
);

const required = [
  /Convex is the operational backend/i,
  /Clerk proves identity/i,
  /Convex owns authorization/i,
  /migration sources and rollback dependencies only/i,
  /files are private by default/i,
  /No raw PII is stored in browser persistence/i,
];

const forbidden = [
  /one project,\s*one Next service/i,
  /not as a full replacement/i,
  /Supabase Auth OAuth/i,
  /Border radius 0/i,
  /Prefer existing supabase\/lead patterns/i,
  /Prefer vercel\.ts over dual vercel\.json/i,
  /industrial UI radius 0/i,
];

const errors = [];
for (const pattern of required) {
  if (!pattern.test(source.decisions)) errors.push(`decision record missing: ${pattern}`);
}

for (const [name, text] of Object.entries(source)) {
  if (name === 'decisions') continue;
  for (const pattern of forbidden) {
    if (pattern.test(text)) errors.push(`${files[name]} contains stale instruction: ${pattern}`);
  }
}

if (!/CURRENT_DECISIONS\.md/.test(source.agents)) {
  errors.push('AGENTS.md does not link the authoritative decision record');
}
if (!/Convex/.test(source.stack) || !/Clerk/.test(source.stack) || !/Vercel Services/.test(source.stack)) {
  errors.push('.agents/STACK.md does not describe the approved target stack');
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log('[architecture] Current architecture decisions verified.');
