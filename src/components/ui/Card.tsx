import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Card — surface noire + filet « signal » (bronze / or discret).
 *
 * - `variant="surface"` (default) : fond night-900/40, bordure hairline or
 * - `variant="elevated"` : surface plus marquée (mantras, hero blocks)
 * - `variant="ghost"`    : transparent, juste une fine bordure
 * - `interactive`        : lift subtil au hover
 *
 * Refonte : suppression des gradients internes, des halos cumulés, des
 * "reflets aurora" en haut. On reste éditorial : juste du noir profond
 * + une bordure or à 8%. Le contenu fait le travail.
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
    'bg-night-900/42 border border-signal-600/18 backdrop-blur-sm',
  elevated:
    'bg-night-900/55 border border-signal-500/28 backdrop-blur-md shadow-editorial shadow-[inset_0_1px_0_rgba(170,133,88,0.1),inset_0_-1px_0_rgba(7,9,13,0.45)]',
  ghost:
    'bg-transparent border border-signal-600/15',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', interactive, glow, className, children, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-sm overflow-hidden transition-colors duration-200 ease-brutal',
        variantStyles[variant],
        interactive &&
          'cursor-pointer hover:border-signal-400/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        glow && 'shadow-glow-aurora',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

interface CardSubProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...rest }: CardSubProps) {
  return (
    <div className={cn('px-7 pt-7 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardBody({ className, children, ...rest }: CardSubProps) {
  return (
    <div className={cn('px-7 py-5', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardFooter({ className, children, ...rest }: CardSubProps) {
  return (
    <div
      className={cn('px-7 py-4 border-t border-signal-600/15', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
