import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Card — primitive surface aurora.
 *
 * - `variant="surface"` (default) : fond `night-900/70` glass, hover subtil
 * - `variant="elevated"` : surface plus prononcée, gradient interne, halo
 * - `variant="ghost"` : transparent, juste un bord
 * - `interactive` : ajoute hover lift + ring focus (utile pour cards cliquables)
 */
export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'surface' | 'elevated' | 'ghost';
  interactive?: boolean;
  glow?: boolean;
  as?: 'div' | 'article' | 'section';
  children: ReactNode;
}

const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
  surface:
    'bg-night-900/70 backdrop-blur-md border border-night-700/80 shadow-card',
  elevated:
    'bg-gradient-to-br from-night-800/80 to-night-900/90 backdrop-blur-md border border-night-700 shadow-card',
  ghost: 'bg-transparent border border-night-700/60',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', interactive, glow, className, children, ...rest },
  ref
) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-2xl overflow-hidden transition-all duration-300',
        variantStyles[variant],
        interactive &&
          'cursor-pointer hover:shadow-card-hover hover:border-aurora-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        glow && 'shadow-glow-aurora',
        className
      )}
      {...rest}
    >
      {/* Liseré interne lumineux */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ivory-50/[0.04]"
      />
      {/* Reflet aurora discret en haut */}
      {variant === 'elevated' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-aurora-400/40 to-transparent"
        />
      )}
      {children}
    </motion.div>
  );
});

interface CardSubProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...rest }: CardSubProps) {
  return (
    <div className={cn('px-6 pt-6 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardBody({ className, children, ...rest }: CardSubProps) {
  return (
    <div className={cn('px-6 py-4', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardFooter({ className, children, ...rest }: CardSubProps) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-night-700/60', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
