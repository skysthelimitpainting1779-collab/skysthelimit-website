import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '../index.css';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

/**
 * The document shell intentionally contains no marketing chrome. Route-group
 * layouts own their surface: `(marketing)` renders the public conversion
 * shell, while `(protected)` renders the authenticated application shell.
 */
export const metadata: Metadata = {
  title: "Sky's the Limit Painting LLC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, 'dark antialiased')}>
      <head>
        <link rel="llms" href="/llms.txt" />
      </head>
      <body className="min-h-[100dvh] bg-page-bg text-page-text antialiased">{children}</body>
    </html>
  );
}
