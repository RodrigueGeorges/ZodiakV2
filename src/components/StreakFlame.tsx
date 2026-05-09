import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface StreakFlameProps {
  count: number;
  best?: number;
  willBreakSoon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulsing?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { wrap: 'h-9 px-4 gap-2',   icon: 'w-3.5 h-3.5', count: 'text-caption' },
  md: { wrap: 'h-11 px-5 gap-2.5', icon: 'w-4 h-4',     count: 'text-body font-semibold' },
  lg: { wrap: 'h-14 px-6 gap-3',  icon: 'w-5 h-5',     count: 'text-h3 font-serif' },
} as const;

/**
 * Flamme cosmique : la "preuve sociale interne" de l'engagement quotidien.
 *
 *  - Couleur dégradée selon le streak (more days → magenta intense + amber glow).
 *  - Pulse léger si pulsing=true (à utiliser quand on vient de check-in).
 *  - "willBreakSoon" → flamme grise/blanche pour signaler le risque.
 */
export default function StreakFlame({
  count,
  best,
  willBreakSoon,
  size = 'md',
  showLabel = true,
  pulsing,
  className,
}: StreakFlameProps) {
  const sizes = sizeMap[size];

  const tone = useMemo(() => {
    if (willBreakSoon) {
      return {
        bg: 'bg-night-900/40 border-ivory-50/[0.08] text-ivory-300',
        flame: 'text-ivory-400',
        glow: '',
      };
    }
    if (count >= 30) {
      return {
        bg: 'bg-aurora-400/10 border-aurora-400/40 text-ivory-50',
        flame: 'text-aurora-300',
        glow: 'shadow-glow-aurora',
      };
    }
    if (count >= 7) {
      return {
        bg: 'bg-aurora-400/8 border-aurora-400/30 text-ivory-50',
        flame: 'text-aurora-400',
        glow: '',
      };
    }
    if (count >= 1) {
      return {
        bg: 'bg-night-900/40 border-aurora-400/20 text-ivory-100',
        flame: 'text-aurora-400',
        glow: '',
      };
    }
    return {
      bg: 'bg-night-900/40 border-ivory-50/[0.06] text-ivory-300',
      flame: 'text-ivory-400',
      glow: '',
    };
  }, [count, willBreakSoon]);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-md',
        tone.bg,
        tone.glow,
        sizes.wrap,
        className
      )}
      title={
        best
          ? `Flamme actuelle : ${count} jours · record : ${best}`
          : `Flamme : ${count} jours`
      }
      aria-label={`Flamme cosmique de ${count} jours consécutifs`}
    >
      <motion.span
        animate={
          pulsing
            ? { scale: [1, 1.18, 1], rotate: [0, -4, 4, 0] }
            : count > 0 && !willBreakSoon
            ? { y: [0, -1.5, 0] }
            : {}
        }
        transition={{
          duration: pulsing ? 1.1 : 2.4,
          repeat: pulsing ? 2 : Infinity,
          ease: 'easeInOut',
        }}
        className={cn('flex items-center justify-center', tone.flame)}
        aria-hidden="true"
      >
        {count >= 30 ? <Sparkles className={sizes.icon} /> : <Flame className={sizes.icon} />}
      </motion.span>
      <span className={cn('tabular-nums', sizes.count)}>{count}</span>
      {showLabel && (
        <span className="eyebrow-ritual text-ivory-400/80 hidden sm:inline">
          {willBreakSoon ? 'Reviens' : count <= 1 ? 'jour' : 'jours'}
        </span>
      )}
    </motion.span>
  );
}
