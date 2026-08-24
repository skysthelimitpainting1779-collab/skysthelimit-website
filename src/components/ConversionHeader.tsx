'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral = params.get('ref');
    if (referral) localStorage.setItem('referrer_email', referral.trim());
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-28 border-b border-[#071321]/20 bg-[#F6F3EB] text-[#071321] transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_14px_32px_rgba(7,19,33,0.08)]' : ''
      }`}
    >
      <div className="h-8 border-b border-[#071321]/15 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between gap-4 text-[11px] font-black uppercase tracking-[0.09em]">
          <span>Twin Cities painting</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-[#3E4D5D] sm:inline">Owner-led · Written scope · Prep first</span>
            <a
              href="tel:+16514104196"
              data-track="call_click"
              data-track-payload='{"source":"utility_header"}'
              className="underline decoration-[#0254C3] decoration-2 underline-offset-4"
            >
              Call / Text 651-410-4196
            </a>
          </div>
        </div>
      </div>

      <div className="h-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-3 leading-none" aria-label="Sky's the Limit Painting LLC home">
            <Image
              src="/brand/SkyLLP_BrandLogo.svg"
              alt=""
              width={44}
              height={40}
              className="h-10 w-11 object-contain"
            />
            <span>
              <span className="block text-lg font-black uppercase tracking-[-0.025em] sm:text-2xl">Sky&apos;s the Limit</span>
              <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.24em] text-[#3E4D5D] sm:text-[10px]">Painting LLC</span>
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
                  className={`relative py-3 text-sm font-bold transition-colors hover:text-[#0254C3] ${
                    current ? 'text-[#0254C3]' : 'text-[#26384A]'
                  }`}
                >
                  {item.label}
                  {current ? <span aria-hidden="true" className="absolute inset-x-0 bottom-1 h-0.5 bg-[#0254C3]" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="tel:+16514104196"
              data-track="call_click"
              data-track-payload='{"source":"primary_header"}'
              className="inline-flex min-h-12 items-center border border-[#071321]/35 px-5 text-sm font-black text-[#071321] transition-colors hover:border-[#0254C3] hover:text-[#0254C3]"
            >
              Call Anthony
            </a>
            <Link
              href="/estimate"
              data-track="hero_cta_click"
              data-track-payload='{"source":"primary_header","label":"Book a walkthrough"}'
              className="inline-flex min-h-12 items-center bg-[#FF661C] px-6 text-sm font-black text-[#071321] transition-colors hover:bg-[#F2550A]"
            >
              Book a walkthrough
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="grid h-12 w-12 shrink-0 place-items-center border border-[#071321]/30 text-[#071321] lg:hidden"
          >
            {mobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-b border-[#071321]/25 bg-[#F6F3EB] px-4 py-5 shadow-[0_18px_38px_rgba(7,19,33,0.12)] lg:hidden"
        >
          <div className="mx-auto grid max-w-[90rem]">
            {navigation.map((item) => {
              const current = isCurrentPath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={`flex min-h-12 items-center border-b border-[#071321]/15 text-lg font-black ${
                    current ? 'text-[#0254C3]' : 'text-[#071321]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/estimate" className="mt-5 flex min-h-14 items-center justify-center bg-[#FF661C] px-5 text-sm font-black text-[#071321]">
              Book a free walkthrough
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
