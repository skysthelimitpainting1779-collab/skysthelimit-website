import type { Metadata } from 'next';
import '../index.css';
import React, { Suspense } from 'react';
import ConversionHeader from '../components/ConversionHeader';
import ConversionFooterCta from '../components/ConversionFooterCta';
import SocialLinks from '../components/SocialLinks';
import VercelInsights from '../components/VercelInsights';
import Link from 'next/link';
import { League_Gothic, Source_Sans_3 } from 'next/font/google';
import { cn } from '../lib/utils';
import { ENV } from '../lib/env';

const businessSameAs = [
  ENV.FACEBOOK_URL,
  ENV.INSTAGRAM_URL,
  ENV.LINKEDIN_URL,
  ENV.TIKTOK_URL,
  ENV.GOOGLE_BUSINESS_URL,
].filter(Boolean);

const siteUrl = ENV.SITE_URL.replace(/\/$/, '') || 'https://www.skysthelimitpaintingllc.com';

const bodyFont = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-ledger-body',
  display: 'swap',
});

const displayFont = League_Gothic({
  subsets: ['latin'],
  variable: '--font-ledger-display',
  display: 'swap',
});

const directionContract = `
THESIS: A lasting finish is the visible result of accountable preparation; the homepage refuses the dark contractor photo-overlay and service-card grid.
OWN-WORLD: Plaster paper, ledger ink, cobalt masking tape, safety-orange action, visible construction rules, sharp controls, and full-scale jobsite photography.
STORY: The visitor sees the offer, understands the preparation sequence, verifies owner involvement, and books a walkthrough.
FIRST VIEWPORT: A 58/42 paper-and-photo split carries the monumental promise, primary action, tape seam, and the beginning of the five-stage ledger.
FORM: Owner's Finish Ledger, grounded direction 1, user-pinned over seed 14f4dd46.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
`.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Twin Cities Painting Contractor | Sky's the Limit Painting LLC",
    template: "%s | Sky's the Limit Painting LLC",
  },
  description:
    'Owner-operated painting contractor serving Twin Cities homes and businesses. Interior and exterior painting, prep-first standards, fully insured. Get a free estimate today.',
  keywords: [
    'Twin Cities painting contractor',
    'Minnesota painting contractor',
    'Inver Grove Heights painting contractor',
    'interior painting Twin Cities',
    'exterior painting Twin Cities',
    'residential painting Minnesota',
    'commercial painting Minnesota',
    'parking lot striping Minnesota',
    'pavement marking Minnesota',
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: "Sky's the Limit Painting LLC",
    title: "Twin Cities Painting Contractor | Sky's the Limit Painting LLC",
    description:
      'Owner-operated, prep-first painting for Twin Cities homes, businesses, and facilities. Fully insured. MN ID: IR816596.',
    images: [{ url: '/brand/generated/sky-local-authority.webp', width: 1200, height: 630, alt: "Sky's the Limit Painting LLC" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Twin Cities Painting Contractor | Sky's the Limit Painting LLC",
    description:
      'Owner-operated painting for Twin Cities homes and businesses. Fully insured. Free estimate.',
    images: ['/brand/generated/sky-local-authority.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: ENV.GOOGLE_SITE_VERIFICATION || 'E4yKOu61Os6v4EQNmZ6-djni1eCyuDCw6v_XyLYFo90',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentYear = '2026';

  return (
    <html lang="en" className={cn(bodyFont.variable, displayFont.variable, 'dark antialiased')}>
      <head>
        <link rel="llms" href={`${siteUrl}/llms.txt`} />
        {/* next/font self-hosts both ledger faces with display: swap. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'PaintingContractor',
              '@id': `${siteUrl}/#business`,
              name: "Sky's the Limit Painting LLC",
              founder: 'Anthony Briseno',
              telephone: '+1-651-410-4196',
              email: 'skysthelimitpainting1779@gmail.com',
              url: siteUrl,
              logo: `${siteUrl}/brand/SkyLLP_BrandLogo.svg`,
              image: `${siteUrl}/brand/generated/sky-local-authority.webp`,
              priceRange: '$$',
              serviceType: [
                'Interior Painting',
                'Exterior Painting',
                'Cabinet Refinishing',
                'Commercial Painting',
                'Parking Lot Striping',
                'Pavement Marking',
                'Deck & Fence Staining',
              ],
              address: {
                '@type': 'PostalAddress',
                streetAddress: '1445 56th St E',
                addressLocality: 'Inver Grove Heights',
                addressRegion: 'MN',
                postalCode: '55077',
                addressCountry: 'US',
              },
              areaServed: [
                { '@type': 'City', name: 'Minneapolis' },
                { '@type': 'City', name: 'St. Paul' },
                { '@type': 'City', name: 'Inver Grove Heights' },
                { '@type': 'City', name: 'Eagan' },
                { '@type': 'City', name: 'Woodbury' },
                { '@type': 'City', name: 'South St. Paul' },
                { '@type': 'AdministrativeArea', name: 'Twin Cities Metro' },
              ],
              sameAs: businessSameAs,
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'registration',
                name: 'Minnesota Specialty Contractor Registration',
                identifier: 'IR816596',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <div
          aria-hidden="true"
          className="contents"
          dangerouslySetInnerHTML={{ __html: `<!-- ${directionContract} -->` }}
        />
        <div className="min-h-[100dvh] flex flex-col bg-page-bg text-page-text">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-[#FF661C] focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-[#071321]"
          >
            Skip to content
          </a>

          <Suspense fallback={null}>
            <ConversionHeader />
          </Suspense>

          <main id="main-content" className="flex-grow pt-[112px] pb-24 md:pb-0">
            {children}
          </main>

          {/* Mobile conversion rail */}
          <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-[0.8fr_0.8fr_1.4fr] border-t border-[#071321]/20 bg-[#F6F3EB] md:hidden">
            <a
              href="tel:+16514104196"
              data-track="call_click"
              data-track-payload='{"source":"mobile_sticky"}'
              className="flex min-h-14 items-center justify-center border-r border-[#071321]/20 px-2 text-xs font-black uppercase tracking-[0.08em] text-[#071321]"
            >
              Call
            </a>
            <a
              href="sms:+16514104196"
              data-track="text_click"
              data-track-payload='{"source":"mobile_sticky"}'
              className="flex min-h-14 items-center justify-center border-r border-[#071321]/20 px-2 text-xs font-black uppercase tracking-[0.08em] text-[#071321]"
            >
              Text
            </a>
            <Link
              href="/estimate"
              data-track="hero_cta_click"
              data-track-payload='{"source":"mobile_sticky","label":"Book a walkthrough"}'
              className="flex min-h-14 items-center justify-center bg-[#FF661C] px-3 text-center text-xs font-black uppercase tracking-[0.08em] text-[#071321]"
            >
              Book a walkthrough
            </Link>
          </div>

          <Suspense fallback={null}>
            <ConversionFooterCta />
          </Suspense>

          {/* Footer */}
          <footer className="relative mt-12 overflow-hidden bg-[#0A0A0A] px-6 py-20 text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-6 relative z-10">
              <div className="col-span-1 lg:col-span-2">
                <h2 className="text-3xl font-display font-bold mb-4">Sky&apos;s the Limit Painting LLC</h2>
                <h3 className="text-xl font-display font-semibold text-gray-300 mb-4">
                  Residential detail. Commercial discipline. Public-sector ready.
                </h3>
                <p className="text-gray-400 max-w-md text-lg">
                  A fully insured, owner-operated registered Minnesota Specialty Contractor (Painting) serving
                  residential, commercial, and qualified public-sector opportunities across the Twin Cities Metro area.
                </p>
                <div className="mt-8">
                  <a
                    href="tel:+16514104196"
                    data-track="call_click"
                    data-track-payload='{"source":"footer"}'
                    className="text-xl font-bold text-white hover:text-white transition-colors block mb-2"
                  >
                    651-410-4196
                  </a>
                  <a
                    href="mailto:skysthelimitpainting1779@gmail.com"
                    className="block break-all text-gray-400 transition-colors hover:text-white"
                  >
                    skysthelimitpainting1779@gmail.com
                  </a>
                  <p className="mt-2 text-gray-400">Call or text Anthony to start a written scope.</p>
                </div>
                <SocialLinks />
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Markets</h4>
                <nav className="flex flex-col gap-4 text-gray-400">
                  <Link href="/residential" className="hover:text-white transition-colors">
                    Residential
                  </Link>
                  <Link href="/commercial" className="hover:text-white transition-colors">
                    Commercial
                  </Link>
                  <Link href="/public-sector" className="hover:text-white transition-colors">
                    Public Sector
                  </Link>
                  <Link href="/projects" className="hover:text-white transition-colors">
                    Recent Work
                  </Link>
                </nav>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Services</h4>
                <nav className="flex flex-col gap-4 text-gray-400">
                  <Link href="/painting-services/interior-painting" className="hover:text-white transition-colors">
                    Interior Painting
                  </Link>
                  <Link href="/painting-services/exterior-painting" className="hover:text-white transition-colors">
                    Exterior Painting
                  </Link>
                  <Link href="/painting-services/cabinet-painting" className="hover:text-white transition-colors">
                    Cabinet Painting
                  </Link>
                  <Link href="/painting-services/deck-fence-staining" className="hover:text-white transition-colors">
                    Deck &amp; Fence Staining
                  </Link>
                  <Link href="/painting-services/commercial-painting" className="hover:text-white transition-colors">
                    Commercial Painting
                  </Link>
                </nav>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Service Areas</h4>
                <nav className="flex flex-col gap-4 text-gray-400">
                  <Link href="/service-area" className="hover:text-white transition-colors">
                    Coverage Map
                  </Link>
                  <Link href="/service-areas/inver-grove-heights" className="hover:text-white transition-colors">
                    Inver Grove Heights
                  </Link>
                  <Link href="/service-areas/eagan" className="hover:text-white transition-colors">
                    Eagan
                  </Link>
                  <Link href="/service-areas/woodbury" className="hover:text-white transition-colors">
                    Woodbury
                  </Link>
                  <Link href="/service-areas/st-paul" className="hover:text-white transition-colors">
                    St. Paul
                  </Link>
                </nav>
              </div>

              <div>
                <h4 className="font-bold mb-6 text-lg">Company</h4>
                <nav className="flex flex-col gap-4 text-gray-400">
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                  <Link href="/capabilities" className="hover:text-white transition-colors">
                    Capabilities Statement
                  </Link>
                  <Link href="/estimate" className="hover:text-white transition-colors">
                    Room Cost Calculator
                  </Link>
                  <Link href="/refer" className="hover:text-white transition-colors">
                    Referral Program
                  </Link>
                  <Link href="/review" className="hover:text-white transition-colors">
                    Google Review Funnel
                  </Link>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Get an Estimate
                  </Link>
                </nav>
              </div>
            </div>

            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-400">
              <div className="flex flex-col items-center md:items-start gap-1">
                <p>&copy; {currentYear} Sky&apos;s the Limit Painting LLC. All rights reserved.</p>
                <div className="flex gap-4 mt-2">
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p>
                  Registered MN Specialty Contractor (ID: IR816596) | Owner exempt from workers&apos; comp under MN Statute
                  176.041 | Fully Insured
                </p>
                <p className="mt-1">Twin Cities Metro Area, MN</p>
              </div>
            </div>
          </footer>
        </div>
        <VercelInsights />
      </body>
    </html>
  );
}
