import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PAINT_SHEEN_WGSL,
  shouldStartPaintSheen,
} from '../src/components/webgpu/paintSheenShader.ts';

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

test('WGSL is a single self-contained fragment effect (no imports, one binding)', () => {
  assert.ok(
    PAINT_SHEEN_WGSL.includes('@fragment'),
    'must define a fragment entry point',
  );
  assert.ok(
    PAINT_SHEEN_WGSL.includes('fn fs_main(@location(0) uv: vec2f)'),
    'must use the documented vgpu fullscreen effect signature',
  );
  assert.ok(
    PAINT_SHEEN_WGSL.includes('@group(0) @binding(0) var<uniform> params: Params'),
    'must declare the params uniform block the JS side sets',
  );
  assert.ok(
    !PAINT_SHEEN_WGSL.includes('import '),
    'inline WGSL must be self-contained: no module imports to resolve',
  );
  assert.ok(
    !PAINT_SHEEN_WGSL.includes('@group(1)'),
    'must not declare resources beyond group 0',
  );
  const open = (PAINT_SHEEN_WGSL.match(/{/g) || []).length;
  const close = (PAINT_SHEEN_WGSL.match(/}/g) || []).length;
  assert.equal(open, close, 'braces must balance');
});

test('WGSL stays in the brand palette and whispers (low alpha, side-masked)', () => {
  // Bone highlight + safety-orange ember, the only hues allowed.
  assert.ok(PAINT_SHEEN_WGSL.includes('vec3f(0.965, 0.953, 0.922)'));
  assert.ok(PAINT_SHEEN_WGSL.includes('vec3f(1.0, 0.42, 0.12)'));
  // Peak alpha 0.16: subtle by construction.
  assert.ok(PAINT_SHEEN_WGSL.includes('* 0.16'));
  // Masked toward the right side, away from the text-heavy left.
  assert.ok(PAINT_SHEEN_WGSL.includes('smoothstep(0.12, 0.85, uv.x)'));
  // Slow drift: full cycle on the order of minutes, not seconds.
  assert.ok(PAINT_SHEEN_WGSL.includes('params.time * 0.008'));
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
