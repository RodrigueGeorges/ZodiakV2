import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';

interface RitualIngressProps {
  className?: string;
}

/**
 * Panneau « transmission » : métadonnées monospace, bord sobre.
 */
export default function RitualIngress({ className }: RitualIngressProps) {
  const phase = useMemo(() => moonPhaseAt(new Date()), []);

  return (
    <motion.figure
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn('w-full max-w-[420px] mx-auto', className)}
      aria-label="Exemple de message de guidance quotidienne"
    >
      <div
        className={cn(
          'relative rounded-sm border border-signal-500/25 bg-night-950/80 backdrop-blur-[8px]',
          'shadow-[inset_0_1px_0_rgba(127,160,144,0.08),inset_0_-1px_0_rgba(7,9,13,0.4)]',
          'px-6 py-9 md:px-9 md:py-10',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 flex h-px w-full max-w-[10rem]"
        >
          <span className="h-px flex-1 bg-signal-400/60" />
          <span className="h-px w-8 bg-night-950" />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-7">
          <p className="protocol-caption">
            Ingress <span className="text-signal-500/55">/</span> sample
          </p>
          <span className="font-mono text-[10px] text-signal-500/65 tracking-wider uppercase">
            v1<span className="mx-1.5 text-signal-600">·</span>
            diffusion
          </span>
        </div>

        <blockquote className="font-serif italic-editorial text-body-lg md:text-xl text-ivory-50/[0.94] leading-[1.62] mb-9 pl-4 border-l border-signal-500/30">
          « Ce matin la Lune glisse où tu attends peu : pose une chose avant
          midi, elle trouvera quelqu’un qui l’écoute. »
        </blockquote>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 pt-6 border-t border-signal-600/15 font-mono text-[11px] leading-snug">
          <p className="text-ivory-300/90 tabular-nums">
            <span className="text-signal-400 mr-2" aria-hidden="true">
              {phase.glyph}
            </span>
            <span className="text-ivory-200/90">{phase.label}</span>
            <span className="text-signal-600 mx-2">·</span>
            <span className="text-signal-400/90">
              {Math.round(phase.illumination * 100)}%
            </span>
            <span className="text-ivory-500 ml-1">illum.</span>
          </p>
          <p className="text-signal-400/85 tracking-[0.14em] uppercase sm:text-right whitespace-nowrap">
            WhatsApp<span className="text-signal-600 mx-2">·</span>08:00
          </p>
        </div>
      </div>
    </motion.figure>
  );
}
