'use client';

import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
  liftAmount?: number;
}

export default function HoverLift({ children, className = '', liftAmount = -8 }: HoverLiftProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ 
        y: liftAmount,
        backgroundColor: "rgba(255, 90, 0, 0.05)",
        borderColor: "rgba(255, 90, 0, 0.4)"
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
