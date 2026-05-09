import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Moon } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import PremiumGate from '../components/PremiumGate';
import { useAuth } from '../lib/hooks/useAuth';
import { usePremium } from '../lib/hooks/usePremium';
import { moonPhasesNextDays, nextKeyMoonDates } from '../lib/moonPhase';
import { cn } from '../lib/utils';

const formatDay = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
};

const formatLong = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

/**
 * Calendrier cosmique 30 jours :
 *  - Phases lunaires day-by-day (fond illumination)
 *  - Dates clés (nouvelle, quartiers, pleine) en encart
 *  - Premium-only (preview floutée pour les free)
 */
export default function CalendarPage() {
  const { isLoading } = useAuth();
  const { isPremium } = usePremium();

  const phases = useMemo(() => moonPhasesNextDays(30), []);
  const keyDates = useMemo(() => nextKeyMoonDates(60), []);

  if (isLoading) return <LoadingScreen message="Lecture du calendrier…" />;

  const content = (
    <div className="space-y-8">
      {/* Dates clés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
      <Card variant="elevated" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/12 via-transparent to-magenta-500/12"
        />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 text-aurora-300 mb-3">
            <Moon className="w-4 h-4" aria-hidden="true" />
            <span className="text-micro uppercase tracking-[0.22em]">Lunaisons à venir</span>
          </div>
          <h2 className="font-cinzel text-h2 leading-tight mb-5">
            <span className="text-ivory-50">Pose tes intentions </span>
            <span className="text-gradient-aurora">au bon moment.</span>
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {keyDates.map((k, i) => (
              <motion.li
                key={`${k.kind}-${k.date}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-night-900/60 ring-1 ring-night-700/70"
              >
                <span className="text-3xl" aria-hidden="true">
                  {k.glyph}
                </span>
                <div className="min-w-0">
                  <p className="font-cinzel text-body text-ivory-50">{k.label}</p>
                  <p className="text-caption text-ivory-300 truncate">
                    {formatLong(k.date)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </Card>
      </motion.div>

      {/* Grille 30 jours */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
      <Card variant="surface">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 text-aurora-300 mb-3">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            <span className="text-micro uppercase tracking-[0.22em]">Trente jours</span>
          </div>
          <h2 className="font-cinzel text-h2 leading-tight mb-5">
            <span className="text-ivory-50">Ton mois </span>
            <span className="text-gradient-aurora">cosmique.</span>
          </h2>
          <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-10 gap-2">
            {phases.map((p, i) => {
              const intensity = p.illumination;
              const isFull = p.kind === 'full';
              const isNew = p.kind === 'new';
              return (
                <motion.div
                  key={p.date}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className={cn(
                    'relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 ring-1 transition-colors',
                    'bg-night-900/60 ring-night-700/60',
                    isFull && 'ring-amber-300/50 bg-amber-500/10',
                    isNew && 'ring-aurora-300/50 bg-aurora-500/10'
                  )}
                  style={{
                    boxShadow: `inset 0 -${Math.round(intensity * 30)}px 60px rgba(201,166,255,${
                      intensity * 0.35
                    })`,
                  }}
                  aria-label={`${formatLong(p.date)} — ${p.label}`}
                  title={`${formatLong(p.date)} — ${p.label}`}
                >
                  <span className="text-xl leading-none" aria-hidden="true">
                    {p.glyph}
                  </span>
                  <span className="text-micro tabular-nums text-ivory-300">
                    {formatDay(p.date)}
                  </span>
                </motion.div>
              );
            })}
          </div>
          <p className="mt-4 text-caption text-ivory-400 text-center">
            Halo plus fort = lune plus pleine. Pleine et nouvelle lune sont mises en
            valeur.
          </p>
        </div>
      </Card>
      </motion.div>
    </div>
  );

  return (
    <PageLayout
      eyebrow="Calendrier"
      title="Ton mois cosmique"
      subtitle="Phases lunaires et dates clés pour t'aligner."
      maxWidth="5xl"
      showLogo={false}
      dim
    >
      {isPremium ? (
        content
      ) : (
        <PremiumGate
          feature="calendar_30d"
          title="Calendrier 30 jours"
          description="Visualise tes lunaisons et tes dates clés en un coup d'œil."
          preview
        >
          {content}
        </PremiumGate>
      )}
    </PageLayout>
  );
}
