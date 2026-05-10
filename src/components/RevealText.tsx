import { useEffect, useRef, useState, ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';

interface RevealTextProps {
  /** Contenu à révéler (string ou éléments inline). */
  children: ReactNode;
  /** Délai avant de révéler (ms). Défaut: 0. */
  delay?: number;
  /** Si true, déclenche au mount (sinon, observer scroll). */
  immediate?: boolean;
  /** Classe CSS additionnelle sur le wrapper. */
  className?: string;
  /** Marge IntersectionObserver. */
  rootMargin?: string;
  /** Tag HTML du wrapper. Défaut: span. */
  as?: 'span' | 'div';
}

/**
 * RevealText — masque vertical révélateur "cinéma" pour les titres.
 *
 * Le contenu est wrappé dans un span overflow-hidden, et l'inner span
 * démarre à translateY(110%) puis monte à 0% sur 1.1s avec ease-out
 * cubic-bezier(0.22, 1, 0.36, 1).
 *
 * Inspiration : Vercel, Linear, Mubi, Awwwards. Beaucoup plus impactant
 * qu'un fade + y traditionnel — le texte SE LÈVE comme un rideau.
 *
 * Usage typique :
 *   <h1 className="font-display text-display-xl">
 *     <RevealText>Ton ciel,</RevealText>
 *     <RevealText delay={250}>chaque matin.</RevealText>
 *   </h1>
 *
 * Notes :
 *   - Respecte prefers-reduced-motion (fade simple).
 *   - Une seule animation par instance (pas de re-trigger).
 */
export default function RevealText({
  children,
  delay = 0,
  immediate = false,
  className,
  rootMargin = '-80px',
  as: Tag = 'span',
}: RevealTextProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;

    if (reduced) {
      const t = setTimeout(() => setRevealed(true), delay);
      return () => clearTimeout(t);
    }

    if (immediate) {
      const t = setTimeout(() => setRevealed(true), delay);
      return () => clearTimeout(t);
    }

    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setTimeout(() => setRevealed(true), delay);
          io.disconnect();
        }
      },
      { rootMargin, threshold: 0.1 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [delay, immediate, reduced, rootMargin, revealed]);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
      className={cn('reveal-mask', revealed && 'reveal-in', className)}
    >
      <span className="reveal-mask__inner">{children}</span>
    </Tag>
  );
}
