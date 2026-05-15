import {
  createContext,
  KeyboardEvent,
  ReactNode,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { TRANSITION } from '../../lib/motion-tokens';

/**
 * Tabs — primitive headless inspirée de Radix.
 *
 * Pattern :
 *   <Tabs defaultValue="natal">
 *     <TabsList>
 *       <TabsTrigger value="natal">Natal</TabsTrigger>
 *       <TabsTrigger value="transit">Transits</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="natal">…</TabsContent>
 *     <TabsContent value="transit">…</TabsContent>
 *   </Tabs>
 *
 * Accessibilité :
 *  - role="tablist" / "tab" / "tabpanel" + aria-selected, aria-controls
 *  - navigation clavier ←/→ pour basculer entre triggers
 *  - Home / End pour aller au premier/dernier
 */

interface TabsContextValue {
  value: string;
  setValue: (next: string) => void;
  registerTrigger: (value: string, el: HTMLButtonElement | null) => void;
  focusNext: (currentValue: string, direction: 1 | -1) => void;
  focusEdge: (edge: 'first' | 'last') => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs sub-components must be used inside <Tabs>');
  return ctx;
}

interface TabsProps {
  /** Valeur initiale (uncontrolled). */
  defaultValue?: string;
  /** Valeur contrôlée. */
  value?: string;
  /** Callback lorsqu'une autre tab est sélectionnée. */
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const triggersRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) setInternalValue(next);
    onValueChange?.(next);
  };

  const registerTrigger = (val: string, el: HTMLButtonElement | null) => {
    if (el) triggersRef.current.set(val, el);
    else triggersRef.current.delete(val);
  };

  const focusNext = (currentValue: string, direction: 1 | -1) => {
    const values = Array.from(triggersRef.current.keys());
    const idx = values.indexOf(currentValue);
    if (idx === -1) return;
    const nextIdx = (idx + direction + values.length) % values.length;
    const nextVal = values[nextIdx];
    const el = triggersRef.current.get(nextVal);
    el?.focus();
    setValue(nextVal);
  };

  const focusEdge = (edge: 'first' | 'last') => {
    const values = Array.from(triggersRef.current.keys());
    if (values.length === 0) return;
    const target = edge === 'first' ? values[0] : values[values.length - 1];
    const el = triggersRef.current.get(target);
    el?.focus();
    setValue(target);
  };

  const ctx = useMemo<TabsContextValue>(
    () => ({ value, setValue, registerTrigger, focusNext, focusEdge, baseId }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className} data-tabs-root>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
  /** Variante d'apparence. */
  variant?: 'pill' | 'underline';
  'aria-label'?: string;
}

export function TabsList({
  children,
  className,
  variant = 'pill',
  'aria-label': ariaLabel,
}: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        variant === 'pill' &&
          'inline-flex items-center gap-1 p-1.5 rounded-full bg-black/55 border border-white/[0.1] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        variant === 'underline' &&
          'flex items-center gap-6 border-b border-white/[0.1]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: TabsTriggerProps) {
  const { value: active, setValue, registerTrigger, focusNext, focusEdge, baseId } =
    useTabsContext();
  const isActive = active === value;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusNext(value, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusNext(value, -1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusEdge('first');
    } else if (e.key === 'End') {
      e.preventDefault();
      focusEdge('last');
    }
  };

  return (
    <button
      ref={(el) => registerTrigger(value, el)}
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 px-4 py-2 text-caption font-medium',
        'transition-colors duration-200 ease-brutal',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive ? 'text-ivory-50' : 'text-ivory-400 hover:text-ivory-100',
        className,
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`tabs-pill-${baseId}`}
          transition={TRANSITION.spring}
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-aurora-400/12 border border-aurora-400/35"
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  /** Si true, garde monté même quand inactif (utile pour formulaires). */
  keepMounted?: boolean;
}

export function TabsContent({
  value,
  children,
  className,
  keepMounted = false,
}: TabsContentProps) {
  const { value: active, baseId } = useTabsContext();
  const isActive = active === value;

  if (!isActive && !keepMounted) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      hidden={!isActive}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </div>
  );
}
