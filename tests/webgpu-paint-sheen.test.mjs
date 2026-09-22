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
 * Compile WGSL through the real compiler: writes the source to a temp
 * .wgsl file and runs plain `vgpu check` (parse + naga/device validation +
 * reflection). Never throws on a non-zero exit: the CLI prints its JSON
 * report on validation failures too, so the caller inspects the report.
 * Only a missing/unparseable report (broken CLI contract) throws — loud,
 * never a silent pass.
 */
async function runCheck(source, label) {
  const dir = mkdtempSync(join(tmpdir(), 'paint-sheen-wgsl-'));
  const file = join(dir, `${label}.wgsl`);
  writeFileSync(file, source, 'utf8');
  let stdout;
  let exitCode = 0;
  try {
    ({ stdout } = await execFileAsync(VGPU_BIN, ['check', file], {
      timeout: 120_000,
    }));
  } catch (error) {
    exitCode = typeof error?.code === 'number' ? error.code : 1;
    stdout = typeof error?.stdout === 'string' ? error.stdout : '';
  }
  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    throw new Error(
      `vgpu check produced no parseable JSON report (exit ${exitCode}); stdout was: ${stdout.slice(0, 500)}`,
    );
  }
  return { exitCode, report };
}

/** The report shows the shader failed to compile, on any machine. */
function reportFailed(report) {
  return (
    (report.diagnostics ?? []).some((d) => d.severity === 'error') ||
    report.validation?.ok === false
  );
}

/**
 * Device-backed validation tier (`--require-validation`). Needs a WebGPU
 * adapter; runners without one (e.g. GitHub's ubuntu runners: no Vulkan
 * drivers) report VGPU-WGSL-VALIDATE-NO-DEVICE. Returns the report, or
 * null when the environment cannot provide an adapter — an environment
 * limit, not a shader problem. The compile check above is the enforced
 * gate; this tier only strengthens it where it can run.
 */
async function checkWgslStrict(source, label) {
  const dir = mkdtempSync(join(tmpdir(), 'paint-sheen-wgsl-'));
  const file = join(dir, `${label}.wgsl`);
  writeFileSync(file, source, 'utf8');
  try {
    const { stdout } = await execFileAsync(
      VGPU_BIN,
      ['check', file, '--require-validation'],
      { timeout: 120_000 },
    );
    return JSON.parse(stdout);
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const marker = '"code": "VGPU-WGSL-VALIDATE-NO-DEVICE"';
    if (stdout.includes(marker) || stdout.includes('VGPU-NODE-NO-ADAPTER')) {
      return null;
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

test('WGSL compiles: parse, naga validation, and reflection (vgpu check)', async () => {
  const { exitCode, report } = await runCheck(PAINT_SHEEN_WGSL, 'paint-sheen');
  assert.equal(
    exitCode,
    0,
    `vgpu check must exit 0 for the shipped shader, got diagnostics: ${JSON.stringify(report.diagnostics)}`,
  );
  assert.deepEqual(
    report.diagnostics,
    [],
    `WGSL must compile with zero diagnostics, got: ${JSON.stringify(report.diagnostics)}`,
  );
  // Real compiler output, not substring matching: the reflected module must
  // expose the documented fragment entry point and the params uniform.
  const entryPoints = report.reflection?.entryPoints ?? [];
  const fsMain = entryPoints.find((e) => e.name === 'fs_main');
  assert.ok(fsMain, `expected a reflected fs_main entry point`);
  assert.equal(fsMain.stage, 'fragment', 'fs_main must be a fragment entry point');
  const bindings = report.reflection?.bindings ?? [];
  assert.ok(
    bindings.some((b) => b.group === 0 && b.binding === 0 && b.name === 'params'),
    'expected the params uniform at group 0, binding 0 in the reflected bindings',
  );

  // Device-backed tier: strengthens the gate where an adapter exists.
  const strict = await checkWgslStrict(PAINT_SHEEN_WGSL, 'paint-sheen-strict');
  if (strict === null) {
    console.log(
      'note: no WebGPU adapter in this environment; device-backed validation skipped (compile check above still enforced)',
    );
    return;
  }
  assert.equal(
    strict.validation?.ok,
    true,
    `device validation must pass where an adapter exists, got: ${JSON.stringify(strict.validation?.error)}`,
  );
});

test('the compiler actually rejects invalid WGSL (the check is not vacuous)', async () => {
  const broken = 'fn broken( -> f32 { return 1.0; }\n';
  // Assert on the report, not the exit code: on machines with a WebGPU
  // adapter the device compiler rejects this (non-zero exit); on
  // adapter-less machines validation is skipped (exit 0) but the report
  // still records validation.ok === false. Either way the failure must be
  // visible — a validator that passes broken WGSL is worthless.
  const { report } = await runCheck(broken, 'paint-sheen-broken');
  assert.ok(
    reportFailed(report),
    `broken WGSL must fail the compiler, got validation=${JSON.stringify(report.validation)} diagnostics=${JSON.stringify(report.diagnostics)}`,
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
