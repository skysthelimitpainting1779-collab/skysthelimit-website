#!/usr/bin/env node
/**
 * Antigravity + Codex Engineering Team Certification Suite
 * Sky's the Limit Platform
 *
 * Usage: node .agents/certification/run-certification.mjs
 * Or via: npm run agents:certify
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const checksDir = join(__dirname, 'checks');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

console.log(`\n${BOLD}================================================================${RESET}`);
console.log(`${BOLD}  SKY'S THE LIMIT — ANTIGRAVITY + CODEX TEAM CERTIFICATION${RESET}`);
console.log(`${BOLD}================================================================${RESET}\n`);

const files = readdirSync(checksDir)
  .filter(f => f.endsWith('.mjs'))
  .sort();

let passed = 0;
let failed = 0;
const failures = [];

for (const file of files) {
  const label = file.replace('.mjs', '').padEnd(40);
  try {
    const fileUrl = pathToFileURL(join(checksDir, file)).href;
    const { default: runCheck } = await import(fileUrl);
    process.stdout.write(`  ${label} `);
    await runCheck();
    console.log(`[${GREEN}PASS${RESET}]`);
    passed++;
  } catch (err) {
    console.log(`[${RED}FAIL${RESET}]`);
    console.error(`  ${YELLOW}↳ ${err.message}${RESET}\n`);
    failed++;
    failures.push({ file, message: err.message });
  }
}

console.log(`\n${BOLD}----------------------------------------------------------------${RESET}`);
console.log(`${BOLD}Results: ${GREEN}${passed} Passed${RESET}${BOLD}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET}`);
console.log(`${BOLD}----------------------------------------------------------------${RESET}\n`);

if (failures.length > 0) {
  console.log(`${BOLD}Failures:${RESET}`);
  for (const { file, message } of failures) {
    console.log(`  ${RED}✗${RESET} ${file}: ${message}`);
  }
  console.log('');
  process.exit(1);
}

console.log(`${GREEN}All checks passed. Team ready for smoke test.${RESET}\n`);
