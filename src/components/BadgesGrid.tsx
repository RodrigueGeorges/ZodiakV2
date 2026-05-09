import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { BADGES, badgeToneClasses, BadgeDef } from '../lib/badges';
import { cn } from '../lib/utils';
import type { UserBadge } from '../lib/types/supabase';

interface BadgesGridProps {
  earned: UserBadge[];
  className?: string;
}

/**
 * Grille des badges silencieux. Les non-gagnés apparaissent en sépia
 * estompé (incite à les découvrir) — pas de spoiler agressif.
 */
export default function BadgesGrid({ earned, className }: BadgesGridProps) {
  const earnedById = useMemo(
    () => new Map(earned.map((b) => [b.badge_id, b])),
    [earned]
  );

  return (
    <Card variant="elevated" className={cn('relative overflow-hidden', className)}>
      <div className="relative p-7 md:p-10">
        <div className="mb-7 text-center">
          <p className="eyebrow-ritual text-aurora-400/80 mb-3">
            Marqueurs cosmiques
          </p>
          <h3 className="font-serif text-h1 text-ivory-50 leading-tight">
            <span className="text-aurora-400">{earned.length}</span>
            <span className="text-ivory-400/60"> / {BADGES.length}</span>
          </h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {BADGES.map((b, i) => {
            const got = earnedById.has(b.id);
            return <BadgeTile key={b.id} badge={b} got={got} index={i} />;
          })}
        </div>
      </div>
    </Card>
  );
}

interface TileProps {
  badge: BadgeDef;
  got: boolean;
  index: number;
}
function BadgeTile({ badge, got, index }: TileProps) {
  const tone = badgeToneClasses[badge.tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'relative aspect-square rounded-md flex flex-col items-center justify-center gap-2 border backdrop-blur-md',
        got
          ? `${tone.bg} ${tone.ring}`
          : 'bg-night-900/40 border-ivory-50/[0.06] grayscale opacity-40',
      )}
      title={got ? `${badge.name} — ${badge.description}` : '— Marqueur à découvrir —'}
    >
      <span
        className={cn('text-3xl', got ? tone.text : 'text-ivory-400')}
        aria-hidden="true"
      >
        {badge.glyph}
      </span>
      <span
        className={cn(
          'px-1 text-center text-micro leading-tight font-serif',
          got ? 'text-ivory-50' : 'text-ivory-400/60',
        )}
      >
        {got ? badge.name : '—'}
      </span>
    </motion.div>
  );
}
