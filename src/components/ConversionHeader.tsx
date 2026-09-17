'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone } from 'lucide-react';

import { PublicCtaLink } from '@/components/public/PublicSystem';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navigation = [
  { href: '/residential', label: 'Residential' },
  { href: '/commercial', label: 'Commercial' },
  { href: '/public-sector', label: 'Public Sector' },
  { href: '/projects', label: 'Projects' },
  { href: '/service-area', label: 'Service Area' },
  { href: '/about', label: 'About' },
];

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ConversionHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  // Keep the utility strip expanded while keyboard focus is inside it so a
  // focused call link is never yanked out from under the user on collapse.
  const [stripHasFocus, setStripHasFocus] = useState(false);
  const utilityExpanded = !isScrolled || stripHasFocus;
  // The header's rendered height varies: the utility strip collapses on scroll
  // and its labels can wrap on narrow screens. Track the live height so the
  // layout offset and viewport-filling heroes stay in sync.
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const applyHeaderHeight = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--site-header-height', `${height}px`);
    };
    applyHeaderHeight();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(applyHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral = params.get('ref');
    if (referral) localStorage.setItem('referrer_email', referral.trim());
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      data-surface="public"
      className="conversion-header public-surface fixed inset-x-0 top-0 z-50 border-b border-border bg-background text-foreground shadow-[0_14px_32px_rgb(7_19_33_/_0.08)] print:static print:shadow-none"
    >
      <div
        onFocus={() => setStripHasFocus(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setStripHasFocus(false);
          }
        }}
        className={cn(
          // Collapse via grid-template-rows: height cannot animate to/from auto,
          // so the strip content lives in a 1fr->0fr row instead.
          'grid overflow-hidden border-b px-4 transition-[grid-template-rows,opacity,border-color] duration-200 motion-reduce:transition-none sm:px-6 lg:px-8',
          utilityExpanded ? 'visible grid-rows-[1fr] border-border opacity-100' : 'invisible grid-rows-[0fr] border-transparent opacity-0',
          // Print always restores the strip (license + phone) regardless of scroll state.
          'print:visible print:grid-rows-[1fr] print:border-border print:opacity-100',
        )}
      >
        <div className="min-h-0 min-w-0 overflow-hidden">
          <div className="mx-auto flex min-h-11 max-w-[90rem] items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.09em]">
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">Twin Cities painting</span>
              <span>MN Contractor IR816596</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-muted-foreground sm:inline">Owner-led / Written scope / Prep first</span>
              <a
                href="tel:+16514104196"
                data-track="call_click"
                data-track-payload='{"source":"utility_header"}'
                className="flex min-h-11 items-center py-2 text-xs underline decoration-trust decoration-2 underline-offset-4"
              >
                Call / Text 651-410-4196
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'px-4 transition-[height] duration-200 motion-reduce:transition-none sm:px-6 lg:px-8',
          isScrolled ? 'h-16' : 'h-20',
        )}
      >
        <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-3 leading-none" aria-label="Sky's the Limit Painting LLC home">
            <Image src="/brand/SkyLLP_BrandLogo.svg" alt="" width={44} height={40} className="h-10 w-11 object-contain" preload />
            <span>
              <span className="block text-lg font-black uppercase tracking-[-0.025em] sm:text-2xl">Sky&apos;s the Limit</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.24em] text-muted-foreground sm:text-[10px]">Painting LLC</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-5 lg:flex xl:gap-8">
            {navigation.map((item) => {
              const current = isCurrentPath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  data-track="nav_click"
                  data-track-payload={JSON.stringify({ path: item.href, label: item.label })}
                  className={cn(
                    'relative py-3 text-sm font-bold transition-colors hover:text-trust',
                    current ? 'text-trust' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  {current ? <span aria-hidden="true" className="absolute inset-x-0 bottom-1 h-0.5 bg-trust" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <PublicCtaLink
              href="tel:+16514104196"
              variant="outline"
              icon={Phone}
              iconPosition="start"
              track="call_click"
              trackPayload={{ source: 'primary_header' }}
            >
              Call Anthony
            </PublicCtaLink>
            <PublicCtaLink
              href="/estimate"
              track="hero_cta_click"
              trackPayload={{ source: 'primary_header', label: 'Get a Free Price Range' }}
            >
              Get a Free Price Range
            </PublicCtaLink>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={(
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="size-11 lg:hidden"
                  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                />
              )}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent data-surface="public" className="public-surface" side="right">
              <SheetHeader>
                <SheetTitle className="public-display text-3xl">Project paths</SheetTitle>
                <SheetDescription>Choose the work type or start with a planning range.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="grid border-t border-border px-4">
                {navigation.map((item) => {
                  const current = isCurrentPath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={current ? 'page' : undefined}
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: item.href, label: item.label, source: 'mobile_header' })}
                      className={cn(
                        'flex min-h-14 items-center border-b border-border text-lg font-bold',
                        current ? 'text-trust' : 'text-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <SheetFooter>
                <PublicCtaLink
                  href="/estimate"
                  size="marketing-lg"
                  track="hero_cta_click"
                  trackPayload={{ source: 'mobile_header', label: 'Get a Free Price Range' }}
                  className="w-full"
                >
                  Get a Free Price Range
                </PublicCtaLink>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
