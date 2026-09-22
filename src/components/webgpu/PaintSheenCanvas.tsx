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
 *   A change to reduced motion mid-session tears the loop down immediately.
 * - The canvas is absolute/inert (aria-hidden, pointer-events-none); reveal
 *   is opacity-only, so CLS is impossible.
 * - The render loop pauses when the tab is hidden (visibilitychange) or the
 *   hero scrolls off-screen (the IntersectionObserver stays attached and
 *   restarts the loop on re-entry), and is torn down on unmount
 *   (React strict-mode safe). Only one boot is ever in flight.
 */
export default function PaintSheenCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionQuery =
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : undefined;
    if (
      !shouldStartPaintSheen({
        hasWebGPU: typeof navigator !== 'undefined' && 'gpu' in navigator,
        prefersReducedMotion: !!motionQuery?.matches,
      })
    ) {
      return;
    }

    let cancelled = false;
    let stopLoop: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let loadListenerAttached = false;
    let bootPromise: Promise<void> | null = null;
    let inViewport = false;

    // requestIdleCallback is not in every TS DOM lib: probe it structurally.
    const idleWindow = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    /** Drop any not-yet-fired deferred start (idle callback / timeout / load). */
    const cancelPending = () => {
      if (idleId !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
        idleId = undefined;
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (loadListenerAttached) {
        window.removeEventListener('load', kick);
        loadListenerAttached = false;
      }
    };

    /** Hard stop: cancel pending starts, kill the loop, hide the canvas. */
    const stopAll = () => {
      cancelPending();
      stopLoop?.();
      stopLoop = undefined;
      setReady(false);
    };

    /**
     * Single in-flight boot. Guards are checked BEFORE the dynamic import
     * and re-checked AFTER it resolves, so a hide/scroll-away/unmount during
     * the chunk load aborts instead of starting an orphaned loop. Two
     * callers racing through the pre-await guard share this one promise —
     * boot can never initialize twice.
     */
    const boot = (): Promise<void> => {
      if (bootPromise) return bootPromise;
      bootPromise = (async () => {
        try {
          if (cancelled || document.hidden || !inViewport || stopLoop) return;
          const mod = await import('./paintSheen');
          if (cancelled || document.hidden || !inViewport || stopLoop) return;
          stopLoop = mod.startPaintSheen(
            canvas,
            () => {
              if (!cancelled) setReady(true);
            },
            () => {
              // WebGPU init failed after boot: stay hidden, never throw.
              if (!cancelled) setReady(false);
            },
          );
        } catch {
          // vgpu chunk failed to load: stay hidden, the photo + CSS grain
          // remain. Never break the page.
        } finally {
          bootPromise = null;
        }
      })();
      return bootPromise;
    };

    const kick = () => {
      if (cancelled || document.hidden || !inViewport || stopLoop || bootPromise)
        return;
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(
          () => {
            idleId = undefined;
            void boot();
          },
          { timeout: 4000 },
        );
      } else {
        timeoutId = window.setTimeout(() => {
          timeoutId = undefined;
          void boot();
        }, 1200);
      }
    };

    const schedule = () => {
      cancelPending();
      if (cancelled || document.hidden || !inViewport) return;
      if (document.readyState === 'complete') kick();
      else {
        loadListenerAttached = true;
        window.addEventListener('load', kick, { once: true });
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        // stopAll also cancels a boot still queued behind idle/load; an
        // in-flight import re-checks document.hidden after resolving.
        stopAll();
      } else if (!cancelled) {
        schedule();
      }
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      if (cancelled) return;
      if (event.matches) {
        // User enabled reduced motion: stop animating immediately.
        stopAll();
      } else {
        // Preference lifted: resume normal lifecycle if visible.
        schedule();
      }
    };

    // Keep observing for the whole mount: pause the loop when the hero
    // scrolls off-screen, restart it on re-entry. Never a one-shot gate.
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (cancelled) return;
          const visible = entries[0]?.isIntersecting ?? false;
          if (visible === inViewport) return;
          inViewport = visible;
          if (visible) schedule();
          else stopAll();
        },
        { rootMargin: '200px' },
      );
      observer.observe(canvas);
    } else {
      inViewport = true;
      schedule();
    }

    document.addEventListener('visibilitychange', onVisibility);
    motionQuery?.addEventListener('change', onMotionChange);

    return () => {
      cancelled = true;
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery?.removeEventListener('change', onMotionChange);
      stopAll();
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
