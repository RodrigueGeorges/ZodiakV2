import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GuidanceScoreBadgeProps {
  score: number;
  className?: string;
}

/**
 * Badge score aurora — toujours dans la palette de la DA, jamais
 * vert/orange/rouge. La nuance est portée par l'intensité (full ↔ tamisée).
 */
export function GuidanceScoreBadge({ score, className }: GuidanceScoreBadgeProps) {
  const pct = Math.min(Math.max(score, 0), 100);

  // 4 paliers, tous dans la palette aurora/magenta/amber
  let toneClass: string;
  let label: string;
  if (pct >= 75) {
    toneClass = 'bg-aurora-500/15 text-aurora-200 ring-aurora-400/30';
    label = 'Rayonnant';
  } else if (pct >= 50) {
    toneClass = 'bg-magenta-500/15 text-magenta-300 ring-magenta-500/30';
    label = 'Vibrant';
  } else if (pct >= 25) {
    toneClass = 'bg-amber-400/15 text-amber-300 ring-amber-400/30';
    label = 'Doux';
  } else {
    toneClass = 'bg-night-700/70 text-ivory-300 ring-ivory-200/15';
    label = 'Recueilli';
  }

  return (
    <motion.span
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-micro uppercase tracking-[0.14em] ring-1',
        toneClass,
        className
      )}
      title={`Intensité ${pct}%`}
    >
      <span className="text-caption font-semibold tracking-normal normal-case">
        {pct}
      </span>
      <span aria-hidden="true" className="text-ivory-400/40">·</span>
      <span>{label}</span>
    </motion.span>
  );
}

export default GuidanceScoreBadge;
