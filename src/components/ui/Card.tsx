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
    'premium-surface',
  elevated:
    'premium-surface premium-surface-elevated',
  ghost:
    'bg-white/[0.025] border border-white/[0.08] backdrop-blur-sm',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', interactive, glow, className, children, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative rounded-[1.35rem] overflow-hidden transition-[border-color,background-color,box-shadow,transform] duration-300 ease-brutal',
        variantStyles[variant as NonNullable<CardProps['variant']>],
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-aurora-300/35 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
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
    <div className={cn('px-6 md:px-7 pt-6 md:pt-7 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardBody({ className, children, ...rest }: CardSubProps) {
  return (
    <div className={cn('px-6 md:px-7 py-5', className)} {...rest}>
      {children}
    </div>
  );
}
export function CardFooter({ className, children, ...rest }: CardSubProps) {
  return (
    <div
      className={cn('px-6 md:px-7 py-4 border-t border-white/[0.09] bg-white/[0.02]', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
