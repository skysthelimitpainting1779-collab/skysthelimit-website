"use client";

import type { HTMLAttributes, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { staggerContainerVariants, staggerItemVariants } from './variants';

export function Stagger({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={prefersReducedMotion ? undefined : staggerContainerVariants}
      initial={prefersReducedMotion ? false : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={{ once: true, amount: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div className={className} variants={prefersReducedMotion ? undefined : staggerItemVariants} {...rest}>
      {children}
    </motion.div>
  );
}
