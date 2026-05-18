import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSubscription } from '../lib/hooks/useSubscription';

interface ChatEnergyMeterProps {
  className?: string;
  onBuyPack?: () => void;
}

function getMeterColor(pct: number): string {
  if (pct > 50) return 'from-aurora-400 to-aurora-300';
  if (pct > 20) return 'from-aurora-500 to-magenta-400';
  return 'from-magenta-500 to-amber-400';
}

function getMeterTextColor(pct: number): string {
  if (pct > 50) return 'text-aurora-300';
  if (pct > 20) return 'text-magenta-300';
  return 'text-amber-300';
}

export function ChatEnergyMeter({ className, onBuyPack }: ChatEnergyMeterProps) {
  const { messagesUsed, messagesIncluded, extraBalance, totalAvailable, daysUntilReset } =
    useSubscription();

  const remaining = totalAvailable;
  // Pourcentage visuel : ratio des messages restants sur la capacité totale du cycle
  // (inclus + extras), clampé 0-100. Évite de passer en orange si l'user a acheté
  // des packs extras au-delà du quota inclus.
  const capacity = Math.max(messagesIncluded + extraBalance, messagesIncluded);
  const pct = capacity > 0 ? Math.max(0, Math.min(100, (remaining / capacity) * 100)) : 0;
  const colorClass = getMeterColor(pct);
  const textColorClass = getMeterTextColor(pct);

  // Masque la jauge tant que moins de 5 messages ont été consommés — pas de bruit inutile
  if ((messagesUsed ?? 0) < 5 && pct > 80) return null;

  const label = pct > 20
    ? `${remaining} msg restant${remaining !== 1 ? 's' : ''}`
    : remaining === 0
      ? 'Plus de messages — recharge ?'
      : `${remaining} msg — bientôt épuisé`;

  return (
    <div className={cn('group relative', className)}>
      {/* Trigger zone */}
      <div className="flex items-center gap-2 cursor-default">
        <Sparkles className={cn('w-3.5 h-3.5 shrink-0', textColorClass)} />
        <span className={cn('text-xs font-medium tabular-nums', textColorClass)}>
          {label}
        </span>
        <div className="w-16 h-1 rounded-full bg-night-700/80 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', colorClass)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Tooltip on hover */}
      <div
        className={cn(
          'absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl',
          'bg-night-900/95 border border-night-600/60 backdrop-blur-sm',
          'p-3 shadow-xl text-xs text-ivory-300',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-all duration-200',
          onBuyPack ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <p className="font-semibold text-ivory-100 mb-2">Énergie cosmique</p>
        <div className="space-y-1 text-ivory-400">
          <div className="flex justify-between">
            <span>Inclus ce cycle</span>
            <span className="text-ivory-200 font-medium">{messagesIncluded - messagesUsed} / {messagesIncluded}</span>
          </div>
          {extraBalance > 0 && (
            <div className="flex justify-between">
              <span>Extras achetés</span>
              <span className="text-aurora-300 font-medium">+{extraBalance}</span>
            </div>
          )}
          {daysUntilReset !== null && (
            <div className="flex justify-between mt-1 pt-1 border-t border-night-600/40">
              <span>Recharge dans</span>
              <span className="text-ivory-300">{daysUntilReset}j</span>
            </div>
          )}
        </div>
        {onBuyPack && (
          <button
            onClick={onBuyPack}
            className="mt-3 w-full rounded-lg bg-aurora-500/20 border border-aurora-400/40 text-aurora-200 text-xs font-semibold py-1.5 hover:bg-aurora-500/30 transition-colors"
          >
            + Acheter des messages extras
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatEnergyMeter;
