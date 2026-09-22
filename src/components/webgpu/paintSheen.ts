/**
 * vgpu wiring for the hero paint sheen.
 *
 * Reached ONLY through a deferred dynamic import() from PaintSheenCanvas,
 * so the vgpu runtime never enters the initial bundle. Kept as a plain
 * function (not a hook) per the vgpu Next.js guide: it is easier to read
 * and the part worth testing.
 *
 * vgpu is a devDependency, not a runtime dependency: the browser receives
 * only the bundled, tree-shaken framework modules it needs (init, surface,
 * effect, clock, frameLoop — verified to pull in neither the MCP server
 * nor the node adapter), so nothing about this feature needs vgpu
 * resolvable in a production-only install. Both CI and the Vercel build
 * install devDependencies, which is when the bundling happens.
 *
 * Performance posture (per vgpu's shipping-to-production guide):
 * - DPR pinned to 1: the sheen is low-frequency noise, visually identical
 *   upscaled, far cheaper per frame.
 * - frameLoop capped at 24 fps: the drift cycle is ~2 minutes; 24 fps is
 *   plenty and halves GPU wakeups versus 60 fps.
 * - Single fullscreen fragment pass, one uniform written per tick (time).
 */

import { clock, effect, frameLoop, init, surface } from "vgpu";
import type { FrameLoopHandle } from "vgpu";

import { PAINT_SHEEN_WGSL } from "./paintSheenShader";

/**
 * Starts the sheen render loop on `canvas`.
 * `onFirstFrame` fires once the first frame is encoded, so the caller can
 * fade the canvas in with opacity only (no layout impact).
 * Returns a teardown function: stops the loop and disposes the device.
 * If WebGPU init fails (e.g. a browser that exposes navigator.gpu but
 * fails device creation), the error is caught HERE — the promise never
 * rejects unhandled. `onError` fires, the loop never starts, and the
 * caller keeps the canvas hidden: the hero photo + CSS grain remain.
 */
export function startPaintSheen(
  canvas: HTMLCanvasElement,
  onFirstFrame: () => void,
  onError?: (error: unknown) => void,
): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let firstFrameFired = false;

  void (async () => {
    try {
      gpu = await init();
      if (disposed) {
        gpu.dispose();
        return;
      }

      const canvasSurface = surface(gpu, canvas, { dpr: 1 });
      const sheen = effect(gpu, PAINT_SHEEN_WGSL, {
        label: "paint-sheen",
        set: { params: { time: 0 } },
      });

      const time = clock(gpu);
      loop = frameLoop(
        gpu,
        (frame) => {
          sheen.set({ params: { time: time.time } });
          frame.pass(canvasSurface, sheen);
          if (!firstFrameFired) {
            firstFrameFired = true;
            onFirstFrame();
          }
        },
        { fps: 24 },
      );
    } catch (error) {
      // Graceful inert fallback: never an unhandled rejection. Dispose any
      // partially-initialized device, notify the caller, stay hidden.
      disposed = true;
      try {
        gpu?.dispose();
      } catch {
        // Best effort: teardown must not throw either.
      }
      onError?.(error);
    }
  })();

  return () => {
    disposed = true;
    loop?.stop();
    gpu?.dispose();
  };
}
