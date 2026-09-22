'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function PageViewTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // The gtag.js snippet in the root layout fires the initial page_view on
    // load; only client-side navigations need a manual hit.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window === 'undefined' || !window.gtag) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag('config', measurementId, { page_path: pagePath });
  }, [pathname, searchParams, measurementId]);

  return null;
}

export default function GoogleAnalytics({ measurementId }: { measurementId: string | undefined }) {
  if (!measurementId) return null;
  return (
    <Suspense fallback={null}>
      <PageViewTracker measurementId={measurementId} />
    </Suspense>
  );
}
