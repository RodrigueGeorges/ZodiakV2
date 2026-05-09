import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Check,
  ArrowRight,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

type PlanId = 'monthly' | 'yearly' | 'lifetime';

interface PlanDef {
  id: PlanId;
  eyebrow: string;
  price: string;
  priceSuffix: string;
  perMonth?: string;
  badge?: string;
  hint?: string;
  highlighted?: boolean;
  ctaLabel: string;
  features: string[];
}

const PLANS: PlanDef[] = [
  {
    id: 'monthly',
    eyebrow: 'Mensuel',
    price: '8,99 €',
    priceSuffix: '/ mois',
    hint: 'Idéal pour essayer',
    ctaLabel: 'Commencer mon essai',
    features: [
      'Guidance quotidienne illimitée',
      'Chat astral IA (mémoire long-terme)',
      'Synastries illimitées',
      'Calendrier lunaire 30 jours',
      'Œuvre cosmique partageable',
    ],
  },
  {
    id: 'yearly',
    eyebrow: 'Annuel',
    price: '69 €',
    priceSuffix: '/ an',
    perMonth: '≈ 5,75 € / mois',
    badge: 'Recommandé · −36 %',
    highlighted: true,
    hint: 'Tu économises 38 € sur l’année',
    ctaLabel: 'Choisir l’annuel',
    features: [
      'Tout du plan mensuel',
      '2 mois offerts',
      'Stories HD imprimables',
      'Accès anticipé aux nouveautés',
      'Support prioritaire',
    ],
  },
  {
    id: 'lifetime',
    eyebrow: 'À vie',
    price: '129 €',
    priceSuffix: 'une fois',
    badge: 'Édition limitée',
    hint: 'Offre fondateur · 100 places',
    ctaLabel: 'Devenir fondateur',
    features: [
      'Tout, pour toujours',
      'Aucun renouvellement',
      'Place fondateur · profil orné',
      'Vote sur la roadmap',
      'Accès aux betas privées',
    ],
  },
];

export default function Subscribe() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<PlanId>('yearly');

  const handleStart = () => {
    // TODO: brancher Stripe Checkout en passant `selected`
    navigate('/profile', { state: { selectedPlan: selected } });
  };

  return (
    <PageLayout
      eyebrow="Abonnement"
      title="Choisis ce qui te ressemble"
      subtitle="7 jours offerts sur tous les plans, sans carte bancaire pour commencer."
      maxWidth="6xl"
      showLogo={false}
    >
      <div className="space-y-10">
        <div
          className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch"
          role="radiogroup"
          aria-label="Choix du plan d'abonnement"
        >
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="h-full"
            >
              <Card
                variant={plan.highlighted ? 'elevated' : 'surface'}
                className={cn(
                  'relative h-full flex flex-col overflow-hidden transition-all duration-300 cursor-pointer',
                  'focus-within:ring-2 focus-within:ring-aurora-400 focus-within:ring-offset-2 focus-within:ring-offset-night-950',
                  selected === plan.id
                    ? 'ring-2 ring-aurora-400 shadow-glow-aurora'
                    : 'ring-1 ring-night-700/60 hover:ring-aurora-400/50',
                )}
                onClick={() => setSelected(plan.id)}
                role="radio"
                tabIndex={0}
                aria-checked={selected === plan.id}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(plan.id);
                  }
                }}
              >
                {plan.highlighted && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/15 via-transparent to-magenta-500/12"
                  />
                )}
                <div className="relative p-7 md:p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-micro uppercase tracking-[0.22em] text-aurora-300">
                      {plan.eyebrow}
                    </span>
                    {plan.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-aurora-500/20 ring-1 ring-aurora-300/40 text-aurora-100 font-medium">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-cinzel text-display-xl text-ivory-50 leading-none">
                      {plan.price}
                    </span>
                    <span className="text-caption text-ivory-300">
                      {plan.priceSuffix}
                    </span>
                  </div>
                  {plan.perMonth && (
                    <p className="text-caption text-aurora-200 mb-1">
                      {plan.perMonth}
                    </p>
                  )}
                  {plan.hint && (
                    <p className="text-caption text-ivory-300 mb-5">
                      {plan.hint}
                    </p>
                  )}

                  <ul className="space-y-2.5 text-body text-ivory-200 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-aurora-300 mt-1 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={selected === plan.id ? 'primary' : 'ghost'}
                    fullWidth
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(plan.id);
                    }}
                    iconLeft={
                      selected === plan.id ? (
                        <Check className="w-4 h-4" />
                      ) : undefined
                    }
                    className="mt-auto"
                  >
                    {selected === plan.id ? 'Sélectionné' : 'Choisir'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            iconLeft={<Sparkles className="w-4 h-4" />}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            {selected === 'lifetime'
              ? 'Devenir fondateur'
              : `Commencer mon essai · ${PLANS.find((p) => p.id === selected)?.price}`}
          </Button>
          <p className="text-micro uppercase tracking-[0.22em] text-ivory-400 text-center">
            7 jours offerts · sans carte bancaire · annulable en 1 clic
          </p>
        </div>

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
              <Check
                className="w-4 h-4 text-aurora-300 shrink-0"
                aria-hidden="true"
              />
              {g}
            </div>
          ))}
        </div>

        <div className="text-center">
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
