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
