'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { getFocusableElements, getTrapTarget, isFocusOutside } from '@/lib/focus-trap';

const ORB_URL =
  'https://agent.retellai.com/orb/agent_a0567494bf22df44e28d9af556?token=fcaaf2d093bf5d7dd095a00c647a51';

const INTERNAL_ROUTE_PREFIXES = ['/admin', '/manage', '/portal'];

/**
 * Floating "Talk to Sky" voice widget. Opens a modal with the Retell
 * voice orb (hosted on Retell's domain; no API key in this client).
 *
 * The orb iframe is cross-origin: keyboard events fired inside it (including
 * Escape) never reach this document, and Retell documents no postMessage
 * close event for the hosted orb page. Escape therefore closes the modal
 * while focus is in this document; once focus moves inside the iframe, the
 * focus trap below keeps the Tab cycle inside the dialog and the focusin
 * guard pulls focus back to the Close button if tabbing out of the iframe
 * lands on the page behind the overlay — keyboard users always keep a
 * reachable close control.
 *
 * The iframe only renders while the modal is open, and nothing in this
 * component depends on the orb loading: if the agent is unpublished or out
 * of credits the iframe shows Retell's own fallback page and the site is
 * otherwise unaffected.
 */
export default function VoiceAgentWidget() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const isInternalRoute = INTERNAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const target = getTrapTarget(dialog, document.activeElement, event.shiftKey);
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };

    // If sequential focus leaves the dialog (e.g. tabbing past the last
    // control inside the cross-origin iframe lands on the page behind the
    // overlay), pull it back to the first dialog control.
    const handleFocusIn = (event: FocusEvent) => {
      const current = dialogRef.current;
      if (!current) return;
      if (isFocusOutside(current, event.target as Element | null)) {
        getFocusableElements(current)[0]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.body.style.overflow = '';
      // Return focus to the launcher that opened the dialog.
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // Release body scroll lock + close the dialog on route change.
  useEffect(() => {
    setOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  if (isInternalRoute) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk to Sky, our voice assistant"
        data-track="voice_widget_open"
        data-track-payload='{"source":"floating_widget"}'
        className={cn(
          'fixed bottom-[4.75rem] right-4 z-50 md:bottom-8 md:right-8',
          'public-surface voice-widget-trigger border-2 border-brand px-5 py-3.5',
          'font-display text-lg font-bold uppercase leading-none tracking-[0.08em] text-ink',
          'shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors',
          'print:hidden',
        )}
      >
        Talk to Sky
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Talk to Sky voice assistant"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 print:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="public-surface voice-widget-panel flex h-[min(80dvh,38rem)] w-[min(92vw,26rem)] flex-col border border-border"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-display text-lg font-bold uppercase leading-none tracking-[0.08em] text-ink-1">
                Sky — Voice Assistant
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close voice assistant"
                data-track="voice_widget_close"
                data-track-payload='{"source":"floating_widget"}'
                className="border border-border px-3 py-1.5 font-display text-sm font-bold uppercase tracking-[0.08em] text-ink-1 transition-colors hover:bg-surface-slate"
              >
                Close
              </button>
            </div>
            <p className="border-b border-border px-4 py-2 text-xs text-ink-3">
              Ask about our services or request a free estimate.
            </p>
            <iframe
              src={ORB_URL}
              title="Sky voice assistant"
              allow="microphone; autoplay"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      )}
    </>
  );
}
