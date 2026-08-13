"use client";

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from './tokens';

export function Pressable({ children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.button
      type={type}
      whileHover={prefersReducedMotion ? undefined : { y: -1 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
      transition={prefersReducedMotion ? { duration: 0 } : motionTokens.spring.responsive}
      {...props}
    >
      {children}
    </motion.button>
  );
}
