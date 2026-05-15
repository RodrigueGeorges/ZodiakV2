import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useBodyScrollLock, useFocusTrap } from '../../lib/hooks/useFocusTrap';
import { TRANSITION } from '../../lib/motion-tokens';

/**
 * Sheet — drawer ancré sur un bord. Pattern 2026 pour actions mobiles
 * (au lieu de Modal centré qui casse les pouces).
 *
 *  - side="bottom" → bottom sheet mobile (par défaut)
 *  - side="right"  → side drawer desktop
 *  - side="left"   → menu latéral
 *
 * Accessibilité : focus trap + escape + scroll lock + role="dialog".
 * Bottom sheet : drag-to-close avec framer-motion drag.
 */
export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: 'bottom' | 'right' | 'left';
  /** Désactive la fermeture au click sur backdrop. */
  preventBackdropClose?: boolean;
  /** Désactive le drag-to-close (bottom uniquement). */
  preventDragClose?: boolean;
  className?: string;
}

const sideAnimation = {
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit:    { y: '100%' },
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit:    { x: '100%' },
  },
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit:    { x: '-100%' },
  },
};

const sideClasses: Record<NonNullable<SheetProps['side']>, string> = {
  bottom:
    'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[28px] border-t border-white/[0.12] pb-[max(env(safe-area-inset-bottom),1rem)]',
  right:
    'inset-y-0 right-0 w-full max-w-md sm:max-w-lg border-l border-white/[0.12]',
  left:
    'inset-y-0 left-0 w-full max-w-md sm:max-w-lg border-r border-white/[0.12]',
};

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'bottom',
  preventBackdropClose,
  preventDragClose,
  className,
}: SheetProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  if (typeof document === 'undefined') return null;

  const isBottom = side === 'bottom';

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]" aria-hidden={!open}>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.ui}
            onClick={() => !preventBackdropClose && onOpenChange(false)}
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={sideAnimation[side].initial}
            animate={sideAnimation[side].animate}
            exit={sideAnimation[side].exit}
            transition={TRANSITION.springSoft}
            drag={isBottom && !preventDragClose ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_: unknown, info: PanInfo) => {
              if (!isBottom || preventDragClose) return;
              if (info.offset.y > 120 || info.velocity.y > 600) {
                onOpenChange(false);
              }
            }}
            className={cn(
              'absolute flex flex-col',
              'premium-surface premium-surface-elevated',
              'focus:outline-none',
              sideClasses[side],
              className,
            )}
          >
            {isBottom && (
              <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
                <span className="block w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {(title || description) && (
              <header className="px-6 pt-5 pb-3">
                {title && (
                  <h2
                    id={titleId}
                    className="font-display font-medium text-h2 text-ivory-50 leading-tight"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    className="mt-2 text-body text-ivory-300 leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </header>
            )}

            <div className="relative flex-1 overflow-y-auto px-6 pb-6 pt-2 scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Sheet;
