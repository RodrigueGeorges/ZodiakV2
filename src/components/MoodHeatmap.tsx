import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import type { MoodKey, MoodLog } from '../lib/types/supabase';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface MoodHeatmapProps {
  history: MoodLog[];
  /** Nombre de jours à afficher (par défaut 30). */
  days?: number;
  /** Affiche un en-tête avec titre + sous-titre. */
  withHeader?: boolean;
  className?: string;
}

const MOOD_META: Record<
  MoodKey,
  { emoji: string; label: string; bg: string; ring: string }
> = {
  radiant: {
    emoji: '☀️',
    label: 'Radieux',
    bg: 'bg-amber-500/35',
    ring: 'ring-amber-300/60',
  },
  inspired: {
    emoji: '✨',
    label: 'Inspiré',
    bg: 'bg-aurora-500/40',
    ring: 'ring-aurora-300/60',
  },
  calm: {
    emoji: '🌊',
    label: 'Apaisé',
    bg: 'bg-aurora-400/25',
    ring: 'ring-aurora-200/40',
  },
  pensive: {
    emoji: '🌙',
    label: 'Pensif',
    bg: 'bg-night-600/60',
    ring: 'ring-night-500/40',
  },
  tense: {
    emoji: '⚡',
    label: 'Tendu',
    bg: 'bg-magenta-500/35',
    ring: 'ring-magenta-300/60',
  },
  tired: {
    emoji: '🌫️',
    label: 'Fatigué',
    bg: 'bg-night-700/70',
    ring: 'ring-night-600/40',
  },
};

/**
 * MoodHeatmap — visualisation des humeurs des N derniers jours.
 *
 * Une case par jour, colorée selon le mood loggé (ou neutre si aucun).
 * Permet à l'utilisateur de voir ses cycles émotionnels d'un coup d'œil
 * — très introspectif, très collant.
 */
export default function MoodHeatmap({
  history,
  days = 30,
  withHeader = true,
  className,
}: MoodHeatmapProps) {
  const grid = useMemo(() => {
    const map = new Map<string, MoodLog>();
    for (const log of history) {
      if (log?.date) map.set(log.date, log);
    }
    const out: { date: string; mood: MoodKey | null; intensity: number }[] = [];
    const today = DateTime.now().startOf('day');
    for (let i = days - 1; i >= 0; i--) {
      const d = today.minus({ days: i });
      const iso = d.toISODate()!;
      const log = map.get(iso) ?? null;
      out.push({
        date: iso,
        mood: (log?.mood as MoodKey) ?? null,
        intensity: log?.intensity ?? 0,
      });
    }
    return out;
  }, [history, days]);

  const counts = useMemo(() => {
    const c = new Map<MoodKey, number>();
    for (const cell of grid) {
      if (cell.mood) c.set(cell.mood, (c.get(cell.mood) ?? 0) + 1);
    }
    return c;
  }, [grid]);

  const dominant = useMemo(() => {
    let best: { mood: MoodKey; n: number } | null = null;
    for (const [mood, n] of counts) {
      if (!best || n > best.n) best = { mood, n };
    }
    return best;
  }, [counts]);

  const totalLogged = grid.filter((c) => c.mood).length;
  const coverage = Math.round((totalLogged / days) * 100);

  return (
    <Card variant="surface" className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/8 via-transparent to-magenta-500/8"
      />
      <div className="relative p-6 md:p-8">
        {withHeader && (
          <div className="mb-5">
            <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
              {days} derniers jours
            </p>
            <h3 className="font-cinzel text-h2 leading-tight">
              <span className="text-ivory-50">Tes vagues </span>
              <span className="text-gradient-aurora">intérieures.</span>
            </h3>
            <p className="mt-2 text-caption text-ivory-300">
              Une carte sensible de tes humeurs.{' '}
              {dominant
                ? `Tu as surtout été ${MOOD_META[dominant.mood].label.toLowerCase()} (${dominant.n}j).`
                : 'Encore aucun mood logé — commence dès demain matin.'}
            </p>
          </div>
        )}

        {/* Grille des jours : 10 cases × 3 lignes pour 30 jours, équilibré sur tous les viewports. */}
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {grid.map((cell, i) => {
            const meta = cell.mood ? MOOD_META[cell.mood] : null;
            const day = DateTime.fromISO(cell.date).day;
            return (
              <motion.div
                key={cell.date}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.012, 0.6), duration: 0.25 }}
                className={cn(
                  'relative aspect-square rounded-lg flex items-center justify-center text-[11px] tabular-nums ring-1 transition-colors',
                  meta
                    ? `${meta.bg} ${meta.ring} text-ivory-50`
                    : 'bg-night-900/50 ring-night-700/50 text-ivory-500',
                )}
                title={
                  meta
                    ? `${cell.date} · ${meta.label} (${cell.intensity}%)`
                    : `${cell.date} · pas de ressenti`
                }
                aria-label={
                  meta
                    ? `Le ${cell.date}, mood ${meta.label}`
                    : `Le ${cell.date}, aucun mood enregistré`
                }
              >
                <span aria-hidden="true">{meta ? meta.emoji : day}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Légende compacte */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-caption text-ivory-300">
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(MOOD_META) as MoodKey[]).map((k) => {
              const meta = MOOD_META[k];
              const n = counts.get(k) ?? 0;
              return (
                <span
                  key={k}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1',
                    meta.bg,
                    meta.ring,
                    n > 0 ? 'text-ivory-50' : 'text-ivory-400 opacity-50',
                  )}
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span className="text-micro">{n}</span>
                </span>
              );
            })}
          </div>
          <span className="text-micro uppercase tracking-[0.18em] text-ivory-400">
            Couverture · {coverage}%
          </span>
        </div>
      </div>
    </Card>
  );
}
