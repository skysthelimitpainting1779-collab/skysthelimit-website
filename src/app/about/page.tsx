import AboutPage from '../../views/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner-Operated Twin Cities Painter',
  description: 'Meet Anthony Briseno, the owner-led Twin Cities painter behind prep-first residential, commercial, and facility painting scopes.',
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/about',
  },
};

export default function About() {
  return <AboutPage />;
}
