import type { Variants } from 'motion/react';
import { motionTokens } from './tokens';

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.normal },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTokens.duration.normal,
      ease: motionTokens.easing.standard,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

export const staggerItemVariants: Variants = revealVariants;
