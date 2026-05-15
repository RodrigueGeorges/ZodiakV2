import { forwardRef, ReactNode, useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { TRANSITION } from '../../lib/motion-tokens';

/**
 * Switch — toggle on/off accessible (role="switch" + aria-checked).
 * Pattern contrôlé : passe `checked` + `onCheckedChange`.
 *
 * Pour intégration formulaires natifs, expose aussi `name` qui crée un
 * input[type=hidden] miroir.
 */
export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  /** Label visible à gauche du switch. */
  label?: ReactNode;
  /** Description sous le label. */
  description?: ReactNode;
  /** Nom du champ pour soumission formulaire (génère input caché). */
  name?: string;
  /** Identifiant explicite pour le contrôle. */
  id?: string;
  /** Taille (sm = 36×20, md = 44×24). */
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    onCheckedChange,
    disabled,
    label,
    description,
    name,
    id,
    size = 'md',
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;

  const trackSizes =
    size === 'sm'
      ? 'w-9 h-5'
      : 'w-11 h-6';
  const thumbSize =
    size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const thumbOffsetActive =
    size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  const handleToggle = () => {
    if (disabled) return;
    onCheckedChange(!checked);
  };

  const toggle = (
    <button
      ref={ref}
      type="button"
      role="switch"
      id={inputId}
      aria-checked={checked}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
      aria-describedby={descId}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-300 ease-brutal',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        trackSizes,
        checked
          ? 'bg-aurora-500/60 border border-aurora-300/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_24px_-12px_rgba(56,189,248,0.85)]'
          : 'bg-white/[0.06] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
      )}
    >
      <motion.span
        aria-hidden="true"
        layout
        transition={TRANSITION.spring}
        className={cn(
          'absolute left-0.5 rounded-full bg-ivory-50 shadow-[0_2px_4px_rgba(0,0,0,0.4)]',
          thumbSize,
          checked && thumbOffsetActive,
        )}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={checked ? 'on' : 'off'}
        />
      )}
    </button>
  );

  if (!label && !description) {
    return <span className={className}>{toggle}</span>;
  }

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex items-start gap-4 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <span className="block text-body text-ivory-100 font-medium">
            {label}
          </span>
        )}
        {description && (
          <span id={descId} className="block text-caption text-ivory-400 mt-1">
            {description}
          </span>
        )}
      </div>
      {toggle}
    </label>
  );
});

export default Switch;
