import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Button v3 — primitive éditoriale "Cosmic Editorial Ritual".
 * Variantes typées avec `class-variance-authority` (patron shadcn / design system).
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'text'
  | 'ritual'
  | 'cosmic';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center rounded-full font-medium tracking-wide overflow-hidden',
    'transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-brutal',
    'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
    'disabled:opacity-40 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(135deg,#f8fdff_0%,#7dd3fc_42%,#0ea5e9_100%)] text-night-950 hover:shadow-[0_0_42px_-14px_rgba(56,189,248,0.95),inset_0_1px_0_rgba(255,255,255,0.72)] active:scale-[0.99] font-semibold tracking-tight shadow-[0_0_32px_-14px_rgba(56,189,248,0.75),inset_0_1px_0_rgba(255,255,255,0.55)] border border-aurora-100/60',
        secondary:
          'bg-aurora-500/[0.12] text-aurora-50 hover:bg-aurora-500/[0.18] border border-aurora-400/30 hover:border-aurora-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
        ghost:
          'bg-white/[0.035] text-aurora-100 border border-white/[0.10] hover:border-aurora-300/55 hover:bg-aurora-500/[0.08] hover:text-ivory-50 backdrop-blur-md',
        danger:
          'bg-transparent text-magenta-400 border border-magenta-500/30 hover:bg-magenta-500/10 hover:border-magenta-500/50',
        text:
          'bg-transparent text-aurora-400 hover:text-aurora-300 underline-offset-4 hover:underline border-0',
        ritual:
          'bg-[linear-gradient(135deg,#f8fdff_0%,#7dd3fc_42%,#0ea5e9_100%)] text-night-950 hover:shadow-[0_0_42px_-14px_rgba(56,189,248,0.95)] font-semibold tracking-tight shadow-[0_0_32px_-14px_rgba(56,189,248,0.75)] border border-aurora-100/60',
        cosmic:
          'bg-transparent text-ivory-50 border border-aurora-300/30 backdrop-blur-xl hover:border-aurora-300/60 hover:bg-aurora-500/[0.06] hover:shadow-[0_0_40px_-12px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.99] tracking-tight',
      },
      size: {
        sm: 'h-9  px-5 text-caption gap-1.5',
        md: 'h-12 px-7 text-body    gap-2',
        lg: 'h-14 px-9 text-body-lg gap-2.5',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'size'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    fullWidth,
    loading,
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
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
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
