import { ReactNode, useRef, MouseEvent } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { cn } from '../lib/utils';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  /** Force du magnétisme (0..1). Plus c'est haut, plus le bouton suit le curseur. */
  strength?: number;
  /** Distance maximale en pixels. */
  range?: number;
  as?: 'div' | 'span';
}

/**
 * Wrapper qui ajoute un effet "magnétique" : sur desktop, le bouton suit
 * légèrement le curseur quand on s'en approche. Sur touch device et avec
 * `prefers-reduced-motion`, l'effet est désactivé.
 *
 * Usage :
 *   <MagneticButton>
 *     <Button variant="primary">CTA</Button>
 *   </MagneticButton>
 */
export default function MagneticButton({
  children,
  className,
  strength = 0.35,
  range = 24,
  as = 'div',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 250, damping: 22, mass: 0.5 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    x.set(Math.max(-range, Math.min(range, dx)));
    y.set(Math.max(-range, Math.min(range, dy)));
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = as === 'span' ? motion.span : motion.div;

  return (
    <Component
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={reduceMotion ? undefined : { x: sx, y: sy }}
      className={cn('inline-block', className)}
    >
      {children}
    </Component>
  );
}
