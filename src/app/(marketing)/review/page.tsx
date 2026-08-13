import ReviewPage from '@/views/Review';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Share Your Feedback | Sky's the Limit Painting LLC",
  description: "We appreciate your business. Please share your experience with Anthony Briseno and the Sky's the Limit team.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Review() {
  return <ReviewPage />;
}
