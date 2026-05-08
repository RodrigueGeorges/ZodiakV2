import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Compass, Sparkles } from 'lucide-react';
import AuroraBackground from './ui/AuroraBackground';
import { cn } from '../lib/utils';

interface NatalRevealSplashProps {
  firstName?: string;
  sunSign?: string;
  moonSign?: string;
  ascSign?: string;
  /** Appelé quand la séquence est terminée. */
  onDone: () => void;
  /** Bypass total (test ou utilisateur sans heure de naissance précise). */
  fastForward?: boolean;
}

const PHASES = [
  { delay: 200, label: 'Le ciel se relit pour toi' },
  { delay: 1700, label: 'Soleil' },
  { delay: 3200, label: 'Lune' },
  { delay: 4700, label: 'Ascendant' },
  { delay: 6200, label: 'Ta carte' },
  { delay: 7700, label: 'done' },
] as const;

/**
 * Splash "naissance de ta carte" : reveal progressif Soleil → Lune → Asc → carte
 * complète, avec animations Framer Motion. Sans son, sans clic, automatique.
 *
 * Une seule occurrence : on stocke un flag localStorage pour éviter de le
 * rejouer à chaque visite après la première.
 */
const STORAGE_KEY = 'zodiak.onboarding.seenAt';

export default function NatalRevealSplash({
  firstName = 'voyageur',
  sunSign,
  moonSign,
  ascSign,
  onDone,
  fastForward,
}: NatalRevealSplashProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (fastForward) {
      onDone();
      return;
    }
    const timers = PHASES.map((p, i) =>
      window.setTimeout(() => {
        setPhase(i + 1);
        if (p.label === 'done') {
          try {
            localStorage.setItem(STORAGE_KEY, new Date().toISOString());
          } catch {
            /* ignore */
          }
          onDone();
        }
      }, p.delay)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [fastForward, onDone]);

  return (
    <div className="fixed inset-0 z-[70] bg-night-950">
      <AuroraBackground />
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        {/* Phase 1 : intro */}
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.7 }}
              className="space-y-3"
            >
              <p className="text-micro uppercase tracking-[0.32em] text-aurora-300">
                Bonjour {firstName}
              </p>
              <h1 className="font-cinzel text-display-xl md:text-[64px] text-ivory-50 leading-tight">
                Le ciel se relit
                <br /> pour toi…
              </h1>
            </motion.div>
          )}

          {/* Phase 2 : Soleil */}
          {phase === 2 && (
            <RevealCorps
              key="sun"
              icon={<Sun className="w-10 h-10" />}
              eyebrow="Ton soleil"
              value={sunSign ?? '✦'}
              accent="text-amber-300"
              halo="from-amber-400/40 to-magenta-500/30"
            />
          )}

          {phase === 3 && (
            <RevealCorps
              key="moon"
              icon={<Moon className="w-10 h-10" />}
              eyebrow="Ta lune"
              value={moonSign ?? '✦'}
              accent="text-aurora-200"
              halo="from-aurora-400/40 to-night-700/30"
            />
          )}

          {phase === 4 && (
            <RevealCorps
              key="asc"
              icon={<Compass className="w-10 h-10" />}
              eyebrow="Ton ascendant"
              value={ascSign ?? '✦'}
              accent="text-magenta-300"
              halo="from-magenta-500/40 to-aurora-500/30"
            />
          )}

          {phase === 5 && (
            <motion.div
              key="full"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <Sparkles className="w-8 h-8 text-aurora-200" aria-hidden="true" />
              <h2 className="font-cinzel text-display-xl md:text-[72px] text-gradient-aurora leading-none">
                Ta carte
              </h2>
              <p className="text-body text-ivory-200 max-w-md">
                Le ciel exact de ta naissance, lu à travers l'aurora cosmique.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer progress */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {PHASES.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-700',
                i < phase ? 'w-8 bg-aurora-300' : 'w-3 bg-night-700/80'
              )}
              aria-hidden="true"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

interface RevealProps {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  accent: string;
  halo: string;
}
function RevealCorps({ icon, eyebrow, value, accent, halo }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05, y: -8 }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-5"
    >
      <motion.div
        animate={{ rotate: [0, 4, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'relative w-32 h-32 rounded-full flex items-center justify-center',
          'bg-gradient-to-br ring-1 ring-aurora-400/40',
          halo
        )}
      >
        <span className={cn(accent, 'drop-shadow-[0_0_24px_rgba(201,166,255,0.6)]')}>
          {icon}
        </span>
      </motion.div>
      <p className="text-micro uppercase tracking-[0.28em] text-ivory-300">{eyebrow}</p>
      <h2 className="font-cinzel text-display-xl md:text-[72px] text-ivory-50 leading-none">
        {value}
      </h2>
    </motion.div>
  );
}

export function hasSeenSplash(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}
