import type { Transition } from 'motion/react';

export const reducedMotionTransition: Transition = { duration: 0 };

export function reducedTransform<T extends Record<string, unknown>>(
  prefersReducedMotion: boolean,
  animated: T,
): T | Record<string, never> {
  return prefersReducedMotion ? {} : animated;
}
