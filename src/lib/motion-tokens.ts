/**
 * Jetons motion partagés (Framer Motion, CSS, motion design).
 * Même easing que Tailwind `ease-ritual` pour cohérence perception.
 */
export const EASE_RITUAL = [0.22, 1, 0.36, 1] as const;

export const DURATION_MS = {
  xs: 0.15,
  sm: 0.35,
  md: 0.55,
  lg: 0.85,
  xl: 1.05,
} as const;
