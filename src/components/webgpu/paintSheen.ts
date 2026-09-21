/**
 * vgpu wiring for the hero paint sheen.
 *
 * Reached ONLY through a deferred dynamic import() from PaintSheenCanvas,
 * so the vgpu runtime never enters the initial bundle. Kept as a plain
 * function (not a hook) per the vgpu Next.js guide: it is easier to read
 * and the part worth testing.
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
 * If WebGPU init fails, the promise rejects and the caller keeps the
 * canvas hidden — the hero photo + CSS grain remain the visual.
 */
export function startPaintSheen(
  canvas: HTMLCanvasElement,
  onFirstFrame: () => void,
): () => void {
  let disposed = false;
  let loop: FrameLoopHandle | undefined;
  let gpu: Awaited<ReturnType<typeof init>> | undefined;
  let firstFrameFired = false;

  void (async () => {
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
  })();

  return () => {
    disposed = true;
    loop?.stop();
    gpu?.dispose();
  };
}
