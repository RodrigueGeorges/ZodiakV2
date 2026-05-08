import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { BADGES, BadgeContext, BadgeDef } from '../badges';
import { vibrate } from '../haptics';
import { track } from '../analytics';
import type { UserBadge } from '../types/supabase';

interface UseBadgesReturn {
  earnedBadges: UserBadge[];
  allBadges: BadgeDef[];
  /** Évalue les conditions et persiste les nouveaux gains. */
  evaluate: (ctx: BadgeContext) => Promise<UserBadge[]>;
  loading: boolean;
}

export function useBadges(): UseBadgesReturn {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      if (error) throw error;
      setEarnedBadges((data as UserBadge[]) ?? []);
    } catch (err) {
      console.warn('[useBadges] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const evaluate = useCallback(
    async (ctx: BadgeContext): Promise<UserBadge[]> => {
      if (!user?.id) return [];
      const earnedIds = new Set(earnedBadges.map((b) => b.badge_id));
      const newlyEarned = BADGES.filter(
        (b) => !earnedIds.has(b.id) && b.earned(ctx)
      );
      if (newlyEarned.length === 0) return [];

      const inserts = newlyEarned.map((b) => ({
        user_id: user.id,
        badge_id: b.id,
      }));
      const { data, error } = await supabase
        .from('user_badges')
        .insert(inserts)
        .select();
      if (error) {
        console.warn('[useBadges] insert failed:', error);
        return [];
      }
      const rows = (data as UserBadge[]) ?? [];
      setEarnedBadges((prev) => [...rows, ...prev]);

      // UX : toast subtil + haptic, un seul par évaluation pour ne pas spammer.
      const first = newlyEarned[0];
      vibrate('streak');
      toast.success(`${first.glyph}  ${first.name}`, {
        duration: 4000,
        style: {
          background: 'rgba(17,17,31,0.95)',
          color: '#FAF7F2',
          border: '1px solid rgba(201,166,255,0.35)',
          fontFamily: 'Cinzel, serif',
        },
      });
      newlyEarned.forEach((b) => track('badge_earned', { badge_id: b.id }));
      return rows;
    },
    [user?.id, earnedBadges]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { earnedBadges, allBadges: BADGES, evaluate, loading };
}
