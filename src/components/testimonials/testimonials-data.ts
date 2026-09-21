// Review text below is verbatim from the live Google Business Profile listing
// (provenance: ~/workspace/skys-crm/gbp-reviews-2026-09-21.md, captured 2026-09-21).
// Only add reviews verified from that source. Tori Athey left a star-only
// review, so her card shows stars without quoted text.
// NOTE: keep googleReviewUrl in sync with src/views/Review.tsx.
export const googleReviewUrl =
  'https://search.google.com/local/writereview?placeid=ChIJ8d-Nq98d9kgR50-mR-K5k84';

// Verified live 2026-09-21: this is the listing URL Google returned for
// "Skys The Limit Painting LLC Minnesota".
export const googleReviewsUrl =
  'https://www.google.com/maps/place/Skys+The+Limit+Painting+LLC/@44.925452,-93.2359444,11z';

export type VerifiedReview = {
  author: string;
  when: string;
  /** Null when the reviewer left stars without written text. */
  text: string | null;
};

export const reviews: readonly VerifiedReview[] = [
  {
    author: 'Cristina Brostrom',
    when: '2 months ago',
    text: "Anthony painted our living room and it turned out so nice. He was really careful with all the prep and protection so nothing got messed up. The space feels so much brighter and cleaner now. He communicated well and made the whole process easy. I'm really happy with how it looks.",
  },
  {
    author: 'Joseph Bailey',
    when: '2 months ago',
    text: "Anthony did the exterior of my place and did it the right way. He prepped everything properly instead of rushing through it. The finish looks clean and sharp, and it's already holding up well. He was on time, professional, and easy to work with. I'd recommend him to anyone who wants it done right the first time.",
  },
  {
    author: 'Tori Athey',
    when: 'a month ago',
    text: null,
  },
] as const;

export const aggregateRating = '5.0';
export const reviewCount = 3;
