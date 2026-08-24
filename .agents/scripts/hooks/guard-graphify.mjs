#!/usr/bin/env node
/**
 * guard-graphify.mjs
 * Hard-denies unstructured code discovery via grep without an explicit Graphify exhaustion record.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const toolInput = input?.tool_input || input?.toolCall?.args || {};
    const searchPath = (toolInput?.SearchPath || '').toLowerCase();
    const query = (toolInput?.Query || '').toLowerCase();
    const breakGlass = toolInput?.break_glass_justification;

    // Check for code target
    const isCodeTarget =
      /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(searchPath) ||
      /(?:^|[\\/])(src|convex|app|components|pages|lib|hooks)\b/i.test(searchPath);

    const isDiscoveryQuery = /function|class|import|export|component|route|hook|interface|type\s|const\s|async\s|query|mutation|action/i.test(query);

    if (isCodeTarget && isDiscoveryQuery) {
      // Check if Graphify exhaustion is recorded
      const root = getWorkspaceRoot();
      const exhaustionFile = join(root, '.learnings', 'GRAPHIFY_EXHAUSTION.json');
      const hasRecordedExhaustion = existsSync(exhaustionFile);

      if (breakGlass || hasRecordedExhaustion) {
        process.stderr.write(`[guard-graphify] Break-glass / Exhaustion permitted for query: "${query}"\n`);
        process.exit(0);
      }

      process.stderr.write(
        'DENY [guard-graphify]: Code structure discovery via grep is prohibited.\n' +
        'Required sequence: Graphify query → inspect node → traverse neighbors → read surfaced files.\n' +
        'Run: npm run graph:query -- "<question>"\n' +
        'To break glass: add break_glass_justification or log exhaustion to .learnings/GRAPHIFY_EXHAUSTION.json.\n'
      );
      process.exit(2);
    }
  } catch (_) {}
  process.exit(0);
});
