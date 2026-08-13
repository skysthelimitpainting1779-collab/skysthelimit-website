import CapabilitiesPage from '@/views/Capabilities';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Corporate Capabilities Statement | Sky's the Limit Painting LLC",
  description: "Capabilities statement, verified corporate credentials, NAICS codes, SWIFT details, and public-sector readiness notes for Sky’s the Limit Painting LLC.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/capabilities',
  },
};

export default function Capabilities() {
  return <CapabilitiesPage />;
}
