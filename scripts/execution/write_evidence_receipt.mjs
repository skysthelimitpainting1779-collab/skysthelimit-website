#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { validateEvidenceReceipt } from '../lib/development-lifecycle.mjs';

const root = resolve(import.meta.dirname, '../..');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted(value[key])])
    );
  }
  return value;
}

const inputPath = argument('--input');
if (!inputPath) {
  console.error('Usage: node scripts/execution/write_evidence_receipt.mjs --input <draft.json>');
  process.exit(2);
}

const config = JSON.parse(
  readFileSync(resolve(root, '.agents/governance/development-lifecycle.json'), 'utf8')
);
const draft = JSON.parse(readFileSync(resolve(inputPath), 'utf8'));
const graphLines = readFileSync(resolve(root, config.executionGraph.path), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const nodeIds = new Set(
  graphLines.filter((record) => record.recordType === 'node').map((record) => record.nodeId)
);
const receipt = {
  ...draft,
  schemaVersion: 1,
  programId: config.programId,
  graphSha256: config.executionGraph.sha256,
};
const bytes = `${JSON.stringify(sorted(receipt), null, 2)}\n`;
const digest = createHash('sha256').update(bytes).digest('hex');
const message = `chore(lifecycle): validate evidence receipt

Execution-Program: ${receipt.programId}
Execution-Node: ${receipt.nodeId || ''}
Checkpoint-ID: ${receipt.checkpointId || ''}
Evidence-SHA256: ${digest}
`;
const errors = validateEvidenceReceipt({
  message,
  config,
  nodeIds,
  receipt,
  receiptSha256: digest,
});
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

const outputDirectory = resolve(
  argument('--output-dir') || resolve(root, config.evidenceReceipts.directory)
);
mkdirSync(outputDirectory, { recursive: true });
const outputPath = resolve(outputDirectory, `${digest}.json`);
if (existsSync(outputPath)) {
  if (readFileSync(outputPath, 'utf8') !== bytes) {
    throw new Error(`existing receipt does not match its digest path: ${outputPath}`);
  }
} else {
  writeFileSync(outputPath, bytes, { encoding: 'utf8', flag: 'wx' });
}
console.log(outputPath);
console.log(`Execution-Program: ${receipt.programId}`);
console.log(`Execution-Node: ${receipt.nodeId}`);
console.log(`Checkpoint-ID: ${receipt.checkpointId}`);
console.log(`Evidence-SHA256: ${digest}`);
