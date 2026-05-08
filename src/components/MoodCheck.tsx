import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MoodKey } from '../lib/types/supabase';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface MoodOption {
  key: MoodKey;
  emoji: string;
  label: string;
  helper: string;
  tone: string;
}

const MOODS: MoodOption[] = [
  {
    key: 'radiant',
    emoji: '☀️',
    label: 'Radieux',
    helper: 'Une énergie haute, prête à rayonner.',
    tone: 'from-amber-500/30 to-magenta-500/20 ring-amber-300/40',
  },
  {
    key: 'inspired',
    emoji: '✨',
    label: 'Inspiré',
    helper: 'Des idées qui dansent.',
    tone: 'from-aurora-500/30 to-magenta-500/25 ring-aurora-300/40',
  },
  {
    key: 'calm',
    emoji: '🌊',
    label: 'Apaisé',
    helper: 'Le souffle posé.',
    tone: 'from-aurora-500/25 to-night-700/40 ring-aurora-200/30',
  },
  {
    key: 'pensive',
    emoji: '🌙',
    label: 'Pensif',
    helper: 'Le mental qui tourne.',
    tone: 'from-night-700/60 to-aurora-500/20 ring-night-500/40',
  },
  {
    key: 'tense',
    emoji: '⚡',
    label: 'Tendu',
    helper: 'Quelque chose tire.',
    tone: 'from-magenta-500/30 to-night-800/40 ring-magenta-300/40',
  },
  {
    key: 'tired',
    emoji: '🌫️',
    label: 'Fatigué',
    helper: 'Le réservoir est bas.',
    tone: 'from-night-700/70 to-night-800/60 ring-night-600/40',
  },
];

interface MoodCheckProps {
  /** Mood déjà enregistré aujourd'hui — affichage compact "modifier mon ressenti". */
  current?: MoodKey | null;
  onSelect: (mood: MoodKey) => void | Promise<unknown>;
  className?: string;
  /** Cache le titre (utile si déjà encadré dans un layout). */
  hideHeader?: boolean;
}

/**
 * Mood check en 2 secondes. Création du moment "investment" Nir Eyal :
 * l'utilisateur livre un signal → l'IA personnalise la guidance → il revient.
 */
export default function MoodCheck({
  current,
  onSelect,
  className,
  hideHeader,
}: MoodCheckProps) {
  const [submitting, setSubmitting] = useState<MoodKey | null>(null);

  const handle = async (mood: MoodKey) => {
    if (submitting) return;
    setSubmitting(mood);
    try {
      await onSelect(mood);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Card variant="elevated" className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/12 via-transparent to-magenta-500/12"
      />
      <div className="relative p-6 md:p-8">
        {!hideHeader && (
          <div className="mb-5 text-center">
            <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
              Avant ta guidance
            </p>
            <h2 className="font-cinzel text-h3 md:text-h2 text-ivory-50">
              Comment tu te sens, là ?
            </h2>
            <p className="text-caption text-ivory-300 mt-1">
              Le ciel t'écoutera mieux.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {MOODS.map((m) => {
            const active = current === m.key;
            const isSubmitting = submitting === m.key;
            return (
              <motion.button
                key={m.key}
                type="button"
                onClick={() => handle(m.key)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                disabled={!!submitting}
                aria-pressed={active}
                aria-label={`${m.label} — ${m.helper}`}
                className={cn(
                  'relative rounded-2xl px-2 py-3 flex flex-col items-center gap-1 ring-1 transition-all',
                  'bg-gradient-to-br',
                  m.tone,
                  active ? 'ring-2 ring-offset-2 ring-offset-night-900' : '',
                  isSubmitting && 'opacity-70',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300'
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="font-cinzel text-caption text-ivory-50">
                  {m.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {current && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-caption text-ivory-300"
          >
            Ton ressenti est noté ✦ Tu peux changer si l'humeur évolue.
          </motion.p>
        )}
      </div>
    </Card>
  );
}

export const MOOD_LABELS: Record<MoodKey, string> = {
  radiant: 'Radieux',
  inspired: 'Inspiré',
  calm: 'Apaisé',
  pensive: 'Pensif',
  tense: 'Tendu',
  tired: 'Fatigué',
};
