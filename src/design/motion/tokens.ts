export const motionTokens = {
  duration: {
    instant: 0.1,
    fast: 0.18,
    normal: 0.28,
    slow: 0.42,
  },
  distance: {
    subtle: 8,
    normal: 16,
    strong: 28,
  },
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
  },
  spring: {
    responsive: {
      type: 'spring' as const,
      stiffness: 420,
      damping: 34,
      mass: 0.8,
    },
  },
} as const;

export type MotionTokens = typeof motionTokens;
