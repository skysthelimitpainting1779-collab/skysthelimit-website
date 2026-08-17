import type { Metadata } from 'next';
import { Barlow_Condensed, Inter, Source_Sans_3 } from 'next/font/google';
import React, { Suspense } from 'react';

import '../index.css';
import AnalyticsDelegator from '../components/AnalyticsDelegator';
import ConversionFooterCta from '../components/ConversionFooterCta';
import ConversionHeader from '../components/ConversionHeader';
import MobileConversionRail from '../components/public/MobileConversionRail';
import PublicFooter from '../components/public/PublicFooter';
import VercelInsights from '../components/VercelInsights';
import { ENV } from '../lib/env';
import { cn } from '../lib/utils';

const businessSameAs = [
  ENV.FACEBOOK_URL,
  ENV.INSTAGRAM_URL,
  ENV.LINKEDIN_URL,
  ENV.TIKTOK_URL,
  ENV.GOOGLE_BUSINESS_URL,
].filter(Boolean);

const siteUrl = ENV.SITE_URL.replace(/\/$/, '') || 'https://www.skysthelimitpaintingllc.com';

const internalFont = Inter({
  subsets: ['latin'],
  variable: '--font-internal',
  display: 'swap',
});

const bodyFont = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-ledger-body',
  display: 'swap',
});

const displayFont = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-ledger-display',
  display: 'swap',
});

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
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: "Sky's the Limit Painting LLC",
    title: "Twin Cities Painting Contractor | Sky's the Limit Painting LLC",
    description: 'Owner-operated, prep-first painting for Twin Cities homes, businesses, and facilities. Fully insured. MN ID: IR816596.',
    images: [{ url: '/brand/generated/sky-local-authority.webp', width: 1200, height: 630, alt: "Sky's the Limit Painting LLC" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Twin Cities Painting Contractor | Sky's the Limit Painting LLC",
    description: 'Owner-operated painting for Twin Cities homes and businesses. Fully insured. Free estimate.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const currentYear = '2026';

  return (
    <html lang="en" className={cn(internalFont.variable, bodyFont.variable, displayFont.variable, 'dark antialiased')}>
      <head>
        <link rel="llms" href={`${siteUrl}/llms.txt`} />
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
        <AnalyticsDelegator />
        <div className="flex min-h-[100dvh] flex-col bg-page-bg text-page-text">
          <a
            href="#main-content"
            className="public-surface sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-primary-foreground"
          >
            Skip to content
          </a>

          <Suspense fallback={null}>
            <ConversionHeader />
          </Suspense>

          <main id="main-content" className="flex-grow pt-[112px] pb-24 md:pb-0">
            {children}
          </main>

          <Suspense fallback={null}>
            <MobileConversionRail />
          </Suspense>
          <Suspense fallback={null}>
            <ConversionFooterCta />
          </Suspense>
          <PublicFooter year={currentYear} />
        </div>
        <VercelInsights />
      </body>
    </html>
  );
}
