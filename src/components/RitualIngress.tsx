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
          'relative rounded-sm border border-white/12 bg-black/50 backdrop-blur-[10px]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(0,0,0,0.45)]',
          'px-6 py-9 md:px-9 md:py-10',
        )}
      >
        <div
          aria-hidden="true"
          className="absolute left-6 top-0 flex h-px w-full max-w-[10rem]"
        >
          <span className="h-px flex-1 bg-aurora-400/50" />
          <span className="h-px w-8 bg-black/70" />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-7">
          <p className="protocol-caption">
            Ingress <span className="text-ivory-500">/</span> sample
          </p>
          <span className="font-mono text-[10px] text-ivory-500 tracking-wider uppercase">
            v1<span className="mx-1.5 text-white/25">·</span>
            diffusion
          </span>
        </div>

        <blockquote className="italic-editorial text-body-lg md:text-xl font-light text-ivory-50/[0.94] leading-[1.62] mb-9 pl-4 border-l border-aurora-400/35">
          « Ce matin la Lune glisse où tu attends peu : pose une chose avant
          midi, elle trouvera quelqu’un qui l’écoute. »
        </blockquote>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 pt-6 border-t border-white/10 font-mono text-[11px] leading-snug">
          <p className="text-ivory-400/90 tabular-nums">
            <span className="text-aurora-400 mr-2" aria-hidden="true">
              {phase.glyph}
            </span>
            <span className="text-ivory-300/90">{phase.label}</span>
            <span className="text-white/20 mx-2">·</span>
            <span className="text-aurora-300/90">
              {Math.round(phase.illumination * 100)}%
            </span>
            <span className="text-ivory-500 ml-1">illum.</span>
          </p>
          <p className="text-ivory-400 tracking-[0.14em] uppercase sm:text-right whitespace-nowrap">
            WhatsApp<span className="text-white/20 mx-2">·</span>08:00
          </p>
        </div>
      </div>
    </motion.figure>
  );
}
