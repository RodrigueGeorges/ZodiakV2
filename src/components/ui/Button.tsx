import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Button v3 — primitive éditoriale "Cosmic Editorial Ritual".
 *
 * Variants :
 *  - `primary` : fond or alchimique, texte encre profonde (CTA principal)
 *  - `secondary` : ivoire transparent, bordure subtile
 *  - `ghost` : juste une bordure or qui s'illumine au hover
 *  - `danger` : magenta cosmique restreint (destructive only)
 *  - `text` : lien typographique simple
 *  - `ritual` : variante rituelle, fond ivoire papier sur encre (rare)
 *
 * Refonte :
 *   - Plus de shadow-glow par défaut
 *   - Le "primary" passe du violet au or (avec texte foncé pour contraste)
 *   - Tracking adouci, transition plus lente (ease-out 500ms)
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'text'
  | 'ritual';
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
    'bg-aurora-400 text-night-950 hover:bg-aurora-300 active:bg-aurora-500 font-semibold',
  secondary:
    'bg-ivory-50/[0.04] text-ivory-50 hover:bg-ivory-50/[0.08] border border-ivory-50/[0.10]',
  ghost:
    'bg-transparent text-ivory-100 border border-ivory-50/[0.18] hover:border-aurora-400/50 hover:text-aurora-300',
  danger:
    'bg-transparent text-magenta-400 border border-magenta-500/30 hover:bg-magenta-500/10 hover:border-magenta-500/50',
  text:
    'bg-transparent text-aurora-400 hover:text-aurora-300 underline-offset-4 hover:underline',
  ritual:
    'bg-ivory-50 text-night-950 hover:bg-ivory-100 active:bg-ivory-200 font-semibold',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9  px-5 text-caption gap-1.5',
  md: 'h-11 px-7 text-body    gap-2',
  lg: 'h-13 px-9 text-body-lg gap-2.5',
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
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        // Note : on n'utilise plus rounded-full systématiquement.
        // Boutons éditoriaux = rounded-full pour les CTA, mais on garde la liberté.
        'relative inline-flex items-center justify-center rounded-full font-medium tracking-wide transition-colors duration-300',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-300 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className,
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
