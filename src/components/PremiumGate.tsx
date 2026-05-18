import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../lib/hooks/usePremium';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { track } from '../lib/analytics';
import { cn } from '../lib/utils';

interface PremiumGateProps {
  children: ReactNode;
  /** Feature concernée — sert à logger l'event paywall_seen + au copy. */
  feature: string;
  /** Titre du paywall. */
  title?: string;
  /** Sous-titre (raison de la limite). */
  description?: string;
  /** Forcer le gate même si l'user est premium (debug). */
  forceLocked?: boolean;
  /**
   * Mode preview : on rend les enfants floutés derrière le paywall pour
   * créer le désir. Sinon, on remplace complètement les enfants.
   */
  preview?: boolean;
  className?: string;
}

/**
 * Gate de feature premium. Pattern Hooked / Tinder-like : on laisse voir
 * un peu, on bloque l'action, CTA explicite.
 */
export default function PremiumGate({
  children,
  feature,
  title = 'Débloquer Zodiak Premium',
  description = 'Accède à la guidance quotidienne + 100 messages chat astral inclus par cycle, calibrés sur ton thème natal.',
  forceLocked,
  preview = true,
  className,
}: PremiumGateProps) {
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const locked = forceLocked || !isPremium;

  if (!locked) return <>{children}</>;

  const handleSubscribe = () => {
    track('paywall_clicked_subscribe', { feature });
    navigate('/subscribe');
  };

  // Log à la première visualisation
  if (typeof window !== 'undefined') {
    queueMicrotask(() => track('paywall_seen', { feature }));
  }

  return (
    <div className={cn('relative', className)}>
      {preview && (
        <div
          className="pointer-events-none select-none blur-[6px] opacity-50"
          aria-hidden="true"
        >
          {children}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={preview ? 'absolute inset-0 flex items-center justify-center p-4' : ''}
      >
        <Card variant="elevated" className="relative overflow-hidden max-w-lg mx-auto">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/15 via-magenta-500/10 to-amber-500/10"
          />
          <div className="relative p-7 md:p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-aurora-500/20 ring-1 ring-aurora-400/40 flex items-center justify-center">
              <Lock className="w-6 h-6 text-aurora-200" aria-hidden="true" />
            </div>
            <div>
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
                Premium
              </p>
              <h3 className="font-display font-medium text-h3 text-ivory-50">{title}</h3>
              <p className="text-caption text-ivory-300 mt-2 max-w-sm">{description}</p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubscribe}
              iconLeft={<Sparkles className="w-4 h-4" />}
            >
              Débloquer Zodiak Premium
            </Button>
            <p className="text-micro text-ivory-400">Essai 7 jours · 8,90&nbsp;€/mois · résiliable en 1 clic</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
