'use client';

import { ArrowUpRight, Star } from 'lucide-react';

// Review text below is verbatim from the live Google Business Profile listing
// (provenance: ~/workspace/skys-crm/gbp-reviews-2026-09-21.md, captured 2026-09-21).
// Only add reviews verified from that source. Tori Athey left a star-only
// review, so her card shows stars without quoted text.
// NOTE: keep googleReviewUrl in sync with src/views/Review.tsx.
const googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJ8d-Nq98d9kgR50-mR-K5k84';
// Verified live 2026-09-21: this is the listing URL Google returned for
// "Skys The Limit Painting LLC Minnesota".
const googleReviewsUrl = 'https://www.google.com/maps/place/Skys+The+Limit+Painting+LLC/@44.925452,-93.2359444,11z';

type VerifiedReview = {
  author: string;
  when: string;
  text: string | null;
};

const reviews: readonly VerifiedReview[] = [
  {
    author: 'Cristina Brostrom',
    when: '2 months ago',
    text: 'Anthony painted our living room and it turned out so nice. He was really careful with all the prep and protection so nothing got messed up. The space feels so much brighter and cleaner now. He communicated well and made the whole process easy. I\'m really happy with how it looks.',
  },
  {
    author: 'Joseph Bailey',
    when: '2 months ago',
    text: 'Anthony did the exterior of my place and did it the right way. He prepped everything properly instead of rushing through it. The finish looks clean and sharp, and it\'s already holding up well. He was on time, professional, and easy to work with. I\'d recommend him to anyone who wants it done right the first time.',
  },
  {
    author: 'Tori Athey',
    when: 'a month ago',
    text: null,
  },
] as const;

function Stars() {
  return (
    <div className="flex items-center gap-1" role="img" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} aria-hidden="true" size={16} className="fill-[#FF661C] text-[#FF661C]" />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section aria-labelledby="reviews-title" className="bg-[#071321] text-[#F6F3EB]">
      <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF661C]">Google reviews</p>
            <h2 id="reviews-title" className="proof-display mt-6 max-w-[9ch] text-[clamp(3.4rem,6vw,6.75rem)] leading-[0.82] tracking-[-0.055em]">
              Rated by the people we worked for.
            </h2>
            <p className="mt-8 max-w-[30rem] text-lg leading-8 text-[#C8D7E6]">
              5.0 stars across 3 Google reviews as of September 2026. Quoted word for word, with a link to read them on Google.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track="review_read_click"
                data-track-payload={JSON.stringify({ source: 'reviews_section', label: 'Read reviews on Google' })}
                className="inline-flex min-h-12 items-center gap-3 border-b-2 border-[#F6F3EB] text-sm font-black uppercase tracking-[0.08em] transition-colors hover:border-[#FF661C] hover:text-[#FF661C]"
              >
                Read reviews on Google <ArrowUpRight aria-hidden="true" size={17} />
              </a>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track="review_write_click"
                data-track-payload={JSON.stringify({ source: 'reviews_section', label: 'Leave us a Google review' })}
                className="inline-flex min-h-12 items-center gap-3 border-b-2 border-transparent text-sm font-black uppercase tracking-[0.08em] text-[#C8D7E6] transition-colors hover:border-[#FF661C] hover:text-[#FF661C]"
              >
                Leave us a Google review <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            </div>
          </div>

          <ul className="grid gap-5 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {reviews.map((review) => (
              <li key={review.author} className="flex flex-col border border-white/20 bg-white/[0.04] p-6 sm:p-7">
                <Stars />
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
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
