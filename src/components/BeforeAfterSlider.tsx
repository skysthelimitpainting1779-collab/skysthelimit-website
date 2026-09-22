'use client';

import React, { useState } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

import ResponsiveImage from './ResponsiveImage';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  /**
   * Only render the comparison when the before/after pair documents one real
   * project. Defaults to false: an unverified pair renders a placeholder CTA,
   * never a fabricated before/after.
   */
  verifiedPair?: boolean;
}

function UnverifiedPairPlaceholder() {
  return (
    <div className="flex min-h-[22rem] flex-col items-start justify-center gap-5 border border-border bg-card p-8">
      <span className="inline-flex h-11 w-11 items-center justify-center border border-border text-muted-foreground">
        <ImageOff aria-hidden="true" size={20} />
      </span>
      <div>
        <p className="text-lg font-black leading-7 text-card-foreground">Before and after, in progress.</p>
        <p className="mt-2 max-w-[36rem] text-sm leading-6 text-muted-foreground">
          This project's before and after photos are still being documented. We only show
          before/after pairs from real, completed work.
        </p>
      </div>
      <a
        href="/contact"
        className="inline-flex min-h-12 items-center gap-3 border-b-2 border-[#FF661C] text-sm font-black uppercase tracking-[0.08em] text-card-foreground transition-colors hover:text-[#FF661C]"
      >
        Talk through your scope
      </a>
    </div>
  );
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  verifiedPair = false,
}: BeforeAfterSliderProps) {
  // Taste 3.B: the drag position is a continuous input value, so it lives in a
  // MotionValue outside the React render cycle. `committed` is a discrete
  // mirror kept only for the input value and the screen-reader announcement.
  const position = useMotionValue(50);
  const reduceMotion = useReducedMotion();
  const spring = useSpring(position, { stiffness: 300, damping: 30, mass: 0.6 });
  // Reduced-motion users get the raw position: the comparison still works,
  // without the autonomous spring glide.
  const driver = reduceMotion ? position : spring;
  const clipRight = useTransform(driver, (value) => 100 - value);
  const clipPath = useMotionTemplate`inset(0 ${clipRight}% 0 0)`;
  const handleLeft = useTransform(driver, (value) => `${value}%`);
  const [committed, setCommitted] = useState(50);

  const commitPosition = (next: number) => {
    const clamped = Math.min(100, Math.max(0, Math.round(next)));
    position.set(clamped);
    setCommitted(clamped);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      commitPosition(position.get() - 5);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      commitPosition(position.get() + 5);
    } else if (event.key === 'Home') {
      event.preventDefault();
      commitPosition(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      commitPosition(100);
    }
  };

  if (!verifiedPair) {
    return <UnverifiedPairPlaceholder />;
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[350px] w-full cursor-ew-resize select-none overflow-hidden rounded-none border border-white/10 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white">
        {/* Underlay Image: After */}
        <div className="absolute inset-0 h-full w-full">
          <ResponsiveImage
            src={afterImage}
            alt={afterLabel}
            width={1200}
            height={700}
            sizes="(min-width: 768px) 60ch, 100vw"
            className="pointer-events-none h-full w-full object-cover"
          />
        </div>

        {/* Overlay Image: Before (clipped, spring-smoothed) */}
        <motion.div className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden" style={{ clipPath }}>
          <ResponsiveImage
            src={beforeImage}
            alt={beforeLabel}
            width={1200}
            height={700}
            sizes="(min-width: 768px) 60ch, 100vw"
            className="pointer-events-none h-full w-full object-cover"
          />
        </motion.div>

        <div className="pointer-events-none absolute left-4 top-4 z-10 border border-white/20 bg-black/60 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm">
          {beforeLabel}
        </div>
        <div className="pointer-events-none absolute right-4 top-4 z-10 border border-white bg-white px-3 py-1 text-xs font-bold text-[#050505] shadow-md backdrop-blur-sm">
          {afterLabel}
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={committed}
          aria-label="Before and after image comparison slider"
          aria-valuetext={`${committed} percent ${beforeLabel} visible`}
          onChange={(event) => commitPosition(Number(event.target.value))}
          onKeyDown={handleKeyDown}
          onMouseDown={(event) => event.currentTarget.focus()}
          onTouchStart={(event) => event.currentTarget.focus()}
          className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
        />

        {/* Draggable divider handle */}
        <motion.div
          style={{ left: handleLeft, x: '-50%' }}
          className="absolute bottom-0 top-0 z-20 flex w-1 cursor-ew-resize items-center justify-center bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          aria-hidden="true"
        >
          <div className="flex h-11 w-11 items-center justify-center border-2 border-[#FF661C] bg-white text-[#050505] shadow-lg transition-transform duration-150 active:scale-95">
            <ChevronLeft aria-hidden="true" size={18} />
            <ChevronRight aria-hidden="true" size={18} className="-ml-2" />
          </div>
        </motion.div>
      </div>

      <div className="flex justify-between text-xs font-bold text-gray-400" aria-hidden="true">
        <span>
          {beforeLabel} (Drag slider or use Arrow keys)
        </span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}
