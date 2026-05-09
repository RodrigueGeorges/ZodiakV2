import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Card — surface glass « brutal cosmos » : noir + hairline blanc + accent glace au besoin.
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
    'bg-white/[0.04] border border-white/10 backdrop-blur-md',
  elevated:
    'bg-white/[0.06] border border-white/14 backdrop-blur-md shadow-editorial shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.5)]',
  ghost:
    'bg-transparent border border-white/10',
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
          'cursor-pointer hover:border-aurora-400/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
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
      className={cn('px-7 py-4 border-t border-white/10', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
