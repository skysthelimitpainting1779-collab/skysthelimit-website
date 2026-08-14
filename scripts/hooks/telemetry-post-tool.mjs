#!/usr/bin/env node
/**
 * telemetry-post-tool.mjs
 * Captures touched paths and failure signatures for circuit breaker state tracking.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';

const chunks = [];
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  try {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw.trim()) process.exit(0);
    const input = JSON.parse(raw);

    const root = getWorkspaceRoot();
    const telemetryDir = join(root, '.learnings');
    if (!existsSync(telemetryDir)) mkdirSync(telemetryDir, { recursive: true });

    // Record tool telemetry log
    const logFile = join(telemetryDir, 'TOOL_TELEMETRY.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      tool: input?.toolCall?.name || input?.tool_name,
      agent: input?.agent_id || input?.agentId || 'unknown',
      status: input?.status || 'completed',
    };
    writeFileSync(logFile, JSON.stringify(entry) + '\n', { flag: 'a' });
  } catch (_) {}
  process.exit(0);
});
