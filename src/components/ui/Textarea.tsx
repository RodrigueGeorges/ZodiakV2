import { forwardRef, ReactNode, TextareaHTMLAttributes, useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * Textarea — pendant d'Input pour les zones multi-lignes.
 * Même look & feel que Input (CVA partagé impossible car balises différentes).
 */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Compteur de caractères affiché si défini. */
  maxLength?: number;
}

const baseClasses =
  'appearance-none w-full text-ivory-50 placeholder:text-ivory-500/70 ' +
  'transition-[border-color,background-color,box-shadow] duration-300 ease-brutal ' +
  'focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ' +
  'border bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.035))] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_45px_-34px_rgba(0,0,0,0.9)] ' +
  'rounded-2xl px-4 py-3.5 text-body leading-relaxed resize-y min-h-[120px]';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, className, id, required, maxLength, value, ...rest },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const descriptionId = hint || error ? `${inputId}-desc` : undefined;
    const hasError = Boolean(error);
    const currentLength = typeof value === 'string' ? value.length : undefined;

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

        <textarea
          ref={ref}
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={descriptionId}
          aria-required={required || undefined}
          maxLength={maxLength}
          value={value}
          className={cn(
            baseClasses,
            hasError
              ? 'border-magenta-500/55 focus:border-magenta-400/80 focus:shadow-[0_0_0_1px_rgba(201,97,155,0.18),0_0_32px_-18px_rgba(201,97,155,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]'
              : 'border-white/10 focus:border-aurora-400/50 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.14),0_0_32px_-18px_rgba(56,189,248,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]',
            className,
          )}
          {...rest}
        />

        <div className="flex items-start justify-between gap-3">
          {(error || hint) && (
            <p
              id={descriptionId}
              className={cn(
                'text-caption flex-1',
                hasError ? 'text-magenta-400' : 'text-ivory-400',
              )}
            >
              {error ?? hint}
            </p>
          )}
          {maxLength && currentLength !== undefined && (
            <span className="text-caption text-ivory-500 font-mono tabular-nums">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

export default Textarea;
