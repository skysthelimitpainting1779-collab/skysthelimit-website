'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics';

type TrackPayload = Record<string, string | number | boolean | undefined>;

function readTrackPayload(value: string | undefined): TrackPayload {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string | number | boolean] => {
        const payloadValue = entry[1];
        return ['string', 'number', 'boolean'].includes(typeof payloadValue);
      }),
    );
  } catch {
    return {};
  }
}

export default function AnalyticsDelegator() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const trackedElement = event.target.closest<HTMLElement>('[data-track]');
      const eventName = trackedElement?.dataset.track?.trim();
      if (!trackedElement || !eventName) return;

      trackEvent(eventName, readTrackPayload(trackedElement.dataset.trackPayload));
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
