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
}

const MOODS: MoodOption[] = [
  { key: 'radiant',  emoji: '☀️',  label: 'Radieux',  helper: 'Une énergie haute, prête à rayonner.' },
  { key: 'inspired', emoji: '✨',  label: 'Inspiré',  helper: 'Des idées qui dansent.' },
  { key: 'calm',     emoji: '🌊', label: 'Apaisé',   helper: 'Le souffle posé.' },
  { key: 'pensive',  emoji: '🌙', label: 'Pensif',   helper: 'Le mental qui tourne.' },
  { key: 'tense',    emoji: '⚡', label: 'Tendu',    helper: 'Quelque chose tire.' },
  { key: 'tired',    emoji: '🌫️',  label: 'Fatigué',  helper: 'Le réservoir est bas.' },
];

interface MoodCheckProps {
  current?: MoodKey | null;
  onSelect: (mood: MoodKey) => void | Promise<unknown>;
  className?: string;
  hideHeader?: boolean;
}

/**
 * MoodCheck v3 — épuré "Cosmic Editorial Ritual".
 * Suppression des gradients tonalisés (rainbow). Hover or, sélection or.
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
      <div className="relative p-7 md:p-10">
        {!hideHeader && (
          <div className="mb-8 text-center">
            <p className="eyebrow-ritual text-aurora-400/80 mb-4">
              Avant ta guidance
            </p>
            <h2 className="font-serif text-h1 text-ivory-50 leading-tight">
              Comment tu te sens, <span className="italic-editorial text-aurora-400">là ?</span>
            </h2>
            <p className="text-caption text-ivory-300/80 italic-editorial mt-3">
              Le ciel t'écoutera mieux.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {MOODS.map((m) => {
            const active = current === m.key;
            const isSubmitting = submitting === m.key;
            return (
              <motion.button
                key={m.key}
                type="button"
                onClick={() => handle(m.key)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                disabled={!!submitting}
                aria-pressed={active}
                aria-label={`${m.label} — ${m.helper}`}
                className={cn(
                  'relative px-3 py-4 flex flex-col items-center gap-2 border transition-colors duration-300',
                  active
                    ? 'border-aurora-400/60 bg-aurora-400/5'
                    : 'border-ivory-50/[0.08] bg-night-900/40 hover:border-aurora-400/30',
                  isSubmitting && 'opacity-70',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-300',
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="font-serif text-caption text-ivory-50">
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
            className="mt-5 text-center text-caption text-ivory-300/80 italic-editorial"
          >
            Ton ressenti est noté · tu peux changer si l'humeur évolue.
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
