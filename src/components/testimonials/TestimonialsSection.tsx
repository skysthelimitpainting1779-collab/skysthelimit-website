'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

import { TestimonialCard } from './TestimonialCard';
import {
  aggregateRating,
  googleReviewUrl,
  googleReviewsUrl,
  reviewCount,
  reviews,
} from './testimonials-data';

// Taste design read: trust-first testimonial band for a local painting
// contractor's marketing site. Redesign-preserve: keep the site's industrial
// trade language (Barlow Condensed display, safety-orange #FF661C, radius 0,
// dark band continuing the page's alternating rhythm). Dials: VARIANCE 4 /
// MOTION 4 / DENSITY 4. Layout family is deliberately NOT the split header
// used by the neighboring sections (taste 4.7: one layout family per page).
export default function TestimonialsSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="reviews-title" className="bg-[#071321] text-[#F6F3EB]">
      <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28 xl:px-16">
        <motion.div
          className="max-w-[52rem]"
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-64px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF661C]">Google reviews</p>
          <h2
            id="reviews-title"
            className="proof-display mt-6 text-[clamp(3rem,5.4vw,5.75rem)] leading-[0.85] tracking-[-0.055em]"
          >
            Rated by the people we worked for.
          </h2>
          <p className="mt-6 max-w-[38rem] text-lg leading-8 text-[#C8D7E6]">
            {aggregateRating} stars across {reviewCount} Google reviews as of September 2026. Quoted word
            for word from the listing; each card links to the full review on Google.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <a
              href={googleReviewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-3 border-b-2 border-[#F6F3EB] text-sm font-black uppercase tracking-[0.08em] transition-colors hover:border-[#FF661C] hover:text-[#FF661C]"
            >
              Read reviews on Google <ArrowUpRight aria-hidden="true" size={17} />
            </a>
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-3 border-b-2 border-transparent text-sm font-black uppercase tracking-[0.08em] text-[#C8D7E6] transition-colors hover:border-[#FF661C] hover:text-[#FF661C]"
            >
              Leave us a Google review <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          </div>
        </motion.div>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.map((review, index) => (
            <li key={review.author} className="h-full">
              <TestimonialCard review={review} index={index} tone={index === 0 ? 'featured' : 'default'} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
