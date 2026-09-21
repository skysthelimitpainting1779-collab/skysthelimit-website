'use client';

import { useEffect, useRef, useState } from 'react';

import { shouldStartPaintSheen } from './paintSheenShader';

/**
 * Subtle WebGPU "fresh-paint sheen" layered inside the homepage hero,
 * between the photo and the dark gradient.
 *
 * Cost discipline (this must never hurt LCP/CLS):
 * - The vgpu runtime is reached through a deferred dynamic import(), so it
 *   never enters the initial bundle (plain import() in an effect — the repo
 *   forbids next/dynamic with ssr:false, and this complies).
 * - Boot waits for the document to finish loading AND an idle window, then
 *   only if the hero is actually visible (IntersectionObserver). It cannot
 *   contend with the LCP image.
 * - prefers-reduced-motion or no WebGPU: never boots. The hero keeps its
 *   existing photo + CSS grain — the static fallback is the current design.
 * - The canvas is absolute/inert (aria-hidden, pointer-events-none); reveal
 *   is opacity-only, so CLS is impossible.
 * - The render loop pauses when the tab is hidden (visibilitychange) and is
 *   torn down on unmount (React strict-mode safe).
 */
export default function PaintSheenCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      !shouldStartPaintSheen({
        hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
        prefersReducedMotion:
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      })
    ) {
      return;
    }

    let cancelled = false;
    let stopLoop: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    let idleId: number | undefined;
    let loadListenerAttached = false;

    // requestIdleCallback is not in every TS DOM lib: probe it structurally.
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const boot = async () => {
      if (cancelled || stopLoop) return;
      try {
        const mod = await import('./paintSheen');
        if (cancelled) return;
        stopLoop = mod.startPaintSheen(canvas, () => {
          if (!cancelled) setReady(true);
        });
      } catch {
        // vgpu chunk failed to load or WebGPU init failed: stay hidden,
        // the photo + CSS grain remain. Never break the page.
      }
    };

    const kick = () => {
      if (cancelled || stopLoop) return;
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(boot, { timeout: 4000 });
      } else {
        window.setTimeout(boot, 1200);
      }
    };

    const schedule = () => {
      if (document.readyState === 'complete') kick();
      else {
        loadListenerAttached = true;
        window.addEventListener('load', kick, { once: true });
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stopLoop?.();
        stopLoop = undefined;
        setReady(false);
      } else if (!cancelled) {
        schedule();
      }
    };

    // Start only when the hero is on screen; re-arm after tab-hide.
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            observer?.disconnect();
            observer = undefined;
            schedule();
          }
        },
        { rootMargin: '200px' },
      );
      observer.observe(canvas);
    } else {
      schedule();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (loadListenerAttached) window.removeEventListener('load', kick);
      if (idleId !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      stopLoop?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="paint-sheen-canvas"
      className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
