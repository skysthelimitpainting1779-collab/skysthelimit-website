import ContactPage from '../../views/Contact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request a Painting Estimate',
  description: 'Request a Twin Cities estimate for residential, commercial, facility, or pavement-marking work with an owner-led written scope.',
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/contact',
  },
};

export default function Contact() {
  return <ContactPage />;
}
