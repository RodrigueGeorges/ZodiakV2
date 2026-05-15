import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBodyScrollLock, useFocusTrap } from '../../lib/hooks/useFocusTrap';
import { TRANSITION } from '../../lib/motion-tokens';

/**
 * Dialog — modal centrée, accessible (focus trap, escape, scroll lock,
 * aria-modal). Rendu via portail dans `document.body`.
 *
 * Pattern :
 *   <Dialog open={open} onOpenChange={setOpen} title="Confirmer">
 *     <p>Contenu…</p>
 *     <DialogFooter>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
 *       <Button onClick={onConfirm}>Valider</Button>
 *     </DialogFooter>
 *   </Dialog>
 *
 * Pour une couverture a11y complète (inert sur le reste du DOM, restoration
 * fine), migre vers @radix-ui/react-dialog plus tard — l'API est compatible.
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Titre obligatoire pour aria-labelledby. */
  title: ReactNode;
  /** Description optionnelle pour aria-describedby. */
  description?: ReactNode;
  children: ReactNode;
  /** Largeur max — defaults to "lg". */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Désactive la fermeture au click sur le backdrop. */
  preventBackdropClose?: boolean;
  /** Désactive la fermeture à Escape. */
  preventEscapeClose?: boolean;
  /** Masque le bouton X en haut à droite. */
  hideCloseButton?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'lg',
  preventBackdropClose,
  preventEscapeClose,
  hideCloseButton,
  className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);
  useBodyScrollLock(open);

  // Escape global
  useEffect(() => {
    if (!open || preventEscapeClose) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, preventEscapeClose, onOpenChange]);

  if (typeof document === 'undefined') return null;

  const handleBackdropClick = (e: ReactMouseEvent) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  const handlePanelKeyDown = (_e: KeyboardEvent<HTMLDivElement>) => {
    // Le focus trap interne gère Tab. On garde le handler pour extension.
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.ui}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            onKeyDown={handlePanelKeyDown}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={TRANSITION.springSoft}
            tabIndex={-1}
            className={cn(
              'relative w-full',
              sizeClasses[size],
              'rounded-3xl premium-surface premium-surface-elevated',
              'p-6 md:p-8 focus:outline-none',
              className,
            )}
          >
            <header className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h2
                  id={titleId}
                  className="font-display font-medium text-h2 text-ivory-50 leading-tight tracking-[-0.01em]"
                >
                  {title}
                </h2>
                {description && (
                  <p
                    id={descId}
                    className="mt-2 text-body text-ivory-300 leading-relaxed"
                  >
                    {description}
                  </p>
                )}
              </div>
              {!hideCloseButton && (
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Fermer"
                  className={cn(
                    'shrink-0 flex items-center justify-center w-9 h-9 rounded-full',
                    'text-ivory-400 hover:text-ivory-50 hover:bg-white/[0.06]',
                    'border border-white/[0.08] hover:border-white/[0.2]',
                    'transition-colors duration-200 ease-brutal',
                    'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
                  )}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </header>

            <div className="relative">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
  /** Alignement des boutons. Default = end. */
  align?: 'start' | 'center' | 'end' | 'between';
}

export function DialogFooter({
  children,
  className,
  align = 'end',
}: DialogFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 pt-5 border-t border-white/[0.08] flex flex-wrap items-center gap-3',
        align === 'start' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'end' && 'justify-end',
        align === 'between' && 'justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Dialog;
