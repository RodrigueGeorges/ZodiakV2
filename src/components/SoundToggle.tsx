import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { Card } from './ui/Card';
import { isSoundEnabled, setSoundEnabled, playSound } from '../lib/sounds';
import { cn } from '../lib/utils';

interface SoundToggleProps {
  className?: string;
}

/**
 * Petit toggle pour activer / désactiver les sons d'interaction.
 * S'intègre dans le profil. Joue un son de test au passage en ON
 * pour confirmer à l'utilisateur que c'est actif.
 */
export default function SoundToggle({ className }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) playSound('chime', { force: true });
  };

  return (
    <Card variant="surface" className={cn('relative overflow-hidden', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-aurora-500/8 via-transparent to-magenta-500/8"
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className="relative w-full flex items-center gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300 focus-visible:ring-inset"
      >
        <span
          className={cn(
            'flex-shrink-0 w-11 h-11 rounded-2xl ring-1 flex items-center justify-center transition-colors',
            enabled
              ? 'bg-aurora-500/25 ring-aurora-300/60 text-aurora-100'
              : 'bg-night-900/60 ring-night-700/60 text-ivory-400',
          )}
        >
          {enabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-cinzel text-h3 text-ivory-50">Sons d'interaction</p>
          <p className="text-caption text-ivory-300">
            Whoosh discret au refresh, chime sur le streak. Volume très bas.
          </p>
        </div>
        <span
          className={cn(
            'relative inline-flex w-11 h-6 rounded-full transition-colors',
            enabled ? 'bg-aurora-500' : 'bg-night-700',
          )}
          aria-hidden="true"
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={cn(
              'absolute top-0.5 w-5 h-5 rounded-full bg-ivory-50 shadow',
              enabled ? 'left-[22px]' : 'left-0.5',
            )}
          />
        </span>
      </button>
    </Card>
  );
}
