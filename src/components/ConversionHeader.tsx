'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral = params.get('ref');
    if (referral) localStorage.setItem('referrer_email', referral.trim());
  }, []);

  return (
    <header
      data-surface="public"
      className="conversion-header public-surface fixed inset-x-0 top-0 z-50 h-28 border-b border-border bg-background text-foreground shadow-[0_14px_32px_rgb(7_19_33_/_0.08)] print:static print:shadow-none"
    >
      <div className="h-8 border-b border-border px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.09em]">
          <span>Twin Cities painting</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-muted-foreground sm:inline">Owner-led / Written scope / Prep first</span>
            <a
              href="tel:+16514104196"
              data-track="call_click"
              data-track-payload='{"source":"utility_header"}'
              className="underline decoration-trust decoration-2 underline-offset-4"
            >
              Call / Text 651-410-4196
            </a>
          </div>
        </div>
      </div>

      <div className="h-20 px-4 sm:px-6 lg:px-8">
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
                  className="lg:hidden"
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
