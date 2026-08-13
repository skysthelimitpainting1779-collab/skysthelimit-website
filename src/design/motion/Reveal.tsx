"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from './tokens';

interface RevealProps<T extends ElementType = 'div'> {
  as?: T;
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal<T extends ElementType = 'div'>({
  as,
  children,
  delay = 0,
  className,
  ...rest
}: RevealProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof RevealProps<T>>) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion.create(as ?? 'div');

  return (
    <Component
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y: motionTokens.distance.normal }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: motionTokens.duration.normal, delay, ease: motionTokens.easing.standard }
      }
      {...rest}
    >
      {children}
    </Component>
  );
}
