#!/usr/bin/env node
/**
 * telemetry-post-tool.mjs
 * Captures touched paths and failure signatures for circuit breaker state tracking.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspaceRoot } from '../resolve-root.mjs';
import { isAntigravityInput, readHookInput, sourceAgent, targetText, toolName } from './hook-input.mjs';

const input = await readHookInput();

try {
    const root = getWorkspaceRoot();
    const telemetryDir = join(root, '.learnings');
    if (!existsSync(telemetryDir)) mkdirSync(telemetryDir, { recursive: true });

    // Record tool telemetry log
    const logFile = join(telemetryDir, 'TOOL_TELEMETRY.jsonl');
    const entry = {
      timestamp: new Date().toISOString(),
      tool: toolName(input) || 'unknown',
      agent: sourceAgent(input) || 'unknown',
      status: input?.tool_response?.isError || input?.status === 'failed' ? 'failed' : 'completed',
      touched: targetText(input).slice(0, 500),
    };
    writeFileSync(logFile, JSON.stringify(entry) + '\n', { flag: 'a' });
} catch {}

if (isAntigravityInput(input)) process.stdout.write('{}');
