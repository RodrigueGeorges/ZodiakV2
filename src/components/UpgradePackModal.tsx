import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface Pack {
  id: string;
  name: string;
  emoji: string;
  messages: number;
  price: number;
  priceId: string;
  popular?: boolean;
}

const PACKS: Pack[] = [
  { id: 'filante', name: 'Étoile Filante', emoji: '⭐', messages: 10, price: 3.99, priceId: import.meta.env.VITE_STRIPE_PRICE_FILANTE ?? '' },
  { id: 'lune', name: 'Pleine Lune', emoji: '🌙', messages: 30, price: 9.99, priceId: import.meta.env.VITE_STRIPE_PRICE_LUNE ?? '', popular: true },
  { id: 'constellation', name: 'Constellation', emoji: '✨', messages: 100, price: 24.99, priceId: import.meta.env.VITE_STRIPE_PRICE_CONSTELLATION ?? '' },
  { id: 'galaxie', name: 'Galaxie', emoji: '🌌', messages: 300, price: 59.99, priceId: import.meta.env.VITE_STRIPE_PRICE_GALAXIE ?? '' },
];

interface UpgradePackModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export function UpgradePackModal({ open, onClose, userId, userEmail }: UpgradePackModalProps) {
  const handleSelect = async (pack: Pack) => {
    if (!pack.priceId) {
      console.warn('VITE_STRIPE_PRICE_* non configuré pour', pack.id);
      return;
    }

    // Redirige vers Stripe Checkout (one-time payment)
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
    if (!stripe) return;

    const res = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: pack.priceId,
        mode: 'payment',
        userId,
        userEmail,
        successUrl: `${window.location.origin}/guide-astral?pack_success=1`,
        cancelUrl: window.location.href,
      }),
    });

    if (!res.ok) {
      console.error('create-checkout-session error:', await res.text());
      return;
    }

    const { sessionId } = await res.json() as { sessionId: string };
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-night-950/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl',
              'sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2',
              'rounded-2xl border border-night-600/60 bg-night-900/98 backdrop-blur-xl',
              'shadow-[0_32px_80px_-24px_rgba(0,0,0,0.9)]',
              'p-6',
            )}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-ivory-500 hover:text-ivory-200 hover:bg-night-700/60 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-aurora-500/15 mb-3">
                <Star className="w-5 h-5 text-aurora-300" />
              </div>
              <h2 className="text-lg font-semibold text-ivory-100">
                Tu as épuisé tes 100 messages ce cycle ✨
              </h2>
              <p className="mt-1 text-sm text-ivory-400">
                Choisis un pack pour continuer ta conversation avec les astres.
              </p>
            </div>

            {/* Packs grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PACKS.map(pack => (
                <button
                  key={pack.id}
                  onClick={() => handleSelect(pack)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl p-4 text-center',
                    'border transition-all duration-200',
                    'hover:scale-[1.03] active:scale-[0.98]',
                    pack.popular
                      ? 'border-aurora-400/70 bg-aurora-500/10 shadow-[0_0_24px_-8px_rgba(56,189,248,0.4)]'
                      : 'border-night-600/50 bg-night-800/60 hover:border-night-500/70',
                  )}
                >
                  {pack.popular && (
                    <span className={cn(
                      'absolute -top-2.5 left-1/2 -translate-x-1/2',
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      'bg-aurora-500 text-night-950 whitespace-nowrap',
                    )}>
                      Le plus populaire ✨
                    </span>
                  )}
                  <span className="text-2xl leading-none">{pack.emoji}</span>
                  <span className="text-xs font-semibold text-ivory-200 leading-tight">{pack.name}</span>
                  <span className="text-xs text-ivory-400">{pack.messages} msgs</span>
                  <span className={cn(
                    'mt-1 text-sm font-bold',
                    pack.popular ? 'text-aurora-300' : 'text-ivory-100',
                  )}>
                    {pack.price.toFixed(2).replace('.', ',')} €
                  </span>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <p className="mt-4 text-center text-[11px] text-ivory-500">
              <Zap className="inline w-3 h-3 mr-0.5 -mt-0.5" />
              Valables 12 mois · TVA incluse selon ton pays · Facture par email
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default UpgradePackModal;
