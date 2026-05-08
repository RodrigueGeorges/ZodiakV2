import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Button — primitive aurora.
 *
 * Variants : `primary` (CTA), `secondary` (action douce), `ghost` (texte+border),
 * `danger` (rouge violet), `text` (uniquement texte).
 *
 * Tailles : `sm`, `md` (default), `lg`.
 *
 * `loading` : remplace le contenu par un spinner aurora et désactive le clic.
 * `iconLeft`/`iconRight` : icônes lucide (passées comme nodes).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-aurora-500 text-ivory-50 hover:bg-aurora-400 active:bg-aurora-600 shadow-glow-aurora',
  secondary:
    'bg-ivory-50/[0.06] text-ivory-50 hover:bg-ivory-50/[0.1] border border-ivory-50/10',
  ghost:
    'bg-transparent text-ivory-100 hover:bg-ivory-50/[0.06] border border-ivory-50/15',
  danger:
    'bg-magenta-500/15 text-magenta-400 hover:bg-magenta-500/25 border border-magenta-500/40',
  text: 'bg-transparent text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-caption gap-1.5',
  md: 'h-11 px-6 text-body gap-2',
  lg: 'h-12 px-8 text-body-lg gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading,
    fullWidth,
    iconLeft,
    iconRight,
    disabled,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </motion.button>
  );
});

export default Button;
