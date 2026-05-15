/**
 * Jetons motion partagés (Framer Motion, CSS, motion design).
 * Même easing que Tailwind `ease-ritual` pour cohérence perception.
 *
 * Source de vérité unique : importer d'ici plutôt que de hardcoder
 * `[0.22, 1, 0.36, 1]` ou `duration: 0.65` dans chaque composant.
 */

import type { Transition, Variants } from 'framer-motion';

export const EASE_RITUAL = [0.22, 1, 0.36, 1] as const;
export const EASE_BRUTAL = [0.16, 1, 0.3, 1] as const;

export const DURATION_MS = {
  xs: 0.15,
  sm: 0.35,
  md: 0.55,
  lg: 0.85,
  xl: 1.05,
} as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Transitions
 * ────────────────────────────────────────────────────────────────────────── */

export const TRANSITION = {
  /** Effets UI rapides (hover, tap). */
  ui:    { duration: DURATION_MS.xs, ease: EASE_BRUTAL } as Transition,
  /** Apparition standard (cards, sections). */
  enter: { duration: DURATION_MS.md, ease: EASE_RITUAL } as Transition,
  /** Apparition rituelle (hero, titres éditoriaux). */
  ritual: { duration: DURATION_MS.lg, ease: EASE_RITUAL } as Transition,
  /** Spring premium (toggles, pills, layoutId). */
  spring: { type: 'spring', stiffness: 380, damping: 32 } as Transition,
  /** Spring doux (drawer, sheet, modal). */
  springSoft: { type: 'spring', stiffness: 260, damping: 28 } as Transition,
} as const;

/* ──────────────────────────────────────────────────────────────────────────
 * Variants Framer Motion réutilisables
 *
 * Usage type :
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible" />
 * ────────────────────────────────────────────────────────────────────────── */

/** Fade simple (opacity uniquement — safe pour layouts complexes). */
export const fade: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION.enter },
  exit:    { opacity: 0, transition: TRANSITION.ui },
};

/** Fade + translation verticale (entrée standard d'une section). */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.enter },
  exit:    { opacity: 0, y: -8, transition: TRANSITION.ui },
};

/** Fade + translation plus marquée (hero, splash). */
export const fadeUpHero: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.ritual },
};

/** Scale subtle (cards, modals). */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: TRANSITION.enter },
  exit:    { opacity: 0, scale: 0.98, transition: TRANSITION.ui },
};

/** Slide bottom→up (bottom sheet, mobile drawer). */
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: TRANSITION.springSoft },
  exit:    { opacity: 0, y: '100%', transition: TRANSITION.ui },
};

/** Slide depuis la droite (side drawer desktop). */
export const slideRight: Variants = {
  hidden:  { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: TRANSITION.enter },
  exit:    { opacity: 0, x: 24, transition: TRANSITION.ui },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Stagger (containers qui révèlent leurs enfants en cascade)
 * ────────────────────────────────────────────────────────────────────────── */

export const staggerContainer = (delayChildren = 0.1, stagger = 0.06): Variants => ({
  hidden:  {},
  visible: {
    transition: {
      delayChildren,
      staggerChildren: stagger,
    },
  },
});

/** Item à utiliser à l'intérieur d'un staggerContainer. */
export const staggerItem: Variants = fadeUp;

/* ──────────────────────────────────────────────────────────────────────────
 * Page transitions (App.tsx AnimatedRoutes)
 * ────────────────────────────────────────────────────────────────────────── */

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION_MS.sm, ease: EASE_RITUAL } },
  exit:    { opacity: 0, transition: { duration: DURATION_MS.xs, ease: EASE_BRUTAL } },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Gestures
 * ────────────────────────────────────────────────────────────────────────── */

export const TAP_SCALE = 0.97;
export const HOVER_LIFT = -2;
