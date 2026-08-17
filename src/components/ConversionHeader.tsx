'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Menu, X, ChevronDown, Phone } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

const NavLink = ({ to, children }: { to: string; children: ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <div className="relative group flex items-center">
      <Link
        href={to}
        data-track="nav_click"
        data-track-payload={JSON.stringify({ path: to, label: String(children) })}
        className={`relative whitespace-nowrap py-2 text-sm font-bold transition-colors duration-200 hover:text-white ${isActive ? 'text-white' : 'text-gray-400'}`}
      >
        {children}
      </Link>
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute -bottom-1 left-0 h-0.5 w-full bg-brand"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </div>
  );
};

export default function ConversionHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('referrer_email', ref.trim());
      }
    }
  }, []);

  const handleBlur = (e: React.FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropdownOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
      const button = e.currentTarget.querySelector('button');
      if (button) {
        (button as HTMLElement).focus();
      }
    }
  };

  return (
    <>
      <style>{`@media print { #main-content { padding-top: 0 !important; padding-bottom: 0 !important; } [data-track-payload*="mobile_sticky"] { display: none !important; } }`}</style>
      <header
        className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 print:static print:bg-surface-void print:shadow-none print:backdrop-blur-none ${
          scrolled ? 'border-b border-line bg-surface-void/85 shadow-sm backdrop-blur-md' : 'bg-surface-void/92 backdrop-blur-sm'
        }`}
      >
        <div className="flex h-8 items-center border-b border-line bg-surface-void px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 overflow-hidden text-[12px] font-bold text-white/70 md:text-sm">
            <span className="truncate">(651) 410-4196 • info@skysthelimitpaintingllc.com</span>
            <span className="hidden truncate sm:inline">Prep-first painting across the Twin Cities • Price range, scope review, and schedule conversation in one path</span>
          </div>
        </div>

        <div className="py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="grid h-14 w-14 place-items-center overflow-hidden border border-line-strong bg-white p-1.5">
                <img src="/brand/SkyLLP_BrandLogo.svg" alt="Sky's the Limit Painting LLC" className="h-full w-full object-contain" />
              </div>
              <span className="font-display hidden text-xl font-black leading-none text-white sm:block">
                SKY&apos;S THE LIMIT
                <span className="mt-1 block text-sm text-gray-400">Painting LLC</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Primary navigation">
              <NavLink to="/residential">Residential</NavLink>
              <NavLink to="/commercial">Commercial</NavLink>
              <NavLink to="/public-sector">Public Sector</NavLink>
              <NavLink to="/projects">Projects</NavLink>

              <div
                className="relative py-2"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              >
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`relative flex cursor-pointer items-center gap-1 whitespace-nowrap text-sm font-bold transition-colors duration-200 hover:text-white focus:outline-none ${dropdownOpen ? 'text-white' : 'text-gray-400'}`}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  More
                  <ChevronDown aria-hidden="true" size={12} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 z-50 mt-2 flex w-48 flex-col gap-1 border border-line bg-surface-void p-2 shadow-xl">
                    <Link
                      href="/service-area"
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/service-area', label: 'Areas' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Areas
                    </Link>
                    <Link
                      href="/refer"
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/refer', label: 'Referral' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Referral
                    </Link>
                    <Link
                      href="/about"
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/about', label: 'About' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                      onClick={() => setDropdownOpen(false)}
                    >
                      About
                    </Link>
                  </div>
                )}
              </div>

              <NavLink to="/contact">Contact</NavLink>
            </nav>

            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <Link
                href="/estimate"
                data-track="hero_cta_click"
                data-track-payload='{"source":"header","label":"Price Range"}'
                className="u-transition inline-flex min-h-11 items-center justify-center gap-2 bg-brand px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-orange-deep"
              >
                <Calculator aria-hidden="true" size={15} />
                Price Range
              </Link>
              <a
                href="tel:+16514104196"
                data-track="call_click"
                data-track-payload='{"source":"header"}'
                className="u-transition inline-flex min-h-11 items-center justify-center gap-2 border border-brand px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-brand hover:bg-brand hover:text-white"
              >
                <Phone aria-hidden="true" size={15} />
                651-410-4196
              </a>
            </div>

            <button
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="min-h-11 min-w-11 p-2 text-white lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X aria-hidden="true" size={28} /> : <Menu aria-hidden="true" size={28} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 top-[120px] z-40 flex flex-col overflow-y-auto bg-surface-void p-6 pb-32 lg:hidden print:hidden"
          >
            <nav className="flex flex-col gap-6 text-xl" aria-label="Mobile navigation">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/residential">Residential</NavLink>
              <NavLink to="/commercial">Commercial</NavLink>
              <NavLink to="/public-sector">Public Sector</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              <NavLink to="/service-area">Service Area</NavLink>
              <NavLink to="/refer">Referral Program</NavLink>
              <NavLink to="/about">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </nav>
            <div className="mt-12 flex flex-col gap-4">
              <Link
                href="/estimate"
                data-track="hero_cta_click"
                data-track-payload='{"source":"mobile_menu","label":"Price Range"}'
                className="u-transition w-full bg-brand px-6 py-4 text-center font-black uppercase tracking-[0.08em] text-white hover:bg-orange-deep"
              >
                Get A Price Range
              </Link>
              <a
                href="tel:+16514104196"
                data-track="call_click"
                data-track-payload='{"source":"mobile_menu"}'
                className="w-full border border-brand px-6 py-4 text-center font-black uppercase tracking-[0.08em] text-brand"
              >
                Call / Text 651-410-4196
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
