import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Check, ArrowRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const PLAN_FEATURES = [
  'Guidance du jour illimitée (WhatsApp ou Instagram)',
  'Chat astral avec mémoire de conversation',
  'Thème de naissance inclus : tout reste personnel',
];

export default function Subscribe() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/profile', { state: { selectedPlan: 'monthly' } });
  };

  return (
    <PageLayout
      eyebrow="Abonnement"
      title="Une formule, tout le nécessaire"
      subtitle={
        <>
          Essai gratuit 7 jours sans carte — puis{' '}
          <span className="text-ivory-200 font-medium">8,99&nbsp;€ / mois</span> pour la guidance quotidienne et le
          chat avec ton guide astral.
        </>
      }
      maxWidth="lg"
      showLogo={false}
    >
      <div className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto"
        >
          <Card
            variant="elevated"
            className={cn(
              'relative overflow-hidden border-aurora-400/45',
              'shadow-[inset_0_1px_0_rgba(56,189,248,0.18),0_24px_64px_-40px_rgba(0,0,0,0.85)]',
            )}
          >
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
            />
            <div className="relative p-8 md:p-10 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <span className="eyebrow-ritual text-aurora-200/90">
                  Mensuel · tout inclus
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-aurora-500/15 border border-aurora-400/35 text-aurora-100">
                  Sans engagement
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-x-3 gap-y-2 mb-2">
                <span className="font-display font-extralight text-display-xl text-ivory-50 leading-none tracking-[-0.03em]">
                  8,99&nbsp;€
                </span>
                <span className="text-body text-ivory-400 pb-1">/ mois</span>
              </div>
              <p className="text-caption text-ivory-300/95 mb-8 leading-relaxed">
                Une seule ligne sur ton relevé après l’essai. Tu retrouves la même lecture matin et le même chat —
                aucun coffre ou option en plus à cocher.
              </p>

              <ul className="space-y-3 text-body text-ivory-200 mb-10">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-aurora-400 mt-1 flex-shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleStart}
                iconLeft={<Sparkles className="w-4 h-4" />}
                iconRight={<ArrowRight className="w-4 h-4" />}
                className="landing-primary-cta-glow shadow-none"
              >
                Commencer l’essai gratuit (7&nbsp;jours)
              </Button>

              <p className="text-center mt-4 text-micro text-ivory-400/90 leading-relaxed">
                Tu peux annuler avant la facturation depuis ton espace personnel — aucun mail obligatoire.
              </p>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            'Annulation possible en quelques clics',
            'Données en Europe · jamais revendues',
            'Support rédigé par l’équipe en français',
          ].map((g) => (
            <div
              key={g}
              className="rounded-sm border border-aurora-400/18 bg-night-950/40 backdrop-blur-md px-4 py-3 flex items-center gap-3 text-caption text-ivory-200 shadow-[inset_0_1px_0_rgba(56,189,248,0.06)]"
            >
              <Check className="w-4 h-4 text-aurora-400 shrink-0" aria-hidden />
              {g}
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Retour au profil
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
