/**
 * Paint-sheen WGSL + pure startup guards.
 *
 * This module intentionally imports NOTHING from "vgpu": it must stay
 * importable in Node (unit tests, `vgpu check`) and keep the vgpu runtime
 * out of the initial bundle. The vgpu wiring lives in ./paintSheen.ts and
 * is reached only through a deferred dynamic import().
 *
 * The shader renders a very slow warm "fresh-paint sheen" — layered value
 * noise drifting at a ~2-minute cycle, tinted ONLY with the brand palette
 * (bone highlight, safety-orange ember). No plasma gradients, no purple.
 * Peak alpha is 0.16 and the effect is masked toward the right side of the
 * frame, where the hero photo shows through the dark gradient; the
 * text-heavy left side stays untouched.
 */

export const PAINT_SHEEN_WGSL = /* wgsl */ `
struct Params {
  time: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
  var v = 0.0;
  var a = 0.5;
  var q = p;
  for (var i = 0; i < 3; i++) {
    v += a * vnoise(q);
    q = q * 2.03 + vec2f(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // ~2-minute drift cycle: ambient, never distracting. The phase is
  // periodic (period 120 s), so the frame at t=120 s matches t=0 exactly.
  let t = sin(params.time * (6.2831853 / 120.0)) * 0.96;
  let warp = vec2f(
    fbm(uv * 2.0 + vec2f(t * 0.6, 0.0)),
    fbm(uv * 2.0 + vec2f(3.1, t * 0.4))
  );
  let n = fbm(uv * 3.0 + warp * 1.5 + vec2f(t, t * 0.7));
  // Keep the sheen off the text-heavy left side.
  let sideMask = smoothstep(0.12, 0.85, uv.x);
  let band = smoothstep(0.38, 0.78, n);
  let alpha = band * sideMask * 0.16;
  // Brand palette only: bone highlight + #FF661C safety-orange ember.
  let bone = vec3f(0.965, 0.953, 0.922);
  let ember = vec3f(1.0, 0.40, 0.11);
  let color = mix(bone, ember, smoothstep(0.55, 0.95, n) * 0.5);
  // Premultiplied output: vgpu configures the canvas surface with
  // alphaMode "premultiplied", so the compositor consumes color already
  // scaled by alpha. Writing full-strength RGB here would composite the
  // sheen at ~6x its intended 0-16% intensity and wash out the hero.
  return vec4f(color * alpha, alpha);
}
`;

export interface PaintSheenEnvironment {
  /** navigator.gpu is present (WebGPU exposed by the browser). */
  hasWebGPU: boolean;
  /** User asked for reduced motion. */
  prefersReducedMotion: boolean;
}

/**
 * The sheen is purely decorative, so it must never start for users who
 * asked for reduced motion, and it cannot start where WebGPU is absent.
 * In both cases the hero keeps its photo + CSS grain: the static fallback
 * is the existing design, not a blank canvas.
 */
export function shouldStartPaintSheen(env: PaintSheenEnvironment): boolean {
  return env.hasWebGPU && !env.prefersReducedMotion;
}
