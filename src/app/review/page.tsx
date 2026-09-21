import ReviewPage from '../../views/Review';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Share Your Feedback',
  description: "We appreciate your business. Please share your experience with Anthony Briseno and the Sky's the Limit team.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/review',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Review() {
  return <ReviewPage />;
}
