import {
  cloneElement,
  FocusEvent as ReactFocusEvent,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  useId,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * Tooltip — primitive légère (hover + focus). Pas de portail ni de positionnement
 * intelligent : la tooltip s'affiche à `placement` fixe par rapport au trigger.
 *
 * Si tu as besoin de "smart positioning" (flip, shift), migre vers @floating-ui.
 *
 * Pattern :
 *   <Tooltip content="Explication courte">
 *     <button>Icône</button>
 *   </Tooltip>
 */
export interface TooltipProps {
  content: ReactNode;
  /** Délai avant ouverture (ms). */
  openDelay?: number;
  /** Délai avant fermeture (ms). */
  closeDelay?: number;
  /** Placement de la bulle. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Trigger (doit accepter ref + handlers). */
  children: ReactElement;
  /** Si true, désactive la tooltip (utile pour mobile). */
  disabled?: boolean;
  className?: string;
}

const placementStyles: Record<NonNullable<TooltipProps['placement']>, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

const placementOrigin: Record<NonNullable<TooltipProps['placement']>, string> = {
  top:    'origin-bottom',
  bottom: 'origin-top',
  left:   'origin-right',
  right:  'origin-left',
};

export function Tooltip({
  content,
  openDelay = 250,
  closeDelay = 80,
  placement = 'top',
  children,
  disabled,
  className,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);

  const clearTimers = () => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleOpen = () => {
    if (disabled) return;
    clearTimers();
    openTimer.current = window.setTimeout(() => setOpen(true), openDelay);
  };

  const handleClose = () => {
    clearTimers();
    closeTimer.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  // On clone le trigger pour injecter les handlers + aria-describedby.
  const trigger = cloneElement(children, {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: (e: ReactMouseEvent) => {
      handleOpen();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: ReactMouseEvent) => {
      handleClose();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: ReactFocusEvent) => {
      handleOpen();
      children.props.onFocus?.(e);
    },
    onBlur: (e: ReactFocusEvent) => {
      handleClose();
      children.props.onBlur?.(e);
    },
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute z-50 pointer-events-none',
              'px-2.5 py-1.5 rounded-lg whitespace-nowrap',
              'bg-night-900/95 border border-white/[0.12] backdrop-blur-md',
              'text-caption text-ivory-100 font-mono tracking-tight',
              'shadow-[0_8px_24px_-12px_rgba(0,0,0,0.7)]',
              placementStyles[placement],
              placementOrigin[placement],
              className,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
