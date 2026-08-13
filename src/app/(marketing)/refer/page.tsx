import ReferPage from '@/views/Refer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Double-Sided Painting Referral Program | Sky's the Limit Painting LLC",
  description: "Share the paint, share the reward. Send your friends $100 off their next painting project and get $100 cash check when their project wraps.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/refer',
  },
};

export default function Refer() {
  return <ReferPage />;
}
