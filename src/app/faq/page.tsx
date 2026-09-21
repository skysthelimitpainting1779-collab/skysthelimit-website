import FaqPage from '../../views/Faq';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers about Sky\u2019s painting services, licensing and insurance, free estimates, prep standards, and Twin Cities Metro service area.',
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/faq',
  },
};

export default function FAQ() {
  return <FaqPage />;
}
