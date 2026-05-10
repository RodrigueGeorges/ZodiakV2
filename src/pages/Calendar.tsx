import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Moon } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import PremiumGate from '../components/PremiumGate';
import { useAuth } from '../lib/hooks/useAuth';
import { usePremium } from '../lib/hooks/usePremium';
import { moonPhasesNextDays, nextKeyMoonDates, moonPhaseAt } from '../lib/moonPhase';
import MoonPhaseVisual from '../components/MoonPhaseVisual';
import { cn } from '../lib/utils';
import { useDocumentSeo } from '../lib/documentSeo';

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

  useDocumentSeo({
    title: 'Calendrier lunaire 30 jours · Zodiak',
    description:
      'Phases de la Lune et dates clés pour t’aligner avec ton horoscope personnalisé — calendrier cosmique réservé aux abonnés Premium Zodiak (8,99 € / mois, essai sans CB).',
  });

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
        <div className="relative p-7 md:p-8">
          <div className="flex items-center gap-2 mb-5 text-aurora-400/90">
            <Moon className="w-4 h-4" aria-hidden="true" />
            <span className="eyebrow-ritual">Lunaisons à venir</span>
          </div>
          <h2 className="font-display font-light text-h2 text-ivory-50 leading-[0.95] mb-5">
            Pose tes intentions{' '}
            <span className="italic-editorial text-aurora-400">au bon moment.</span>
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {keyDates.map((k, i) => (
              <motion.li
                key={`${k.kind}-${k.date}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-md bg-night-900/60 border border-ivory-50/[0.06]"
              >
                <MoonPhaseVisual
                  phase={moonPhaseAt(new Date(`${k.date}T12:00:00`))}
                  size="md"
                  variant="aurora"
                  instrumentRing={false}
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-body text-ivory-50 font-sans font-normal">{k.label}</p>
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
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 mb-5 text-aurora-400/90">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            <span className="eyebrow-ritual">Trente jours</span>
          </div>
          <h2 className="font-display font-light text-h2 text-ivory-50 leading-[0.95] mb-5">
            Ton mois{' '}
            <span className="italic-editorial text-aurora-400">cosmique.</span>
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
                    'relative aspect-square rounded-md flex flex-col items-center justify-center gap-1 border transition-colors',
                    'bg-night-900/60 border-ivory-50/[0.06]',
                    isFull && 'border-amber-300/40 bg-amber-500/10',
                    isNew && 'border-aurora-400/30 bg-aurora-500/10'
                  )}
                  style={{
                    boxShadow: `inset 0 -${Math.round(intensity * 30)}px 60px rgba(201,166,255,${
                      intensity * 0.35
                    })`,
                  }}
                  aria-label={`${formatLong(p.date)} — ${p.label}`}
                  title={`${formatLong(p.date)} — ${p.label}`}
                >
                  <MoonPhaseVisual
                    phase={p}
                    size="sm"
                    variant="aurora"
                    instrumentRing={false}
                    className="scale-[0.92]"
                  />
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
      subtitle="Les lunaisons du mois qui rythment ton horoscope — pour t’aligner avec la Lune."
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
