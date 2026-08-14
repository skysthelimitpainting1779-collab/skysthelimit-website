#!/usr/bin/env node
// graphify-grep-enforcer.js
// DENY hook: blocks grep_search on code files for structure/discovery queries.
// "Graphify did not immediately give me the answer" is NOT exhaustion.
// Break-glass: requires documented break_glass_justification in tool input.
'use strict';
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const toolInput = input?.tool_input || input?.toolCall?.args || {};
    const searchPath = (toolInput?.SearchPath || '').toLowerCase();
    const query = (toolInput?.Query || '').toLowerCase();
    const breakGlass = toolInput?.break_glass_justification;

    // Intercept code-file searches
    const isCodeTarget =
      /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(searchPath) ||
      /(?:^|[\\/])(src|convex|app|components|pages|lib|hooks)\b/i.test(searchPath);

    const isDiscoveryQuery = /function|class|import|export|component|route|hook|interface|type\s|const\s|async\s|query|mutation|action/i.test(query);

    if (isCodeTarget && isDiscoveryQuery) {
      if (breakGlass) {
        // Allow but log
        process.stderr.write(
          '[graphify-enforcer] BREAK-GLASS granted: ' + breakGlass + '\n'
        );
        process.exit(0);
      }
      process.stderr.write(
        'DENY [graphify-enforcer]: Code structure discovery via grep is prohibited.\n' +
        'Required sequence: Graphify query → inspect node → traverse neighbors → read surfaced files.\n' +
        'Run: npm run graph:query -- "<question>"\n' +
        'To break-glass: add break_glass_justification to your tool call after documenting Graphify exhaustion.\n'
      );
      process.exit(2);
    }
  } catch (_) {}
  process.exit(0);
});
