import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Check, ArrowRight, Zap } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import OnboardingStepper from '../components/OnboardingStepper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useDocumentSeo } from '../lib/documentSeo';
import { useAuth } from '../lib/hooks/useAuth';
import { track } from '../lib/analytics';

const PLAN_FEATURES = [
  'Guidance quotidienne illimitée · WhatsApp ou Instagram',
  '100 messages chat astral inclus chaque mois (mensuel comme annuel)',
  'Calendrier 30 jours · alertes transits push · synastries illimitées',
  'Profil fondé sur ton thème natal — données jamais revendues',
];

const PACKS = [
  { emoji: '⭐', name: 'Étoile Filante', messages: 10, price: '3,99', id: 'filante' },
  { emoji: '🌙', name: 'Pleine Lune', messages: 30, price: '9,99', id: 'lune', popular: true },
  { emoji: '✨', name: 'Constellation', messages: 100, price: '24,99', id: 'constellation' },
  { emoji: '🌌', name: 'Galaxie', messages: 300, price: '59,99', id: 'galaxie' },
];

export default function Subscribe() {
  useDocumentSeo({
    title: 'Abonnement · Zodiak Astro · 8,90 € — horoscope personnalisé & chat',
    description:
      'Une seule formule : guidance du jour + 100 messages chat inclus, basés sur ton thème natal. Essai 7 jours avec CB, puis 8,90 € / mois. Résiliable en un clic.',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOnboarding = searchParams.get('from') === 'onboarding';
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const isAnnual = billing === 'annual';

  const handleStart = async () => {
    if (!user?.id) {
      navigate('/register');
      return;
    }

    track('paywall_clicked_subscribe', {
      plan: isAnnual ? 'premium_annual' : 'premium_monthly',
      source: fromOnboarding ? 'onboarding' : 'subscribe_page',
    });
    setLoading(true);

    try {
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
      if (!stripe) return;

      const priceId = isAnnual
        ? import.meta.env.VITE_STRIPE_PRICE_PREMIUM_ANNUAL
        : import.meta.env.VITE_STRIPE_PRICE_PREMIUM;

      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode: 'subscription',
          userId: user.id,
          userEmail: user.email ?? '',
          successUrl: `${window.location.origin}/profile?subscribed=1`,
          cancelUrl: window.location.href,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const { sessionId } = await res.json() as { sessionId: string };
      await stripe.redirectToCheckout({ sessionId });
    } catch (err) {
      console.error('[subscribe] checkout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      eyebrow={fromOnboarding ? 'Étape 3 sur 3 · Essai Premium' : 'Abonnement'}
      title={
        fromOnboarding
          ? 'Ta carte est prête — active ton essai.'
          : 'Une seule formule. Tout est inclus.'
      }
      subtitle={
        fromOnboarding ? (
          <>
            Ton thème natal est calculé. Il ne reste qu&apos;à valider ton{' '}
            <span className="text-ivory-100 font-medium">essai 7 jours</span> (carte requise) pour
            recevoir ta première guidance demain matin sur WhatsApp ou Instagram.
          </>
        ) : (
          <>
            <span className="text-ivory-200 font-medium">8,90&nbsp;€ par mois</span> après{' '}
            <span className="text-ivory-100 font-medium">7 jours d'essai avec carte</span> — guidance du matin +
            100 messages chat, calibrés sur ton{' '}
            <span className="text-aurora-200/95 font-medium">thème natal</span>. Pas de palier caché.
          </>
        )
      }
      maxWidth="lg"
      showLogo={false}
    >
      <div className="space-y-10">
        {fromOnboarding && (
          <OnboardingStepper currentStep={3} totalSteps={3} className="max-w-xs mx-auto" />
        )}
        {/* ── Carte offre principale ── */}
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
                <span className="eyebrow-ritual text-aurora-200/95">Zodiak Astro Premium</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-aurora-500/15 border border-aurora-400/35 text-aurora-100">
                  Sans surprise
                </span>
              </div>

              {/* Toggle mensuel / annuel */}
              <div
                role="tablist"
                aria-label="Choix de la formule"
                className="mb-6 flex items-center gap-1 p-1 rounded-full border border-white/[0.1] bg-night-900/50 backdrop-blur-md w-full max-w-xs mx-auto"
              >
                {([
                  { id: 'monthly', label: 'Mensuel' },
                  { id: 'annual', label: 'Annuel' },
                ] as const).map((opt) => {
                  const active = billing === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setBilling(opt.id)}
                      className={cn(
                        'relative flex-1 rounded-full px-4 py-2 text-caption font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                        active ? 'text-night-950' : 'text-ivory-300 hover:text-ivory-50',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="billing-pill"
                          className="absolute inset-0 rounded-full bg-aurora-400"
                          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-1.5">
                        {opt.label}
                        {opt.id === 'annual' && (
                          <span
                            className={cn(
                              'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                              active ? 'bg-night-950/15 text-night-950' : 'bg-aurora-500/20 text-aurora-200',
                            )}
                          >
                            -17%
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="landing-price-well rounded-xl border border-aurora-400/22 px-5 py-6 md:px-6 md:py-7 mb-8">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="font-display font-extralight text-display-xl text-ivory-50 leading-none tracking-[-0.03em]">
                    {isAnnual ? '89\u00a0€' : '8,90\u00a0€'}
                  </span>
                  <span className="text-body text-aurora-100/90 pb-1 font-medium">
                    {isAnnual ? '/ an' : '/ mois'}
                  </span>
                </div>
                <p className="mt-2 text-caption text-aurora-200/90">
                  {isAnnual
                    ? 'Soit ≈ 7,42 € / mois — 2 mois offerts.'
                    : 'Sans engagement — résiliable à tout moment.'}
                </p>
                <p className="mt-3 text-caption text-ivory-300/95 leading-relaxed">
                  Accès complet : guidance quotidienne + 100 messages chat inclus chaque mois.
                  Packs extras disponibles si tu en as besoin.
                </p>
              </div>

              <p className="text-micro uppercase tracking-[0.2em] text-aurora-200/85 mb-4">Inclus</p>
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
                disabled={loading}
                iconLeft={<Sparkles className="w-4 h-4" />}
                iconRight={<ArrowRight className="w-4 h-4" />}
                className="landing-primary-cta-glow shadow-none"
              >
                {loading
                  ? 'Redirection…'
                  : fromOnboarding
                    ? 'Valider mon essai 7 jours'
                    : 'Commencer mon essai 7 jours'}
              </Button>

              <p className="text-center mt-4 text-caption text-ivory-400/90 leading-relaxed">
                Carte bancaire requise pour l'essai · résiliation en un clic depuis ton profil
              </p>
              <p className="text-center mt-1 text-[11px] text-ivory-500">
                TVA non applicable — art. 293B CGI
              </p>
            </div>
          </Card>
        </motion.div>

        {/* ── Section packs extras ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-aurora-300" />
            <p className="text-caption text-ivory-300 uppercase tracking-widest">Packs de messages extras</p>
          </div>
          <p className="text-caption text-ivory-400 mb-5">
            Si tu épuises tes 100 messages avant le renouvellement, tu peux acheter des crédits supplémentaires — valables 12 mois.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  'relative rounded-xl border p-4 flex flex-col items-center gap-1.5 text-center',
                  pack.popular
                    ? 'border-aurora-400/60 bg-aurora-500/8'
                    : 'border-night-600/50 bg-night-800/40',
                )}
              >
                {pack.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-aurora-500 text-night-950 whitespace-nowrap">
                    Le plus populaire ✨
                  </span>
                )}
                <span className="text-xl leading-none">{pack.emoji}</span>
                <span className="text-xs font-semibold text-ivory-200">{pack.name}</span>
                <span className="text-[11px] text-ivory-400">{pack.messages} messages</span>
                <span className={cn('text-sm font-bold mt-1', pack.popular ? 'text-aurora-300' : 'text-ivory-100')}>
                  {pack.price} €
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ivory-500 text-center">
            Les packs sont accessibles depuis le chat une fois abonné.
          </p>
        </motion.div>

        {/* ── Garanties ── */}
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
            onClick={() => navigate(-1)}
            iconLeft={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Retour
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
