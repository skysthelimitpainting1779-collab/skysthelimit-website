import { execFileSync } from 'child_process';
import { join } from 'path';

// Verify graphify-grep-enforcer DENIES code structure discovery on TS/JS files
export default async function checkGraphifyEnforcement() {
  const root = process.cwd();
  const hookScript = join(root, '.agents/hooks/graphify-grep-enforcer.js');

  const codeDiscoveryAttempts = [
    { SearchPath: 'src/app', Query: 'function handleSubmit' },
    { SearchPath: 'convex/mutations', Query: 'export async' },
    { SearchPath: 'src/components/ui', Query: 'import React' },
  ];

  for (const args of codeDiscoveryAttempts) {
    const payload = JSON.stringify({ toolCall: { name: 'grep_search', args } });
    let exited2 = false;
    try {
      execFileSync('node', [hookScript], {
        input: payload,
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: root,
      });
    } catch (err) {
      if (err.status === 2) exited2 = true;
    }
    if (!exited2) {
      throw new Error(`graphify-enforcer DID NOT deny code discovery: "${args.Query}" in "${args.SearchPath}"`);
    }
  }

  // Verify break-glass ALLOWS with justification
  const breakGlassPayload = JSON.stringify({
    toolCall: {
      name: 'grep_search',
      args: {
        SearchPath: 'src/app',
        Query: 'function test',
        break_glass_justification: 'Graphify returned 0 results after 3 rephrased queries and neighbor traversal',
      },
    },
  });
  try {
    execFileSync('node', [hookScript], {
      input: breakGlassPayload,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: root,
    });
    // Should exit 0 — OK
  } catch (err) {
    if (err.status === 2) {
      throw new Error('graphify-enforcer BLOCKED break-glass request (should allow it)');
    }
  }

  const codexHook = join(root, 'scripts/hooks/guard-graphify.mjs');
  const codexAttempt = JSON.stringify({
    tool_name: 'Bash',
    tool_input: { command: 'rg "function handleSubmit" src' },
  });
  let codexDenied = false;
  try {
    execFileSync('node', [codexHook], {
      input: codexAttempt,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: root,
    });
  } catch (err) {
    codexDenied = err.status === 2;
  }
  if (!codexDenied) throw new Error('Codex Graphify guard did not deny broad source discovery');

  execFileSync('node', [codexHook], {
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: "Get-Content -Raw '.codex/config.toml'" },
    }),
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: root,
  });
}
