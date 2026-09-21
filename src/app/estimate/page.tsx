import EstimatePage from '../../views/Estimate';
import CalBooking from '../../components/CalBooking';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'What Does House Painting Cost in Minneapolis?',
  description: 'What house painting costs in Minneapolis — real room-by-room pricing, then get your free written estimate.',
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
