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
        className={`relative whitespace-nowrap text-sm font-bold transition-colors duration-200 py-2 hover:text-white ${isActive ? 'text-white' : 'text-gray-400'}`}
      >
        {children}
      </Link>
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute -bottom-1 left-0 w-full h-0.5 bg-white"
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
      <header className={`fixed top-0 left-0 w-full z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${scrolled ? 'bg-surface-void/85 backdrop-blur-md shadow-sm border-b border-line' : 'bg-surface-void/92 backdrop-blur-sm'}`}>
        
        {/* Micro-Utility Bar */}
        <div className="h-8 bg-surface-void border-b border-line flex items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex justify-between items-center gap-3 overflow-hidden text-[12px] md:text-sm text-white/70 font-bold">
            <span className="truncate">(651) 410-4196 • info@skysthelimitpaintingllc.com</span>
            <span className="hidden sm:inline truncate">Prep-first painting across the Twin Cities • Price range, scope review, and schedule conversation in one path</span>
          </div>
        </div>

        {/* Primary Nav */}
        <div className={`py-4`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <div className="grid h-14 w-14 place-items-center overflow-hidden border border-line-strong bg-white p-1.5">
                <img src="/brand/SkyLLP_BrandLogo.svg" alt="Sky's the Limit Painting LLC" className="h-full w-full object-contain" />
              </div>
              <span className="font-display hidden text-xl font-black leading-none text-white sm:block">
                SKY'S THE LIMIT
                <span className="mt-1 block text-sm text-gray-400">Painting LLC</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
              <NavLink to="/residential">Residential</NavLink>
              <NavLink to="/commercial">Commercial</NavLink>
              <NavLink to="/public-sector">Public Sector</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              
              {/* Dropdown Menu */}
              <div 
                className="relative py-2"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
              >
                <button 
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className={`relative whitespace-nowrap text-sm font-bold transition-colors duration-200 flex items-center gap-1 cursor-pointer focus:outline-none hover:text-white ${dropdownOpen ? 'text-white' : 'text-gray-400'}`}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  More
                  <ChevronDown size={12} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-48 bg-surface-void border border-line p-2 flex flex-col gap-1 shadow-xl z-50"
                    style={{ borderRadius: '0px' }}
                  >
                    <Link 
                      href="/service-area" 
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/service-area', label: 'Areas' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Areas
                    </Link>
                    <Link 
                      href="/refer" 
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/refer', label: 'Referral' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Referral
                    </Link>
                    <Link 
                      href="/about" 
                      data-track="nav_click"
                      data-track-payload={JSON.stringify({ path: '/about', label: 'About' })}
                      className="block px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      About
                    </Link>
                  </div>
                )}
              </div>

              <NavLink to="/contact">Contact</NavLink>
            </nav>

            {/* Desktop Actions - Conversion Anchor */}
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <Link
                href="/estimate"
                data-track="hero_cta_click"
                data-track-payload='{"source":"header","label":"Price Range"}'
                className="u-transition inline-flex items-center justify-center gap-2 bg-[#FF5A00] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-[#E94F00]"
              >
                <Calculator size={15} />
                Price Range
              </Link>
              <a href="tel:+16514104196" data-track="call_click" data-track-payload='{"source":"header"}' className="u-transition inline-flex items-center justify-center gap-2 border border-[#FF5A00] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-[#FF5A00] hover:bg-[#FF5A00] hover:text-white">
                <Phone size={15} />
                651-410-4196
              </a>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div 
            initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 top-[104px] bg-surface-void z-40 lg:hidden flex flex-col p-6 overflow-y-auto pb-32"
          >
            <nav className="flex flex-col gap-6 text-xl">
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
              <Link href="/estimate" data-track="hero_cta_click" data-track-payload='{"source":"mobile_menu","label":"Price Range"}' className="u-transition w-full text-center bg-[#FF5A00] px-6 py-4 font-black uppercase tracking-[0.08em] text-white hover:bg-[#E94F00]">
                Get A Price Range
              </Link>
              <a href="tel:+16514104196" data-track="call_click" data-track-payload='{"source":"mobile_menu"}' className="w-full text-center border border-[#FF5A00] px-6 py-4 font-black uppercase tracking-[0.08em] text-[#FF5A00]">
                Call / Text 651-410-4196
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
