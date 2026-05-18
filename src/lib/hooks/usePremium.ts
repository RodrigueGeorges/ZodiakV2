import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { Plan } from '../types/supabase';
import { useSubscription } from './useSubscription';

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
 * @deprecated Utilise `useSubscription` à la place pour le nouveau modèle
 * économique (forfait 8,90 €/mois + 100 messages inclus + packs extras).
 * Ce hook est conservé en wrapper rétrocompatible pour les composants
 * legacy qui consomment encore `isPremium` ou `quotas`. À supprimer après
 * la migration complète.
 */
export function usePremium(): UsePremiumReturn {
  const { profile } = useAuth();
  const { isActive, status, trialDaysLeft } = useSubscription();

  return useMemo<UsePremiumReturn>(() => {
    const plan: Plan = (profile?.plan as Plan | undefined) ?? 'free';
    const isTrial = status === 'trial';

    return {
      plan,
      isPremium: isActive,
      isTrial,
      trialDaysLeft,
      quotas: isActive ? PREMIUM : FREE,
    };
  }, [profile?.plan, isActive, status, trialDaysLeft]);
}
