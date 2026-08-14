#!/usr/bin/env node
/**
 * guard-graphify.mjs
 * Hard-denies unstructured code discovery via grep without an explicit Graphify exhaustion record.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';
import { allowHook, commandFrom, denyHook, readHookInput, toolInput, toolName } from './hook-input.mjs';

const input = await readHookInput();
const args = toolInput(input);
const command = commandFrom(input);
const searchPath = String(args?.SearchPath ?? args?.search_path ?? '').toLowerCase();
const query = String(args?.Query ?? args?.query ?? '').toLowerCase();
const breakGlass = args?.break_glass_justification;
const hostTool = toolName(input);

const structuredSearch = /(?:^|[;&|]\s*|\s)(?:rg|grep)(?:\.exe)?\s|Select-String\b/i.test(command);
const recursiveDiscovery = /(?:Get-ChildItem|gci|dir)\b[^\r\n]*(?:-Recurse|-r\b)|(?:rg|grep)\b[^\r\n]*--files/i.test(command);
const codeTarget =
  /\.(?:ts|tsx|js|jsx|mjs|cjs)(?:\s|['"]|$)/i.test(`${searchPath} ${command}`) ||
  /(?:^|[\\/\s'"])(?:src|convex|app|components|pages|lib|hooks)(?:[\\/\s'"*]|$)/i.test(`${searchPath} ${command}`) ||
  (!/\b(?:docs?|\.agents|\.codex|\.github|config|\.md|\.json|\.toml|\.ya?ml)\b/i.test(command) && structuredSearch);

const legacyDiscovery =
  codeTarget &&
  /function|class|import|export|component|route|hook|interface|type\s|const\s|async\s|query|mutation|action/i.test(query);
const legacyFileDiscovery =
  hostTool === 'find_by_name' &&
  /(?:src|convex|app|components|pages|lib|hooks)|\.(?:ts|tsx|js|jsx|mjs|cjs)/i.test(
    `${args?.SearchDirectory ?? ''} ${args?.Pattern ?? ''} ${args?.Extensions ?? ''}`,
  );
const isCodeDiscovery = legacyDiscovery || legacyFileDiscovery || recursiveDiscovery || (structuredSearch && codeTarget);

if (isCodeDiscovery) {
  const root = getWorkspaceRoot();
  const exhaustionFile = join(root, '.learnings', 'GRAPHIFY_EXHAUSTION.json');
  let hasRecordedExhaustion = false;
  if (existsSync(exhaustionFile)) {
    try {
      const record = JSON.parse(readFileSync(exhaustionFile, 'utf8'));
      hasRecordedExhaustion = Boolean(record && Object.keys(record).length > 0);
    } catch {
      hasRecordedExhaustion = false;
    }
  }

  if (breakGlass || hasRecordedExhaustion) {
    process.stderr.write('[guard-graphify] Scoped fallback permitted by a recorded exhaustion decision.\n');
    allowHook(input);
    process.exit(0);
  }

  denyHook(
    input,
    'DENY [guard-graphify]: Broad code discovery outside Graphify is prohibited.\n' +
    'Required sequence: Graphify query → inspect node → traverse neighbors → read surfaced files.\n' +
    'Run: npm run graph:query -- "<question>"\n' +
    'For a scoped fallback, record exhaustion in .learnings/GRAPHIFY_EXHAUSTION.json.',
  );
}

allowHook(input);
