import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageLayout from './PageLayout';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useSubscription } from '../lib/hooks/useSubscription';
import { track } from '../lib/analytics';

/**
 * Écran paywall affiché sur les routes protégées quand l'abonnement n'est plus
 * actif (status = 'expired' | 'cancelled' avec date dépassée).
 *
 * Différencie deux cas :
 *   - jamais abonné / expired : encourage la souscription (trial 7j)
 *   - cancelled avec date passée : encourage la réactivation
 */
export default function SubscriptionExpiredScreen() {
  const navigate = useNavigate();
  const { status, subscriptionEndsAt } = useSubscription();

  const isCancelled = status === 'cancelled';
  const title = isCancelled
    ? 'Ton abonnement est arrivé à terme'
    : 'Reprends ton voyage cosmique';
  const lead = isCancelled
    ? 'Tu peux le réactiver à tout moment pour retrouver guidance et chat astral.'
    : 'Ton essai est terminé. Active Zodiak Astro Premium pour continuer.';

  const handleSubscribe = () => {
    track('paywall_clicked_subscribe', { source: 'subscription_expired_screen' });
    navigate('/subscribe');
  };

  return (
    <PageLayout
      eyebrow="Accès Premium"
      title={title}
      subtitle={lead}
      maxWidth="lg"
      showLogo={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl mx-auto"
      >
        <Card
          variant="elevated"
          className="relative overflow-hidden rounded-2xl border-aurora-400/45"
        >
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
          />
          <div className="relative p-8 md:p-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-aurora-500/15 mb-5">
              <Moon className="w-6 h-6 text-aurora-300" aria-hidden />
            </div>

            <p className="eyebrow-ritual text-aurora-200/95 mb-3">
              Zodiak Astro Premium
            </p>
            <h2 className="font-display italic-editorial text-h2 text-ivory-50 leading-tight mb-4">
              {isCancelled ? 'Réactive ton accès' : 'Active ton essai 7 jours'}
            </h2>

            <p className="text-body text-ivory-300 mb-6 max-w-md">
              Guidance quotidienne illimitée · 100 messages chat inclus par mois ·
              Calendrier 30 jours · Synastries illimitées.
            </p>

            <div className="landing-price-well rounded-xl border border-aurora-400/22 px-5 py-4 mb-7">
              <div className="flex items-end gap-2 justify-center">
                <span className="font-display font-extralight text-display-md text-ivory-50 leading-none tracking-[-0.03em]">
                  8,90&nbsp;€
                </span>
                <span className="text-body text-aurora-100/90 pb-1 font-medium">/ mois</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleSubscribe}
              iconLeft={<Sparkles className="w-4 h-4" />}
              iconRight={<ArrowRight className="w-4 h-4" />}
              className="min-w-[240px]"
            >
              {isCancelled ? 'Réactiver mon abonnement' : 'Commencer mon essai 7 jours'}
            </Button>

            {subscriptionEndsAt && isCancelled && (
              <p className="mt-5 text-caption text-ivory-400/85">
                Précédent abonnement expiré le{' '}
                {subscriptionEndsAt.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}

            <p className="mt-3 text-caption text-ivory-500">
              Résiliable en 1 clic · TVA incluse selon ton pays
            </p>
          </div>
        </Card>
      </motion.div>
    </PageLayout>
  );
}
