import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';

interface RevealLineProps {
  children: ReactNode;
  className?: string;
  /** Délai d’entrée en secondes (framer-motion). */
  delay?: number;
}

/**
 * Ligne de titre avec révélation par masque (clip-path horizontal).
 * Premium, sobre ; désactivée si prefers-reduced-motion.
 */
export function RevealLine({ children, className, delay = 0 }: RevealLineProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={cn('block overflow-hidden', className)}>
      <motion.span
        className="block"
        initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.94 }}
        animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
        transition={{
          clipPath: { duration: 1.05, delay, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
        }}
      >
        {children}
      </motion.span>
    </span>
  );
}
