'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { trackEvent } from '../lib/analytics';
import { createClient } from '../lib/supabase/client';

interface Testimonial {
  id: number;
  name: string;
  location: string;
  project: string;
  rating: number;
  text: string;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Inver Grove Heights, MN',
    project: 'Interior Painting & Cabinets',
    rating: 5,
    text: "Anthony is absolutely top-tier. Clean prep, perfect masking, and sharp trim lines. He painted our entire main level and kitchen cabinets. The finish is immaculate and he respected our home throughout.",
  },
  {
    id: 2,
    name: 'Marcus G.',
    location: 'St. Paul, MN',
    project: 'Commercial Facility Refresh',
    rating: 5,
    text: "Highly recommend Sky's the Limit. They completed a commercial interior refresh for our St. Paul offices. Professional communication, clean staging, and they hit the schedule exactly as promised. Zero disruptions.",
  },
  {
    id: 3,
    name: 'David K.',
    location: 'Eagan, MN',
    project: 'Full Exterior Painting',
    rating: 5,
    text: "The smartest decision we made was hiring Anthony for our home exterior. The prep work alone—scraping, sanding, and priming—was incredibly thorough. The final paint looks stunning. High craftsmanship.",
  },
  {
    id: 4,
    name: 'Jessica L.',
    location: 'Woodbury, MN',
    project: 'Kitchen Cabinet Refinishing',
    rating: 5,
    text: "Pristine cabinet spraying! Our kitchen cabinets look brand new. Perfect adhesion with a hard, dust-free spray finish. Anthony kept us updated every step. Excellent service and worth every penny.",
  },
];

export default function ReviewCarousel() {
  const prefersReducedMotion = useReducedMotion();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    let mounted = true;

    const loadTestimonials = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false });

        if (!mounted) {
          return;
        }

        if (error || !data || data.length === 0) {
          setTestimonials(FALLBACK_TESTIMONIALS);
          return;
        }

        setTestimonials(data.map((row: any) => ({
          id: row.id,
          name: row.name,
          location: row.location ?? '',
          project: '',
          rating: row.rating ?? 5,
          text: row.quote ?? '',
        })));
      } catch {
        if (mounted) {
          setTestimonials(FALLBACK_TESTIMONIALS);
        }
      }
    };

    loadTestimonials();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setActiveIndex((prev) => (prev >= testimonials.length ? 0 : prev));
  }, [testimonials]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      handleNext(true); // auto-play
    }, 8000);
    return () => clearInterval(timer);
  }, [activeIndex, testimonials, prefersReducedMotion]);

  const handlePrev = () => {
    setDirection('left');
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    trackEvent('testimonial_carousel_nav', { direction: 'prev' });
  };

  const handleNext = (isAuto = false) => {
    setDirection('right');
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    if (!isAuto) {
      trackEvent('testimonial_carousel_nav', { direction: 'next' });
    }
  };

  const activeTestimonial = testimonials[activeIndex] ?? testimonials[0];

  const slideVariants = {
    enter: (dir: 'left' | 'right') => ({
      x: prefersReducedMotion ? 0 : dir === 'right' ? 80 : -80,
      opacity: prefersReducedMotion ? 1 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            x: { type: 'spring' as const, stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          },
    },
    exit: (dir: 'left' | 'right') => ({
      x: prefersReducedMotion ? 0 : dir === 'right' ? -80 : 80,
      opacity: prefersReducedMotion ? 1 : 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            x: { type: 'spring' as const, stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          },
    }),
  };

  return (
    <div className="relative overflow-hidden border border-white/10 bg-[#080807] p-8 md:p-12">
      <div className="blueprint-grid absolute inset-0 opacity-5 pointer-events-none"></div>
      
      {/* Quote Icon Background decoration */}
      <Quote size={120} className="absolute right-6 top-6 text-white/[0.02] pointer-events-none shrink-0" />
      
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
        {/* Rating Stars */}
        <div className="flex gap-1 text-white">
          {Array.from({ length: activeTestimonial.rating }).map((_, i) => (
            <Star key={i} size={18} className="fill-[white]" />
          ))}
        </div>

        {/* Animated Slide Content */}
        <div className="my-6 overflow-hidden relative min-h-[120px] flex items-center">
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <p className="text-lg md:text-xl font-medium leading-relaxed text-[#e7dfd2] italic">
                "{activeTestimonial.text}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Metadata & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pt-6 border-t border-white/10">
          <div>
            <h4 className="text-lg font-black text-white">{activeTestimonial.name}</h4>
            <p className="text-xs text-white font-semibold mt-1">
              {activeTestimonial.project ? `${activeTestimonial.project} — ` : ''}
              {activeTestimonial.location}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="grid h-10 w-10 place-items-center border border-white/15 bg-white/5 text-white transition-colors hover:border-white hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs text-zinc-400 font-mono px-2">
              {String(activeIndex + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
            </span>
            <button
              onClick={() => handleNext(false)}
              aria-label="Next testimonial"
              className="grid h-10 w-10 place-items-center border border-white/15 bg-white/5 text-white transition-colors hover:border-white hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
