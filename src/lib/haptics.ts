/**
 * Haptic feedback minimaliste basé sur la Web Vibration API.
 *
 *  - Sur iOS Safari, l'API n'est pas dispo → no-op silencieux.
 *  - Sur Android & PWA installée, ça marche pour les taps clés (nav, success).
 *  - On respecte `prefers-reduced-motion` (un user qui veut moins d'animation
 *    veut probablement aussi moins de vibration).
 *
 * Patterns courants :
 *  - 'tap'      : 8ms — pression bouton
 *  - 'success'  : [10, 40, 10] — validation positive
 *  - 'warning'  : [30, 60, 30] — attention
 *  - 'streak'   : [12, 30, 12, 30, 12] — flamme +1
 */

type HapticPattern = 'tap' | 'success' | 'warning' | 'streak' | number | number[];

const PATTERNS: Record<Exclude<HapticPattern, number | number[]>, number | number[]> = {
  tap: 8,
  success: [10, 40, 10],
  warning: [30, 60, 30],
  streak: [12, 30, 12, 30, 18],
};

let lastVibrate = 0;
const THROTTLE_MS = 60;

export function vibrate(pattern: HapticPattern = 'tap'): void {
  if (typeof window === 'undefined') return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  // Respecte le réglage utilisateur global (prefers-reduced-motion).
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  const now = Date.now();
  if (now - lastVibrate < THROTTLE_MS) return;
  lastVibrate = now;

  const resolved =
    typeof pattern === 'number' || Array.isArray(pattern)
      ? pattern
      : PATTERNS[pattern];
  try {
    navigator.vibrate(resolved as number | number[]);
  } catch {
    /* ignore */
  }
}

export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}
