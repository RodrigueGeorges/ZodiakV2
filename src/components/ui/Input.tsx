import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Input v1 — primitive éditoriale "Cosmic Editorial Ritual".
 *
 * Remplace l'usage global `.input-cosmic` par une primitive typée et
 * accessible (label associé, aria-invalid, aria-describedby).
 *
 * Variants :
 *  - state : default | error | success
 *  - size  : sm | md | lg
 */
export const inputVariants = cva(
  [
    'appearance-none w-full text-ivory-50 placeholder:text-ivory-500/70',
    'transition-[border-color,background-color,box-shadow] duration-300 ease-brutal',
    'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
    'border bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_45px_-34px_rgba(0,0,0,0.9)]',
  ],
  {
    variants: {
      state: {
        default:
          'border-white/10 focus:border-aurora-400/50 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_0_32px_-18px_rgba(56,189,248,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]',
        error:
          'border-magenta-500/55 focus:border-magenta-400/80 focus:shadow-[0_0_0_1px_rgba(201,97,155,0.18),0_0_32px_-18px_rgba(201,97,155,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]',
        success:
          'border-aurora-300/45 focus:border-aurora-300/75 focus:shadow-[0_0_0_1px_rgba(125,211,252,0.16),0_0_32px_-18px_rgba(125,211,252,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
      },
      size: {
        sm: 'h-10 px-3.5 text-caption rounded-xl',
        md: 'h-12 px-4 text-body rounded-2xl',
        lg: 'h-14 px-5 text-body-lg rounded-2xl',
      },
      hasIcon: {
        true:  '',
        false: '',
      },
    },
    compoundVariants: [
      { size: 'sm', hasIcon: true, class: 'pl-10' },
      { size: 'md', hasIcon: true, class: 'pl-12' },
      { size: 'lg', hasIcon: true, class: 'pl-14' },
    ],
    defaultVariants: {
      state: 'default',
      size: 'md',
      hasIcon: false,
    },
  },
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: ReactNode;
  /** Texte d'aide affiché sous le champ (gris). */
  hint?: ReactNode;
  /** Message d'erreur — force state="error" et l'attribut aria-invalid. */
  error?: ReactNode;
  /** Icône à gauche du champ. */
  iconLeft?: ReactNode;
  /** Slot droit (bouton clear, indicateur, etc.). */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    iconLeft,
    trailing,
    state,
    size,
    className,
    id,
    required,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = hint || error ? `${inputId}-desc` : undefined;
  const effectiveState = error ? 'error' : state ?? 'default';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-micro uppercase tracking-[0.22em] text-ivory-400"
        >
          {label}
          {required && <span aria-hidden="true" className="ml-1 text-magenta-400">*</span>}
        </label>
      )}

      <div className="relative">
        {iconLeft && (
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center text-ivory-400',
              size === 'sm' ? 'w-10' : size === 'lg' ? 'w-14' : 'w-12',
            )}
          >
            {iconLeft}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={descriptionId}
          aria-required={required || undefined}
          className={cn(
            inputVariants({ state: effectiveState, size, hasIcon: Boolean(iconLeft) }),
            trailing && (size === 'sm' ? 'pr-10' : size === 'lg' ? 'pr-14' : 'pr-12'),
            className,
          )}
          {...rest}
        />

        {trailing && (
          <span
            className={cn(
              'absolute inset-y-0 right-0 flex items-center justify-center text-ivory-400',
              size === 'sm' ? 'w-10' : size === 'lg' ? 'w-14' : 'w-12',
            )}
          >
            {trailing}
          </span>
        )}
      </div>

      {(error || hint) && (
        <p
          id={descriptionId}
          className={cn(
            'text-caption',
            error ? 'text-magenta-400' : 'text-ivory-400',
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});

export default Input;
