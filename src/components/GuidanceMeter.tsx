import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GuidanceMeterProps {
  score: number;
  className?: string;
  /** Couleur du remplissage : laisse `auto` pour suivre le score, ou force `aurora`. */
  tone?: 'auto' | 'aurora' | 'magenta' | 'amber';
  showLegend?: boolean;
}

/** Petit ARC qui sort un dégradé aurora au lieu d'une barre verte/orange/rouge. */
const toneGradient: Record<NonNullable<GuidanceMeterProps['tone']>, string> = {
  auto: '', // calculé dynamiquement
  aurora: 'from-aurora-400 via-aurora-300 to-magenta-400',
  magenta: 'from-magenta-500 via-magenta-400 to-amber-300',
  amber: 'from-amber-400 via-amber-300 to-aurora-300',
};

function getAutoTone(score: number) {
  if (score >= 75) return 'from-aurora-400 via-magenta-400 to-amber-300';
  if (score >= 50) return 'from-aurora-500 via-aurora-300 to-magenta-400';
  if (score >= 30) return 'from-aurora-600 via-aurora-400 to-magenta-500';
  return 'from-night-300 via-aurora-700 to-magenta-600';
}

export function GuidanceMeter({
  score,
  className,
  tone = 'auto',
  showLegend = false,
}: GuidanceMeterProps) {
  const pct = Math.min(Math.max(score, 0), 100);
  const gradientClass =
    tone === 'auto' ? getAutoTone(pct) : toneGradient[tone];

  return (
    <div className={cn('w-full', className)} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-night-700/80">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r',
            gradientClass
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {showLegend && (
        <div className="mt-2 flex justify-between text-micro uppercase tracking-widest text-ivory-400">
          <span>Faible</span>
          <span>Élevé</span>
        </div>
      )}
    </div>
  );
}

export default GuidanceMeter;
