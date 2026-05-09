import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '../lib/utils';

interface LiveCounterProps {
  /** Valeur "ancrée" (déterministe selon la date) — base autour de laquelle on
   *  bouge légèrement pour donner l'impression du "en direct". */
  baseValue?: number;
  /** Préfixe affiché (ex. "Déjà"). */
  prefix?: string;
  /** Suffixe (ex. "cartes lues ce matin"). */
  suffix?: string;
  className?: string;
}

/**
 * Compteur "social proof" qui simule de l'activité en temps réel.
 *
 * Implémentation : la valeur de base est déterministe (jour de l'année + base)
 * pour ne pas avoir une valeur qui chute brusquement à minuit. Toutes les
 * 4–10 secondes, on incrémente subtilement. Idéal pour la landing page,
 * juste avant la pricing section.
 *
 * NOTE : ce n'est pas une vraie métrique — c'est de la dynamique visuelle.
 * Pour brancher de vraies données, expose un endpoint et utilise SWR.
 */
export default function LiveCounter({
  baseValue,
  prefix = 'Déjà',
  suffix = 'cartes lues ce matin',
  className,
}: LiveCounterProps) {
  const reduceMotion = useReducedMotion();

  // Base déterministe : croît doucement de jour en jour, ne saute pas.
  const computeBase = () => {
    if (typeof baseValue === 'number') return baseValue;
    const start = new Date('2025-01-01').getTime();
    const days = Math.floor((Date.now() - start) / 86_400_000);
    // Croissance ~ +37 par jour, départ à 1 200.
    return 1200 + days * 37;
  };

  const [value, setValue] = useState(() => computeBase());

  useEffect(() => {
    if (reduceMotion) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setValue((v) => v + Math.floor(Math.random() * 3) + 1);
      const delay = 4000 + Math.random() * 6000;
      setTimeout(tick, delay);
    };
    const id = setTimeout(tick, 3000);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'inline-flex items-center gap-3 rounded-md px-5 py-2.5',
        'bg-night-900/45 backdrop-blur border border-signal-600/20',
        'text-caption text-ivory-200',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative flex w-2 h-2"
      >
        <span className="absolute inset-0 rounded-full bg-aurora-400 opacity-80 animate-ping" />
        <span className="relative inline-flex rounded-full bg-aurora-400 w-2 h-2" />
      </span>
      <span>{prefix}</span>
      <AnimatedCounter
        value={value}
        className="text-ivory-50 font-medium tabular-nums"
        ariaLabel={`${value} ${suffix}`}
      />
      <span>{suffix}</span>
    </motion.div>
  );
}
