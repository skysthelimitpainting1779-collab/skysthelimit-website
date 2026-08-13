import ServiceAreaPage from '@/views/ServiceArea';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Service Area Map | Twin Cities Painting Contractor",
  description: "Fast service-area map for Sky's the Limit Painting LLC, serving Inver Grove Heights and the Twin Cities metro.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/service-area',
  },
};

export default function ServiceArea() {
  return <ServiceAreaPage />;
}
