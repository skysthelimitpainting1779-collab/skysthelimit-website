'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, Star } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { googleReviewsUrl, type VerifiedReview } from './testimonials-data';

const cardVariants = cva(
  'group relative flex h-full flex-col border bg-white/[0.04] p-6 transition-colors duration-300 sm:p-7',
  {
    variants: {
      tone: {
        default: 'border-white/20 hover:border-[#FF661C]/60',
        featured: 'border-[#FF661C]/50 hover:border-[#FF661C]',
      },
    },
    defaultVariants: { tone: 'default' },
  },
);

export function Stars({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="img" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} aria-hidden="true" size={16} className="fill-[#FF661C] text-[#FF661C]" />
      ))}
    </div>
  );
}

type TestimonialCardProps = {
  review: VerifiedReview;
  index: number;
} & VariantProps<typeof cardVariants>;

export function TestimonialCard({ review, index, tone }: TestimonialCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      className={cn(cardVariants({ tone }))}
      initial={reduceMotion ? undefined : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -6 }}
    >
      <div className="flex items-center justify-between gap-3">
        <Stars />
        <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#8FA6BC]">
          <ShieldCheck aria-hidden="true" size={14} className="text-[#FF661C]" />
          Verified Google review
        </span>
      </div>

      {review.text != null ? (
        <figure className="mt-5 flex flex-1 flex-col">
          <blockquote className="flex-1 text-[0.95rem] leading-7 text-[#E6EFF8]">
            &ldquo;{review.text}&rdquo;
          </blockquote>
          <figcaption className="mt-6 border-t border-white/20 pt-4">
            <p className="text-sm font-black text-[#F6F3EB]">{review.author}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#8FA6BC]">
              {review.when} &middot; Posted on Google
            </p>
          </figcaption>
        </figure>
      ) : (
        <div className="mt-5 flex flex-1 flex-col justify-end">
          <p className="text-[0.95rem] leading-7 text-[#8FA6BC]">Rated 5 stars on Google.</p>
          <div className="mt-6 border-t border-white/20 pt-4">
            <p className="text-sm font-black text-[#F6F3EB]">{review.author}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#8FA6BC]">
              {review.when} &middot; Posted on Google
            </p>
          </div>
        </div>
      )}

      <a
        href={googleReviewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Read ${review.author}'s review on Google`}
        className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF661C]"
      >
        <span className="sr-only">Read this review on Google</span>
      </a>
    </motion.article>
  );
}
