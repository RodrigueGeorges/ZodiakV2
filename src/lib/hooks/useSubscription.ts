import { useMemo } from 'react';
import { useAuth } from './useAuth';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled';

export interface UseSubscriptionReturn {
  /**
   * true si l'user peut utiliser toutes les features.
   * Inclut : trial, active, past_due (3j de grâce Stripe Smart Retries),
   *          cancelled tant que subscription_ends_at > now (accès résiduel).
   */
  isActive: boolean;
  status: SubscriptionStatus;
  /** Date de fin d'accès si l'abo est annulé (cancel_at_period_end). */
  subscriptionEndsAt: Date | null;
  /** Messages consommés sur le cycle en cours. */
  messagesUsed: number;
  /** Messages inclus dans le forfait (100 par défaut). */
  messagesIncluded: number;
  /** Solde de messages extras achetés. */
  extraBalance: number;
  /** Total disponible = restants inclus + extras. */
  totalAvailable: number;
  /** Jours avant le prochain reset (null si inconnu). */
  daysUntilReset: number | null;
  /** Date de fin de trial (null si pas en trial). */
  trialEndsAt: Date | null;
  /** Jours restants de trial (null si pas en trial). */
  trialDaysLeft: number | null;
}

export function useSubscription(): UseSubscriptionReturn {
  const { profile } = useAuth();

  return useMemo<UseSubscriptionReturn>(() => {
    const rawStatus = profile?.subscription_status ?? 'expired';
    const status: SubscriptionStatus =
      rawStatus === 'trial' ||
      rawStatus === 'active' ||
      rawStatus === 'past_due' ||
      rawStatus === 'cancelled'
        ? rawStatus
        : 'expired';

    // Accès résiduel après annulation : Stripe garde l'abo actif jusqu'à
    // la fin de la période payée (cancel_at_period_end).
    let subscriptionEndsAt: Date | null = null;
    if (profile?.subscription_ends_at) {
      subscriptionEndsAt = new Date(profile.subscription_ends_at);
    }
    const cancelledButStillValid =
      status === 'cancelled' && subscriptionEndsAt !== null && subscriptionEndsAt.getTime() > Date.now();

    // past_due → 3 jours de grâce gérés par Stripe Smart Retries (status reste actif côté app)
    const isActive =
      status === 'trial' ||
      status === 'active' ||
      status === 'past_due' ||
      cancelledButStillValid;

    const messagesUsed = profile?.messages_used_this_period ?? 0;
    const messagesIncluded = profile?.messages_included_per_period ?? 100;
    const extraBalance = profile?.extra_balance ?? 0;
    const remainingIncluded = Math.max(0, messagesIncluded - messagesUsed);
    const totalAvailable = remainingIncluded + extraBalance;

    let daysUntilReset: number | null = null;
    if (profile?.period_resets_at) {
      const ms = new Date(profile.period_resets_at).getTime() - Date.now();
      daysUntilReset = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    let trialEndsAt: Date | null = null;
    let trialDaysLeft: number | null = null;
    if (status === 'trial' && profile?.trial_ends_at) {
      trialEndsAt = new Date(profile.trial_ends_at);
      const ms = trialEndsAt.getTime() - Date.now();
      trialDaysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    return {
      isActive,
      status,
      subscriptionEndsAt,
      messagesUsed,
      messagesIncluded,
      extraBalance,
      totalAvailable,
      daysUntilReset,
      trialEndsAt,
      trialDaysLeft,
    };
  }, [
    profile?.subscription_status,
    profile?.subscription_ends_at,
    profile?.messages_used_this_period,
    profile?.messages_included_per_period,
    profile?.extra_balance,
    profile?.period_resets_at,
    profile?.trial_ends_at,
  ]);
}
