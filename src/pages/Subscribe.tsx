import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Check, ArrowRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useDocumentSeo } from '../lib/documentSeo';

const PLAN_FEATURES = [
  'Guidance quotidienne illimitée · WhatsApp ou Instagram',
  'Chat astral illimité, mémoire de conversation',
  'Profil fondé sur ton thème natal — tout reste personnel',
];

export default function Subscribe() {
  useDocumentSeo({
    title:
      'Abonnement · Zodiak · 8,99 € — horoscope personnalisé & chat',
    description:
      'Une seule formule : guidance du jour + chat illimités, basés sur ton thème natal. 7 jours sans carte puis 8,99 € / mois, résiliable en un clic.',
  });

  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/profile', { state: { selectedPlan: 'monthly' } });
  };

  return (
    <PageLayout
      eyebrow="Abonnement"
      title="Une seule formule. Tout est inclus."
      subtitle={
        <>
          <span className="text-ivory-200 font-medium">8,99&nbsp;€ par mois</span> après{' '}
          <span className="text-ivory-100 font-medium">7 jours offerts sans carte</span> : guidance du matin + chat
          astral, calibrés sur ton <span className="text-aurora-200/95 font-medium">thème natal</span>. Pas de palier
          caché, pas de pub, pas de revente de données.
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
              'relative overflow-hidden rounded-2xl border-aurora-400/45',
              'shadow-[inset_0_1px_0_rgba(56,189,248,0.18),0_24px_64px_-40px_rgba(0,0,0,0.85)]',
            )}
          >
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
            />
            <div className="relative p-8 md:p-10 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="eyebrow-ritual text-aurora-200/95">
                  Abonnement mensuel
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-aurora-500/15 border border-aurora-400/35 text-aurora-100">
                  Sans surprise
                </span>
              </div>

              <div className="landing-price-well rounded-xl border border-aurora-400/22 px-5 py-6 md:px-6 md:py-7 mb-8">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="font-display font-extralight text-display-xl text-ivory-50 leading-none tracking-[-0.03em]">
                    8,99&nbsp;€
                  </span>
                  <span className="text-body text-aurora-100/90 pb-1 font-medium">/ mois</span>
                </div>
                <p className="mt-3 text-caption text-ivory-300/95 leading-relaxed">
                  Ce montant ne change pas : tu accèdes au message du matin et au chat dans le même abonnement — pas d’options cachées à cocher.
                </p>
              </div>

              <p className="text-micro uppercase tracking-[0.2em] text-aurora-200/85 mb-4">
                Inclus
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
                Lancer mon essai de 7 jours
              </Button>

              <p className="text-center mt-4 text-caption text-ivory-400/90 leading-relaxed">
                Résiliation depuis ton profil quand tu veux — pas d’e-mail type « donnez-nous une raison ».
              </p>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            'Annulation en quelques clics',
            'Données en Europe · jamais revendues',
            'Support humain en français',
          ].map((g) => (
            <div
              key={g}
              className="rounded-xl border border-aurora-400/18 bg-white/[0.06] backdrop-blur-md px-4 py-3.5 flex items-center gap-3 text-caption text-ivory-200 shadow-[inset_0_1px_0_rgba(56,189,248,0.06)]"
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
