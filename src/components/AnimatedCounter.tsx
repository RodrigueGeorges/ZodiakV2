import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  /** Nombre de décimales (0 par défaut). */
  decimals?: number;
  className?: string;
  /** Suffixe (ex: "/100", "%"). */
  suffix?: string;
  /** Délai de démarrage en secondes. */
  delay?: number;
  /** Spring stiffness — plus haut = plus rapide. */
  stiffness?: number;
  /** Spring damping. */
  damping?: number;
  ariaLabel?: string;
}

/**
 * Compteur animé physique : le chiffre monte de 0 à `value` avec un ressort.
 *
 * Usage : score synastrie, streak count, intensité guidance, etc. C'est un
 * détail mais ça change tout au feeling.
 */
export default function AnimatedCounter({
  value,
  decimals = 0,
  className,
  suffix,
  delay = 0,
  stiffness = 80,
  damping = 18,
  ariaLabel,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness, damping });
  const display = useTransform(spring, (latest) => {
    return latest.toFixed(decimals) + (suffix ?? '');
  });

  useEffect(() => {
    const t = window.setTimeout(() => {
      motionValue.set(value);
    }, delay * 1000);
    return () => window.clearTimeout(t);
  }, [value, delay, motionValue]);

  return (
    <motion.span
      className={className}
      aria-label={ariaLabel ?? `${value}${suffix ?? ''}`}
    >
      {display}
    </motion.span>
  );
}
