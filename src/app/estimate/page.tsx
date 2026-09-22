import EstimatePage from '../../views/Estimate';
import CalBooking from '../../components/CalBooking';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twin Cities Room Painting Cost Calculator',
  description: 'Estimate room painting and trim preparation costs for Twin Cities homes, then request a written owner-led scope for firm pricing.',
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/estimate',
  },
};

export default function Estimate() {
  return (
    <>
      <EstimatePage />
      <CalBooking />
    </>
  );
}
