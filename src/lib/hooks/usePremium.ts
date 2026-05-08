import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Plan } from '../types/supabase';

export interface PremiumQuotas {
  /** Nombre max de messages chat / jour (free uniquement). */
  chatMessagesPerDay: number;
  /** Nombre max de synastries enregistrées (free uniquement). */
  maxFriends: number;
  /** Nombre max d'images partageables / jour (free uniquement). */
  storiesPerDay: number;
  /** Accès au calendrier 30j ? */
  hasCalendar: boolean;
  /** Accès aux alertes transits push (au-delà de la guidance quotidienne) ? */
  hasTransitAlerts: boolean;
  /** Accès à la voix astrale ? */
  hasVoice: boolean;
  /** Accès aux exports HD pour les stories ? */
  hasHDStories: boolean;
}

const FREE: PremiumQuotas = {
  chatMessagesPerDay: 5,
  maxFriends: 1,
  storiesPerDay: 1,
  hasCalendar: false,
  hasTransitAlerts: false,
  hasVoice: false,
  hasHDStories: false,
};

const PREMIUM: PremiumQuotas = {
  chatMessagesPerDay: Infinity,
  maxFriends: Infinity,
  storiesPerDay: Infinity,
  hasCalendar: true,
  hasTransitAlerts: true,
  hasVoice: true,
  hasHDStories: true,
};

interface UsePremiumReturn {
  plan: Plan;
  isPremium: boolean;
  isTrial: boolean;
  trialDaysLeft: number | null;
  /** Quotas effectifs pour cet user (premium = illimité). */
  quotas: PremiumQuotas;
}

/**
 * Source de vérité unique pour savoir si l'user a accès à une feature
 * premium. À utiliser partout (paywalls, gating, copy).
 *
 * Règle business :
 *   - `plan === 'premium' || 'lifetime'` : accès complet.
 *   - `subscription_status === 'trial'`  : accès complet (illimité) pendant
 *     le trial — c'est ce qui convertit.
 *   - sinon : free, quotas du plan free.
 */
export function usePremium(): UsePremiumReturn {
  const { profile } = useAuth();

  return useMemo<UsePremiumReturn>(() => {
    const plan: Plan = (profile?.plan as Plan | undefined) ?? 'free';
    const isLifetimeOrPremium = plan === 'premium' || plan === 'lifetime';
    const isTrial = profile?.subscription_status === 'trial';
    const isPremium = isLifetimeOrPremium || isTrial;

    let trialDaysLeft: number | null = null;
    if (isTrial && profile?.trial_ends_at) {
      const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
      trialDaysLeft = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    }

    return {
      plan,
      isPremium,
      isTrial,
      trialDaysLeft,
      quotas: isPremium ? PREMIUM : FREE,
    };
  }, [profile?.plan, profile?.subscription_status, profile?.trial_ends_at]);
}
