#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

import { buildAuthoritativeLedgerWave } from '../../../../scripts/lib/agentgraph-codex-task-runner.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const inputPath = argument('--input');
const outputPath = argument('--output');

if (!inputPath || !outputPath) {
  console.error('usage: build-wave-specs.mjs --input <ledger-ready.json> --output <wave.json>');
  process.exitCode = 2;
} else {
  try {
    const input = JSON.parse(await readFile(inputPath, 'utf8'));
    const wave = buildAuthoritativeLedgerWave(input);
    await writeFile(outputPath, `${JSON.stringify(wave, null, 2)}\n`, 'utf8');
    console.log(
      JSON.stringify({
        output: outputPath,
        assignments: wave.assignments.length,
        deferred: wave.deferred.length,
        blocked: wave.blocked.length,
        ledgerRevision: wave.source.revision,
      }),
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
