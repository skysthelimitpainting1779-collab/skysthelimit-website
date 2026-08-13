import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: "Prep-First Painting Contractor Twin Cities | Sky's the Limit Painting LLC",
  description:
    "Owner-operated Twin Cities painting contractor for homes, businesses, and public facilities. Interior, exterior, and striping work with meticulous prep, insured coverage, and fast free estimates.",
  alternates: {
    canonical: "https://www.skysthelimitpaintingllc.com",
  },
  openGraph: {
    type: "website",
    title: "Prep-First Painting Contractor Twin Cities | Sky's the Limit Painting LLC",
    description:
      "Owner-operated Twin Cities painting contractor for homes, businesses, and public facilities. Meticulous prep, insured coverage, and fast free estimates.",
    url: "https://www.skysthelimitpaintingllc.com",
    images: [{ url: "/brand/generated/sky-local-authority.webp", width: 1200, height: 630 }],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
