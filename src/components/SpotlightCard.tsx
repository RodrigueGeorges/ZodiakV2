import { useRef, MouseEvent, ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Couleur du halo (rgba). */
  spotlightColor?: string;
  /** Taille du halo (px). */
  spotlightSize?: number;
}

/**
 * Card avec un halo lumineux qui suit le curseur (desktop only).
 *
 * Utilisé sur les RitualCard / FeatureCard / PriceCard pour donner cet
 * effet "premium" qu'on retrouve sur Linear, Vercel, Stripe.
 *
 * Implémentation : 2 motion values (mx, my) trackent la position relative
 * du curseur, transmises à un radial-gradient via CSS variables. Pas de
 * re-render React : c'est entièrement géré par framer-motion.
 *
 * Auto-disabled sur prefers-reduced-motion.
 */
export default function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(201, 166, 255, 0.18)',
  spotlightSize = 320,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const reduced = useReducedMotion();

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleLeave = () => {
    mx.set(50);
    my.set(50);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('group relative', className)}
    >
      {/* Spotlight overlay */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]"
          style={{
            background: `radial-gradient(${spotlightSize}px circle at calc(var(--mx, 50%) * 1%) calc(var(--my, 50%) * 1%), ${spotlightColor}, transparent 60%)`,
            // @ts-expect-error CSS custom props
            '--mx': mx,
            '--my': my,
          }}
        />
      )}
      {children}
    </div>
  );
}
