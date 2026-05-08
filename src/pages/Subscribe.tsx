import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  MessageCircle,
  Compass,
  BookOpen,
  Check,
  ArrowLeft,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const FEATURES = [
  {
    icon: Sparkles,
    label: 'Guidance quotidienne premium',
    description:
      'Une lecture personnalisée chaque matin, sur ton canal préféré.',
  },
  {
    icon: MessageCircle,
    label: 'Livraison WhatsApp & Instagram',
    description: 'Là où tu es déjà — pas une app de plus à ouvrir.',
  },
  {
    icon: Compass,
    label: 'Thème natal détaillé',
    description: 'Carte du ciel, planètes, maisons, ascendant, mantra.',
  },
  {
    icon: BookOpen,
    label: 'Guide astral conversationnel',
    description: 'Pose des questions, reçois des réponses adaptées à toi.',
  },
];

export default function Subscribe() {
  const navigate = useNavigate();

  return (
    <PageLayout
      eyebrow="Abonnement"
      title="Le ciel à portée de main"
      subtitle="Un essai gratuit d'un mois. Sans engagement, sans piège."
      maxWidth="4xl"
      showLogo={false}
    >
      <div className="space-y-8">
        <Card variant="elevated" className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/12 via-transparent to-magenta-500/12"
          />
          <div className="relative grid md:grid-cols-2 gap-0">
            {/* Bloc tarif */}
            <div className="p-8 md:p-10 md:border-r border-night-700/60">
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-3">
                Premium
              </p>
              <h2 className="font-cinzel text-display text-gradient-aurora mb-4">
                Zodiak ✦
              </h2>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-cinzel text-display text-ivory-50">
                  4,99 €
                </span>
                <span className="text-caption text-ivory-300">/ mois</span>
              </div>
              <p className="text-caption text-ivory-300 mb-6">
                7 jours offerts — annule à tout moment, en 1 clic.
              </p>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/profile')}
                iconLeft={<Sparkles className="w-4 h-4" />}
              >
                Commencer mon essai gratuit
              </Button>
              <p className="mt-4 text-micro uppercase tracking-[0.18em] text-ivory-400 text-center">
                Carte bancaire requise · Sans engagement
              </p>
            </div>

            {/* Bloc features */}
            <div className="p-8 md:p-10 space-y-4">
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-2">
                Ce que tu débloques
              </p>
              {FEATURES.map(({ icon: Icon, label, description }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
                  className="flex gap-3"
                >
                  <div
                    aria-hidden="true"
                    className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-aurora-500/15 ring-1 ring-aurora-400/30 flex items-center justify-center text-aurora-200"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-body font-cinzel text-ivory-50">
                      {label}
                    </p>
                    <p className="text-caption text-ivory-300">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Garanties */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            'Annulation en 1 clic',
            'Données privées · jamais vendues',
            'Support humain en français',
          ].map((g) => (
            <div
              key={g}
              className="rounded-2xl border border-night-700/60 bg-night-900/50 backdrop-blur-md px-4 py-3 flex items-center gap-3 text-caption text-ivory-200"
            >
              <Check className="w-4 h-4 text-aurora-300 shrink-0" aria-hidden="true" />
              {g}
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="text"
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
