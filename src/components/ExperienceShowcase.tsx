import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sun } from 'lucide-react';
import GuidanceDemo from './GuidanceDemo';
import ChatAstroDemo from './ChatAstroDemo';
import { cn } from '../lib/utils';

type Mode = 'guidance' | 'chat';

const MODES: Array<{ id: Mode; label: string; icon: typeof Sun }> = [
  { id: 'guidance', label: 'Guidance du matin', icon: Sun },
  { id: 'chat', label: 'Chat astral', icon: MessageCircle },
];

export default function ExperienceShowcase({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('guidance');

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      <div
        className="mb-5 flex rounded-full border border-white/[0.1] bg-night-900/40 p-1 backdrop-blur-md"
        role="tablist"
        aria-label="Aperçu de l’expérience"
      >
        {MODES.map(({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(id)}
              className={cn(
                'relative flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] sm:text-caption transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                active ? 'text-ivory-50' : 'text-ivory-400/85 hover:text-ivory-200',
              )}
            >
              {active && (
                <motion.span
                  layoutId="experience-tab"
                  className={cn(
                    'absolute inset-0 rounded-full border',
                    id === 'guidance'
                      ? 'border-aurora-400/30 bg-aurora-500/15'
                      : 'border-magenta-400/25 bg-magenta-500/12',
                  )}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative w-3.5 h-3.5 shrink-0" aria-hidden />
              <span className="relative truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === 'guidance' ? <GuidanceDemo /> : <ChatAstroDemo />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
