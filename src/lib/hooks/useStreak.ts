import { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { supabase } from '../supabase';
import type { Streak } from '../types/supabase';
import { useAuth } from './useAuth';

interface UseStreakReturn {
  streak: Streak | null;
  loading: boolean;
  /** Marque le jour du jour comme "checked-in" (idempotent). */
  checkIn: () => Promise<Streak | null>;
  /** True si la flamme a été incrémentée à l'instant. */
  justIncremented: boolean;
  /** True si l'utilisateur perd son streak en attendant 24h+ (flamme grise). */
  willBreakSoon: boolean;
}

const TZ_FALLBACK = 'Europe/Paris';

function localDateToday(timezone?: string | null): string {
  const tz = timezone || TZ_FALLBACK;
  return DateTime.now().setZone(tz).toISODate() || DateTime.now().toISODate()!;
}

function localDateYesterday(timezone?: string | null): string {
  const tz = timezone || TZ_FALLBACK;
  return (
    DateTime.now().setZone(tz).minus({ days: 1 }).toISODate() ||
    DateTime.now().minus({ days: 1 }).toISODate()!
  );
}

/**
 * Hook centralisant la flamme cosmique.
 *
 * Règles :
 *  - Premier check-in du jour → +1 (ou reset à 1 si la veille n'a pas été cochée).
 *  - Re-check-in dans la même journée → no-op (idempotent).
 *  - Si `last_check_in` < hier (timezone user) → reset à 1.
 *  - `best_count` est le record absolu, mis à jour au passage.
 */
export function useStreak(): UseStreakReturn {
  const { user, profile } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [justIncremented, setJustIncremented] = useState(false);

  const fetchStreak = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setStreak((data as Streak | null) ?? null);
    } catch (err) {
      console.warn('[useStreak] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const checkIn = useCallback(async (): Promise<Streak | null> => {
    if (!user?.id) return null;
    const today = localDateToday(profile?.timezone);
    const yesterday = localDateYesterday(profile?.timezone);

    // 1. Lecture courante
    const { data: current } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let nextCount: number;
    let nextTotal = (current?.total_days ?? 0) + 1;
    let nextBest = current?.best_count ?? 0;

    if (!current) {
      nextCount = 1;
    } else if (current.last_check_in === today) {
      // Déjà coché aujourd'hui — pas d'incrément, on retourne tel quel
      setStreak(current as Streak);
      setJustIncremented(false);
      return current as Streak;
    } else if (current.last_check_in === yesterday) {
      nextCount = (current.current_count ?? 0) + 1;
    } else {
      // Streak cassée
      nextCount = 1;
      nextTotal = (current.total_days ?? 0) + 1;
    }

    if (nextCount > nextBest) nextBest = nextCount;

    const payload = {
      user_id: user.id,
      current_count: nextCount,
      best_count: nextBest,
      last_check_in: today,
      total_days: nextTotal,
    };

    const { data: upserted, error } = await supabase
      .from('streaks')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('[useStreak] upsert failed:', error);
      return null;
    }

    setStreak(upserted as Streak);
    setJustIncremented(true);
    return upserted as Streak;
  }, [user?.id, profile?.timezone]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Le streak va casser si on n'a pas check-in aujourd'hui et que la veille
  // a bien été cochée — UI peut afficher une flamme "à risque".
  const today = localDateToday(profile?.timezone);
  const yesterday = localDateYesterday(profile?.timezone);
  const willBreakSoon =
    !!streak &&
    streak.last_check_in === yesterday &&
    streak.last_check_in !== today &&
    streak.current_count > 0;

  return {
    streak,
    loading,
    checkIn,
    justIncremented,
    willBreakSoon,
  };
}
