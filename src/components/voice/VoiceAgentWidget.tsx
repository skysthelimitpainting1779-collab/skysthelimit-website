'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const ORB_URL =
  'https://agent.retellai.com/orb/agent_a0567494bf22df44e28d9af556?token=fcaaf2d093bf5d7dd095a00c647a51';

const INTERNAL_ROUTE_PREFIXES = ['/admin', '/manage', '/portal'];

/**
 * Floating "Talk to Sky" voice widget. Opens a modal with the Retell
 * voice orb (hosted on Retell's domain; no API key in this client).
 */
export default function VoiceAgentWidget() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  const isInternalRoute = INTERNAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
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
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Talk to Sky, our voice assistant"
        data-track="voice_widget_open"
        data-track-payload='{"source":"floating_widget"}'
        className={cn(
          'fixed bottom-[4.75rem] right-4 z-50 md:bottom-8 md:right-8',
          'public-surface border-2 border-brand bg-brand px-5 py-3.5',
          'font-display text-lg font-bold uppercase leading-none tracking-[0.08em] text-ink',
          'shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-colors hover:bg-ink-1',
          'print:hidden',
        )}
      >
        Talk to Sky
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Talk to Sky voice assistant"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 print:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="public-surface flex h-[min(80dvh,38rem)] w-[min(92vw,26rem)] flex-col border border-border bg-surface-raised"
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
