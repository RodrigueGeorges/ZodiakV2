import { useCallback, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { supabase } from '../supabase';
import type { MoodKey, MoodLog } from '../types/supabase';
import { useAuth } from './useAuth';

interface UseMoodReturn {
  todayMood: MoodLog | null;
  history: MoodLog[];
  loading: boolean;
  /** Enregistre/écrase le mood du jour. */
  logMood: (mood: MoodKey, intensity?: number, note?: string) => Promise<MoodLog | null>;
}

const TZ_FALLBACK = 'Europe/Paris';

function localDateToday(timezone?: string | null): string {
  const tz = timezone || TZ_FALLBACK;
  return DateTime.now().setZone(tz).toISODate() || DateTime.now().toISODate()!;
}

export function useMood(): UseMoodReturn {
  const { user, profile } = useAuth();
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null);
  const [history, setHistory] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const today = localDateToday(profile?.timezone);
      const since = DateTime.now().minus({ days: 30 }).toISODate();

      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: false });

      if (error) throw error;
      const rows = (data as MoodLog[]) ?? [];
      setHistory(rows);
      setTodayMood(rows.find((r) => r.date === today) ?? null);
    } catch (err) {
      console.warn('[useMood] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.timezone]);

  const logMood = useCallback(
    async (mood: MoodKey, intensity = 50, note?: string): Promise<MoodLog | null> => {
      if (!user?.id) return null;
      const today = localDateToday(profile?.timezone);

      const payload = {
        user_id: user.id,
        date: today,
        mood,
        intensity,
        note: note ?? null,
      };

      const { data, error } = await supabase
        .from('mood_logs')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) {
        console.warn('[useMood] upsert failed:', error);
        return null;
      }
      const row = data as MoodLog;
      setTodayMood(row);
      setHistory((prev) => [row, ...prev.filter((h) => h.date !== today)]);
      return row;
    },
    [user?.id, profile?.timezone]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { todayMood, history, loading, logMood };
}
