# vgpu hero enhancement — PROGRESS

Branch: feat/vgpu-hero-2026-09-21 (from origin/main @ 6748dd0)
Worktree: ~/workspace/skys-site-worktrees/vgpu-hero

## Plan
Tasteful WebGPU "fresh-paint sheen" layer in the homepage hero: subtle warm light
drift (brand palette only: ink/bone/safety-orange) composited under the existing
dark gradient, above the hero photo. Deferred init (after LCP + idle), dynamic
import() of vgpu (never in initial bundle), prefers-reduced-motion + no-WebGPU
guards (existing CSS grain/photo remain), pause when off-screen/hidden, opacity-
only reveal. No next.config changes (inline WGSL string per vgpu docs).

## Log
- 2026-09-21 ~08:55 CDT: worktree created from origin/main. Recon done: vgpu NOT
  in package.json (confirmed), Next 16.3.3 / React 19.2.8, hero = priority photo +
  gradient + CSS grain in src/app/HomeClient.tsx. vgpu@0.5.0 docs consulted:
  getting-started, nextjs, shipping-to-production. Jev gate CLI verified working.
- vgpu@0.5.0 unpacked = 6.6MB total; browser entry ./dist/index.js re-exports
  @vgpu/* chunks (dynamic import keeps it out of initial bundle; chunk size TBD
  from build output).
- 2026-09-21 ~09:05 CDT: component + wiring committed (dada15c) after fixing a
  TS narrowing bug (requestIdleCallback) that the pre-commit hook caught.
  vgpu doctor: HEALTHY after `npx vgpu install-software-renderer` (Lavapipe
  CPU WebGPU; was unhealthy — no Vulkan ICD — before).
- vgpu check --require-validation: PASS (device-backed, zero diagnostics;
  reflection confirms fs_main + params{time:f32} matching the JS set()).
- Headless pixel proof on Lavapipe (160x90): max alpha 0.137 (cap 0.16),
  7780/14400 px lit, 0 warm-palette violations, deterministic at fixed time,
  drift confirmed (t=10 vs t=130). Script: /tmp/render-sheen.mjs.
- tsc --noEmit: clean. New unit tests: 4/4 pass.
- Pending: npm run lint (running), npm test (full suite), npm run build,
  chunk-size check, push + PR (no merge).
- 2026-09-21 ~09:15 CDT: FULL VERIFICATION GREEN — npm run lint pass,
  npm test 358/358 pass, npm run build success. vgpu runtime confirmed
  code-split into a 143KB lazy chunk (2ghkmws0yj8pq.js); initial bundle
  carries only the component + 1.4KB WGSL string.
- Pushed feat/vgpu-hero-2026-09-21, opened PR #329 (no merge):
  https://github.com/skysthelimitpainting1779-collab/skysthelimit-website/pull/329
- Docs consulted (vgpu 0.5.0 bundled, via local CLI): getting-started.md,
  nextjs.md, shipping-to-production.md, concepts-frames.md (+ dpr grep hits:
  adaptive-quality, browser-testing).
- Jev gate: 5 consequential actions gated (npm install, file writes, hero
  wiring edit, software-renderer install, push+PR) — all verdicts: proceed.
- Honest limits for the report: pixel proof on Lavapipe CPU renderer, not
  discrete GPU; no field frame-time measurement on real mobile hardware.
