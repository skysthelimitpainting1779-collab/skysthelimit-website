import ContactPage from '@/views/Contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Sky's the Limit Painting LLC | Free Estimates",
  description: "Request an estimate from Sky’s the Limit Painting LLC for residential painting, commercial painting, facility repainting, public-sector opportunities, or pavement marking in Minnesota.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/contact',
  },
};

export default function Contact() {
  return <ContactPage />;
}
