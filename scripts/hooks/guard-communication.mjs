#!/usr/bin/env node
/** Enforce the hub-and-spoke ACL when the host exposes source and target identities. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';
import { allowHook, denyHook, readHookInput, sourceAgent, targetAgent } from './hook-input.mjs';

const input = await readHookInput();
const source = sourceAgent(input);
const target = targetAgent(input);

// Some Codex tool events do not expose the current role. In that case the
// declarative custom-agent contract remains authoritative; never invent identity.
if (!source || !target) {
  allowHook(input);
  process.exit(0);
}

let allowed = false;
if (source === 'A0') {
  allowed = /^A(?:[1-9]|10)$/.test(target) || target === 'V0';
} else if (/^A(?:[1-9]|10)$/.test(source)) {
  const verifier = `V${source.slice(1)}`;
  let specialistIds = [];
  try {
    const registry = JSON.parse(readFileSync(join(getWorkspaceRoot(), '.agents', 'specialists.json'), 'utf8'));
    specialistIds = registry.specialists
      .filter((specialist) => specialist.parent === source)
      .map((specialist) => specialist.id);
  } catch {}
  allowed = target === 'A0' || target === verifier || specialistIds.includes(target);
} else if (/^S\d{1,2}$/.test(source)) {
  try {
    const registry = JSON.parse(readFileSync(join(getWorkspaceRoot(), '.agents', 'specialists.json'), 'utf8'));
    allowed = registry.specialists.some((specialist) => specialist.id === source && specialist.parent === target);
  } catch {
    allowed = false;
  }
} else if (/^V\d{1,2}$/.test(source)) {
  allowed = target === 'A0';
}

if (!allowed) {
  denyHook(
    input,
    `DENY [guard-communication]: ${source} may not message or spawn ${target}.\n` +
    'Route standing-agent coordination through A0; specialists report only to their parent.',
  );
}

allowHook(input);
