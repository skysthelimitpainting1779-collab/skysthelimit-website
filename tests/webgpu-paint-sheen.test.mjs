import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test } from 'node:test';
import {
  PAINT_SHEEN_WGSL,
  shouldStartPaintSheen,
} from '../src/components/webgpu/paintSheenShader.ts';

const execFileAsync = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const VGPU_BIN = join(root, 'node_modules', '.bin', 'vgpu');

/**
 * Run the WGSL through the real validator: writes the source to a temp
 * .wgsl file and runs `vgpu check --require-validation`. This parses AND
 * compiles the module (tint-backed), so a syntax error or a construct the
 * validator rejects fails the suite instead of silently passing.
 *
 * NOTE: device-backed validation needs a WebGPU adapter. Machines without
 * one (e.g. GitHub's ubuntu runners: no Vulkan drivers) make `vgpu check`
 * exit non-zero with VGPU-WGSL-VALIDATE-NO-DEVICE — but the JSON report is
 * still printed, with parse diagnostics intact. This helper returns the
 * report in that case so the test can assert the portable part (clean
 * parse/compile) and skip only the device step, never fake it.
 */
async function checkWgsl(source, label) {
  const dir = mkdtempSync(join(tmpdir(), 'paint-sheen-wgsl-'));
  const file = join(dir, `${label}.wgsl`);
  writeFileSync(file, source, 'utf8');
  try {
    const { stdout } = await execFileAsync(VGPU_BIN, ['check', file, '--require-validation'], {
      timeout: 120_000,
    });
    return JSON.parse(stdout);
  } catch (error) {
    // Only the no-device case is recoverable: the JSON report is printed
    // with parse diagnostics intact. A genuine parse failure rethrows so
    // the negative control below keeps failing loudly.
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    if (stdout.includes('"diagnostics"')) {
      const report = JSON.parse(stdout);
      if (report?.validation?.error?.code === 'VGPU-WGSL-VALIDATE-NO-DEVICE') {
        return report;
      }
    }
    throw error;
  }
}

test('startup guards: sheen runs only with WebGPU and without reduced motion', () => {
  assert.equal(
    shouldStartPaintSheen({ hasWebGPU: true, prefersReducedMotion: false }),
    true,
  );
  assert.equal(
    shouldStartPaintSheen({ hasWebGPU: false, prefersReducedMotion: false }),
    false,
  );
  assert.equal(
    shouldStartPaintSheen({ hasWebGPU: true, prefersReducedMotion: true }),
    false,
  );
  assert.equal(
    shouldStartPaintSheen({ hasWebGPU: false, prefersReducedMotion: true }),
    false,
  );
});

test('WGSL parses and compiles cleanly; device validation runs where a device exists', async () => {
  const report = await checkWgsl(PAINT_SHEEN_WGSL, 'paint-sheen');
  // Portable guarantee, asserted on every machine: zero parse/compile
  // diagnostics. A WGSL syntax error fails before we ever get here
  // (vgpu check exits non-zero at parse time with no usable report).
  assert.deepEqual(
    report.diagnostics,
    [],
    `WGSL must compile with zero diagnostics, got: ${JSON.stringify(report.diagnostics)}`,
  );
  if (report.validation?.error?.code === 'VGPU-WGSL-VALIDATE-NO-DEVICE') {
    // No WebGPU adapter on this machine (e.g. CI runners without Vulkan
    // drivers): device-backed validation is impossible here, so it is
    // skipped — not faked. It runs on dev machines and GPUs.
    console.log('note: no WebGPU device here; device-backed validation skipped');
    return;
  }
  assert.equal(
    report.validation?.attempted,
    true,
    'validation must actually run, not be skipped',
  );
  assert.equal(
    report.validation?.ok,
    true,
    `WGSL must validate cleanly, got: ${JSON.stringify(report.validation?.error)}`,
  );
});

test('the validator actually rejects invalid WGSL (the check is not vacuous)', async () => {
  const broken = 'fn broken( -> f32 { return 1.0; }\n';
  await assert.rejects(
    () => checkWgsl(broken, 'paint-sheen-broken'),
    /Command failed|exit|Unexpected token/i,
    'vgpu check must fail on invalid WGSL',
  );
});

test('shader stays in the brand palette and whispers (design invariants)', () => {
  // Bone highlight + #FF661C safety-orange ember: the only hues allowed.
  // (A compiler cannot check palette discipline, so this stays explicit.)
  assert.ok(PAINT_SHEEN_WGSL.includes('vec3f(0.965, 0.953, 0.922)'));
  assert.ok(PAINT_SHEEN_WGSL.includes('vec3f(1.0, 0.40, 0.11)'));
  // Peak alpha 0.16: subtle by construction.
  assert.ok(PAINT_SHEEN_WGSL.includes('* 0.16'));
  // Masked toward the right side, away from the text-heavy left.
  assert.ok(PAINT_SHEEN_WGSL.includes('smoothstep(0.12, 0.85, uv.x)'));
  // Periodic phase with a 120-second period: frame at t=120 s matches t=0.
  assert.ok(PAINT_SHEEN_WGSL.includes('6.2831853 / 120.0'));
});

test('shader module stays vgpu-free so tests and vgpu check can load it', async () => {
  const { readFileSync } = await import('node:fs');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const src = readFileSync(
    join(root, 'src/components/webgpu/paintSheenShader.ts'),
    'utf8',
  );
  assert.ok(
    !/^\s*import\s+[^;]*from\s*["']vgpu["']/m.test(src) &&
      !/require\(\s*["']vgpu["']\s*\)/.test(src),
    'paintSheenShader.ts must not import the vgpu runtime',
  );
});
