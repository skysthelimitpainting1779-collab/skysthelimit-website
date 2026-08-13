import AboutPage from '@/views/About';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Sky's the Limit Painting LLC | Owner-Operated Twin Cities Painter",
  description: "Anthony Briseno founded Sky's the Limit Painting LLC to bring dependable, high-craftsmanship painting to Minneapolis, St. Paul, and the Twin Cities metro. Minnesota Journeyworker Painter & Decorator. Owner on every job. (651) 410-4196",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/about',
  },
};

export default function About() {
  return <AboutPage />;
}
