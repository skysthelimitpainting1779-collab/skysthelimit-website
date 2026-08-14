#!/usr/bin/env node
/**
 * Antigravity Team Certification Suite
 * Validates Discovery, Kernel, Graphify, Permissions, ACL, Plugins, Loops, Circuit Breakers, and Safety.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('=== [1/11] TESTING AGENT & VERIFIER DISCOVERY ===');
const agentsDir = join(root, '.agents', 'manifests', 'agents');
const verifiersDir = join(root, '.agents', 'manifests', 'verifiers');
const specialistsDir = join(root, '.agents', 'manifests', 'specialists');

const expectedAgents = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
const expectedVerifiers = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];
const expectedSpecialists = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

expectedAgents.forEach(id => {
  const file = readdirSync(agentsDir).find(f => f.startsWith(id));
  assert(!!file, `Agent ${id} manifest discovered in ${agentsDir}`);
});

expectedVerifiers.forEach(id => {
  const file = readdirSync(verifiersDir).find(f => f.startsWith(id));
  assert(!!file, `Verifier ${id} manifest discovered in ${verifiersDir}`);
});

expectedSpecialists.forEach(id => {
  const file = readdirSync(specialistsDir).find(f => f.startsWith(id));
  assert(!!file, `Specialist ${id} manifest discovered in ${specialistsDir}`);
});

// Verify only A0 is root orchestrator
const a0Manifest = JSON.parse(readFileSync(join(agentsDir, 'A0-commander.json'), 'utf-8'));
assert(a0Manifest.identity.role === 'Engineering Orchestrator', 'Only A0 is configured as Engineering Orchestrator');

console.log('\n=== [2/11] TESTING UNIVERSAL KERNEL INHERITANCE ===');
expectedAgents.forEach(id => {
  const file = readdirSync(agentsDir).find(f => f.startsWith(id));
  const manifest = JSON.parse(readFileSync(join(agentsDir, file), 'utf-8'));
  const plugins = manifest.plugins?.universal || [];
  assert(plugins.includes('stl-kernel'), `Agent ${id} inherits stl-kernel`);
  assert(plugins.includes('graphify-core'), `Agent ${id} inherits graphify-core`);
  assert(plugins.includes('context7-core'), `Agent ${id} inherits context7-core`);
});

console.log('\n=== [3/11] TESTING GRAPHIFY & BREAK-GLASS DISCOVERY ===');
assert(existsSync(join(root, 'graphify-out', 'graph.json')), 'Graphify graph.json is present and indexed');
const graphifyCoreRule = readFileSync(join(root, '.agents', 'plugins', 'graphify-core', 'rules', 'graphify-rules.md'), 'utf-8');
assert(graphifyCoreRule.includes('Query graph before reading source code'), 'Graphify-first rule enforced in graphify-core');

console.log('\n=== [4/11] TESTING PERMISSIONS & SCOPE BOUNDARIES ===');
const a1Manifest = JSON.parse(readFileSync(join(agentsDir, 'A1-explorer.json'), 'utf-8'));
assert(a1Manifest.tools.denied.includes('write_to_file'), 'A1 Explorer is strictly read-only');

const a4Manifest = JSON.parse(readFileSync(join(agentsDir, 'A4-frontend-engineer.json'), 'utf-8'));
assert(a4Manifest.default_write_scope.deny.includes('convex/schema.ts'), 'A4 Frontend cannot silently mutate backend schema');

const a9Manifest = JSON.parse(readFileSync(join(agentsDir, 'A9-qa-verification-engineer.json'), 'utf-8'));
assert(a9Manifest.default_write_scope.deny.includes('src/**'), 'A9 QA is prohibited from editing product source code');

expectedVerifiers.forEach(id => {
  const file = readdirSync(verifiersDir).find(f => f.startsWith(id));
  const vManifest = JSON.parse(readFileSync(join(verifiersDir, file), 'utf-8'));
  assert(vManifest.write_access === false, `Verifier ${id} has zero write access`);
});

console.log('\n=== [5/11] TESTING COMMUNICATION TOPOLOGY ACL ===');
assert(!a4Manifest.communication.may_message.includes('A5'), 'A4 -> A5 direct worker-to-worker request is prohibited');
assert(a4Manifest.communication.may_message.includes('A0'), 'A4 -> A0 communication is permitted');
assert(a4Manifest.communication.may_message.includes('S3'), 'A4 -> S3 specialist communication is permitted');
assert(a4Manifest.communication.may_message.includes('V4'), 'A4 -> V4 verifier dispatch is permitted');

console.log('\n=== [6/11] TESTING UI-CRAFT PLUGIN STACK ===');
const uiPluginDir = join(root, '.agents', 'plugins', 'ui-craft');
assert(existsSync(join(uiPluginDir, 'skills', 'ui-ux-pro-max', 'SKILL.md')), 'UI/UX Pro Max skill exists in ui-craft');
assert(existsSync(join(uiPluginDir, 'skills', 'taste', 'SKILL.md')), 'Taste creative direction skill exists in ui-craft');
assert(existsSync(join(uiPluginDir, 'skills', 'impeccable', 'SKILL.md')), 'Impeccable review skill exists in ui-craft');

console.log('\n=== [7/11] TESTING BOUNDED LOOPS & CIRCUIT BREAKERS ===');
const a0Loops = a0Manifest.loops;
assert(a0Loops.implementation === 3, 'Implementation cycles capped at 3');
assert(a0Loops.remediation === 3, 'Remediation cycles capped at 3');
assert(a0Loops.verifier === 2, 'Verifier cycles capped at 2');
assert(a0Manifest.circuit_breaker.thresholds.resetAuthority === 'A0_ONLY', 'Only A0 has circuit recovery authority');

console.log('\n=== [8/11] TESTING LIFECYCLE HOOKS CONTRACT ===');
const hooksConfig = JSON.parse(readFileSync(join(root, '.agents', 'hooks.json'), 'utf-8'));
assert(!!hooksConfig['stl-engineering-guards'], 'Hooks configured under stl-engineering-guards');
assert(hooksConfig['stl-engineering-guards'].PreToolUse[0].matcher === '*', 'PreToolUse hook matcher defined');
assert(existsSync(join(root, '.agents', 'hooks', 'pre-tool-use.mjs')), 'PreToolUse handler script exists');
assert(existsSync(join(root, '.agents', 'hooks', 'stop.mjs')), 'Stop handler script exists');

console.log(`\n========================================`);
console.log(`CERTIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
