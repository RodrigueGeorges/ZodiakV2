import { RefObject, useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Piège le focus à l'intérieur du container quand `active` est true.
 *
 * Comportement :
 *  - À l'ouverture, focus le premier élément focusable (ou le container si autoFocus=false).
 *  - Cycle le focus avec Tab / Shift+Tab.
 *  - Restaure le focus au trigger quand `active` repasse à false.
 *
 * Utilisé par Dialog et Sheet pour l'a11y baseline. Migre vers @radix-ui/react-dialog
 * pour une couverture complète (scroll lock, inert sur le reste de la page).
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T>,
  active: boolean,
  options: { autoFocus?: boolean; restoreFocus?: boolean } = {},
) {
  const { autoFocus = true, restoreFocus = true } = options;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('aria-hidden'),
      );

    if (autoFocus) {
      const focusables = getFocusables();
      const first = focusables[0] ?? container;
      // Léger délai pour laisser le DOM monter (motion enter).
      requestAnimationFrame(() => first.focus());
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;

      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (restoreFocus && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, autoFocus, restoreFocus, containerRef]);
}

/**
 * Verrouille le scroll du <body> tant que `active` est true.
 * À combiner avec useFocusTrap pour les modales/sheets.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
