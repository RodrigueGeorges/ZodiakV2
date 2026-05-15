import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Badge — pastille de status / catégorie / count.
 * Variants alignés sur la charte : neutral, aurora (accent), magenta (rituel),
 * amber (mantra), success, danger, premium.
 */
export const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]',
    'border rounded-full whitespace-nowrap',
    'transition-colors duration-200 ease-brutal',
  ],
  {
    variants: {
      variant: {
        neutral:
          'bg-white/[0.045] border-white/10 text-ivory-300',
        aurora:
          'bg-aurora-500/[0.12] border-aurora-400/35 text-aurora-200',
        magenta:
          'bg-magenta-500/[0.10] border-magenta-500/35 text-magenta-400',
        amber:
          'bg-amber-500/[0.10] border-amber-400/35 text-amber-300',
        success:
          'bg-aurora-300/[0.10] border-aurora-300/45 text-aurora-200',
        danger:
          'bg-magenta-600/[0.14] border-magenta-500/45 text-magenta-400',
        premium:
          'bg-[linear-gradient(135deg,rgba(125,211,252,0.18),rgba(56,189,248,0.10))] border-aurora-300/55 text-aurora-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]',
      },
      size: {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-[11px]',
        lg: 'h-7 px-3 text-caption',
      },
      dot: {
        true:  '',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      dot: false,
    },
  },
);

const dotColor: Record<NonNullable<VariantProps<typeof badgeVariants>['variant']>, string> = {
  neutral: 'bg-ivory-300',
  aurora:  'bg-aurora-300',
  magenta: 'bg-magenta-400',
  amber:   'bg-amber-300',
  success: 'bg-aurora-300',
  danger:  'bg-magenta-400',
  premium: 'bg-aurora-200',
};

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  iconLeft?: ReactNode;
  children?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant, size, dot, iconLeft, children, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, dot }), className)}
      {...rest}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('w-1.5 h-1.5 rounded-full', dotColor[variant ?? 'neutral'])}
        />
      )}
      {iconLeft}
      {children}
    </span>
  );
});

export default Badge;
