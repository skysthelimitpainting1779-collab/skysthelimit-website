'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

interface EditorialRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

const offsets = {
  up: { x: 0, y: 28 },
  left: { x: 28, y: 0 },
  right: { x: -28, y: 0 },
} as const;

export default function EditorialReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
}: EditorialRevealProps) {
  const reduceMotion = useReducedMotion();
  const offset = offsets[direction];

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : { opacity: 1, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: reduceMotion ? 0 : 0.72,
        delay: reduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
