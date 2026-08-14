#!/usr/bin/env node
/**
 * guard-production.mjs
 * Blocks writes to production secrets, live environment configs, and production promotions.
 */
const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) process.exit(0);
    const input = JSON.parse(raw);
    const targetFile = input?.tool_input?.TargetFile || input?.toolCall?.args?.TargetFile || '';
    const cmd = input?.tool_input?.CommandLine || input?.toolCall?.args?.CommandLine || '';

    // Guard production files
    const forbiddenFiles = [
      /\.env\.production(\.local)?$/i,
      /\.env\.prod$/i,
      /prod\.secret/i,
      /vercel\.prod\.json/i,
    ];

    if (forbiddenFiles.some(p => p.test(targetFile))) {
      process.stderr.write(`DENY [guard-production]: Modifications to production environment secrets are hard-blocked.\n`);
      process.exit(2);
    }

    // Guard production commands
    if (/vercel\s+.*--prod|convex\s+deploy\s+--prod|git\s+push\s+.*main\b/i.test(cmd)) {
      process.stderr.write(`DENY [guard-production]: Autonomous production deployment commands are hard-blocked.\n`);
      process.exit(2);
    }
  } catch (_) {}
  process.exit(0);
});
