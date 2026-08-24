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
      className="conversion-header public-surface fixed inset-x-0 top-0 z-50 h-[76px] border-b border-border bg-background text-foreground shadow-[0_10px_28px_rgb(7_19_33_/_0.07)] print:static print:shadow-none"
    >
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[94rem] items-center justify-between gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-3 leading-none" aria-label="Sky's the Limit Painting LLC home">
            <Image src="/brand/SkyLLP_BrandLogo.svg" alt="" width={40} height={36} className="h-9 w-10 object-contain" preload />
            <span>
              <span className="block text-lg font-black uppercase tracking-[-0.025em] sm:text-xl">Sky&apos;s the Limit</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Painting LLC</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-5 xl:flex 2xl:gap-7">
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

          <div className="hidden items-center gap-3 xl:flex">
            <span aria-hidden="true" className="hidden text-xs font-bold text-muted-foreground 2xl:inline">
              Owner-led / Written scope / Prep first
            </span>
            <a
              href="tel:+16514104196"
              data-track="call_click"
              data-track-payload='{"source":"primary_header"}'
              className="hidden min-h-11 items-center gap-2 border border-border px-4 text-sm font-black text-foreground transition-colors hover:border-trust hover:text-trust 2xl:inline-flex"
            >
              <Phone aria-hidden="true" size={16} />
              651-410-4196
            </a>
            <PublicCtaLink
              href={pathname === '/' ? '#walkthrough' : '/estimate'}
              track="hero_cta_click"
              trackPayload={{ source: 'primary_header', label: 'Get a Free Price Range' }}
            >
              Start the Written Scope
            </PublicCtaLink>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger
              render={(
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="xl:hidden"
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
                  href={pathname === '/' ? '#walkthrough' : '/estimate'}
                  size="marketing-lg"
                  track="hero_cta_click"
                  trackPayload={{ source: 'mobile_header', label: 'Get a Free Price Range' }}
                  className="w-full"
                >
                  Start the Written Scope
                </PublicCtaLink>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
