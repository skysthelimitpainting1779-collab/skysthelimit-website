import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const agentsDir = join(root, '.agents', 'manifests', 'agents');
const verifiersDir = join(root, '.agents', 'manifests', 'verifiers');
const specialistsDir = join(root, '.agents', 'manifests', 'specialists');

test('Antigravity Agent Discovery: A0-A10, V0-V10, S1-S8', () => {
  const expectedAgents = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
  const expectedVerifiers = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];
  const expectedSpecialists = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

  for (const id of expectedAgents) {
    const file = readdirSync(agentsDir).find(f => f.startsWith(id));
    assert.ok(file, `Agent ${id} should exist`);
  }

  for (const id of expectedVerifiers) {
    const file = readdirSync(verifiersDir).find(f => f.startsWith(id));
    assert.ok(file, `Verifier ${id} should exist`);
  }

  for (const id of expectedSpecialists) {
    const file = readdirSync(specialistsDir).find(f => f.startsWith(id));
    assert.ok(file, `Specialist ${id} should exist`);
  }
});

test('Universal Kernel Inheritance & Capabilities', () => {
  const a0 = JSON.parse(readFileSync(join(agentsDir, 'A0-commander.json'), 'utf-8'));
  assert.equal(a0.identity.role, 'Engineering Orchestrator');
  assert.ok(a0.plugins.universal.includes('stl-kernel'));
  assert.ok(a0.plugins.universal.includes('graphify-core'));
  assert.ok(a0.plugins.universal.includes('context7-core'));
});

test('Permissions & ACL Safety Boundaries', () => {
  const a1 = JSON.parse(readFileSync(join(agentsDir, 'A1-explorer.json'), 'utf-8'));
  assert.ok(a1.tools.denied.includes('write_to_file'), 'A1 must be read-only');

  const a4 = JSON.parse(readFileSync(join(agentsDir, 'A4-frontend-engineer.json'), 'utf-8'));
  assert.ok(a4.default_write_scope.deny.includes('convex/schema.ts'), 'A4 cannot edit backend schema');
  assert.ok(!a4.communication.may_message.includes('A5'), 'A4 to A5 direct worker messaging prohibited');
});

test('Clean Context Verifier Contract', () => {
  const v4 = JSON.parse(readFileSync(join(verifiersDir, 'V4-frontend-verifier.json'), 'utf-8'));
  assert.equal(v4.write_access, false, 'Verifiers have zero write access');
  assert.deepEqual(v4.allowed_verdicts, ['PASS', 'FAIL', 'UNCERTAIN']);
});
