import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Twin Cities Painting Contractor',
  description:
    'Twin Cities painting contractor for homes, offices, and parking lots. Owner-led, one written scope, crisp lines. Free estimates.',
  alternates: {
    canonical: "https://www.skysthelimitpaintingllc.com",
  },
  openGraph: {
    type: 'website',
    title: "Twin Cities Painting Contractor | Sky's the Limit Painting",
    description:
      'Owner-operated Twin Cities painter for homes, businesses, facilities, and pavement-marking projects. Prep-first scopes and free estimates.',
    url: "https://www.skysthelimitpaintingllc.com",
    images: [{ url: "/brand/generated/sky-local-authority.webp", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
