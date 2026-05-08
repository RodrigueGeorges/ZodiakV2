import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { computeSynastry, pickHighlights, scoreVerdict, ChartLite } from '../synastry';
import type { Friend, FriendRelationship, Synastry, Profile, Json } from '../types/supabase';

type NatalChartLite = ChartLite & Record<string, unknown>;

interface FriendWithSynastry extends Friend {
  synastry?: Synastry | null;
}

interface AddFriendPayload {
  name: string;
  relationship?: FriendRelationship;
  birth_date: string;
  birth_time?: string | null;
  birth_place?: string | null;
  avatar_emoji?: string | null;
  /** Carte natale calculée côté front via Netlify function. */
  natal_chart?: NatalChartLite | null;
  natal_summary?: string | null;
}

interface UseFriendsReturn {
  friends: FriendWithSynastry[];
  loading: boolean;
  /** Ajoute un nouvel ami + calcule la synastrie si la carte est fournie. */
  addFriend: (data: AddFriendPayload) => Promise<FriendWithSynastry | null>;
  removeFriend: (friendId: string) => Promise<void>;
  /** Recalcule la synastrie pour un ami (ex: après mise à jour de la carte). */
  recomputeSynastry: (friendId: string) => Promise<Synastry | null>;
  refresh: () => Promise<void>;
}

function getProfileChart(profile: Profile | null | undefined): ChartLite | null {
  if (!profile?.natal_chart || typeof profile.natal_chart !== 'object') return null;
  return profile.natal_chart as ChartLite;
}

export function useFriends(): UseFriendsReturn {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithSynastry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: friendRows }, { data: synastryRows }] = await Promise.all([
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('synastries').select('*').eq('user_id', user.id),
      ]);
      const synastryByFriend = new Map<string, Synastry>();
      (synastryRows as Synastry[] | null)?.forEach((s) =>
        synastryByFriend.set(s.friend_id, s)
      );
      const merged: FriendWithSynastry[] = ((friendRows as Friend[]) ?? []).map(
        (f) => ({ ...f, synastry: synastryByFriend.get(f.id) ?? null })
      );
      setFriends(merged);
    } catch (err) {
      console.warn('[useFriends] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const computeAndSaveSynastry = useCallback(
    async (friend: Friend): Promise<Synastry | null> => {
      if (!user?.id) return null;
      const userChart = getProfileChart(profile);
      const friendChart = (friend.natal_chart as ChartLite | null) ?? null;
      if (!userChart || !friendChart) return null;
      const { aspects, score } = computeSynastry(userChart, friendChart);
      const highlights = pickHighlights(aspects);

      const payload: Partial<Synastry> = {
        user_id: user.id,
        friend_id: friend.id,
        base_score: score,
        aspects: aspects as unknown as Json,
        highlights: highlights as unknown as Json,
        summary: scoreVerdict(score),
      };

      const { data, error } = await supabase
        .from('synastries')
        .upsert(payload, { onConflict: 'user_id,friend_id' })
        .select()
        .single();

      if (error) {
        console.warn('[useFriends] synastry upsert failed:', error);
        return null;
      }
      return data as Synastry;
    },
    [user?.id, profile]
  );

  const addFriend = useCallback(
    async (data: AddFriendPayload): Promise<FriendWithSynastry | null> => {
      if (!user?.id) return null;
      const insertPayload = {
        user_id: user.id,
        name: data.name,
        relationship: data.relationship ?? 'friend',
        birth_date: data.birth_date,
        birth_time: data.birth_time ?? null,
        birth_place: data.birth_place ?? null,
        natal_chart: (data.natal_chart as Json | null) ?? null,
        natal_summary: data.natal_summary ?? null,
        avatar_emoji: data.avatar_emoji ?? null,
      };

      const { data: inserted, error } = await supabase
        .from('friends')
        .insert(insertPayload)
        .select()
        .single();

      if (error || !inserted) {
        console.warn('[useFriends] insert failed:', error);
        return null;
      }
      const friend = inserted as Friend;
      const synastry = await computeAndSaveSynastry(friend);
      const enriched: FriendWithSynastry = { ...friend, synastry };
      setFriends((prev) => [enriched, ...prev]);
      return enriched;
    },
    [user?.id, computeAndSaveSynastry]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!user?.id) return;
      await supabase.from('friends').delete().eq('id', friendId).eq('user_id', user.id);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    },
    [user?.id]
  );

  const recomputeSynastry = useCallback(
    async (friendId: string) => {
      const f = friends.find((x) => x.id === friendId);
      if (!f) return null;
      const synastry = await computeAndSaveSynastry(f);
      if (synastry) {
        setFriends((prev) =>
          prev.map((x) => (x.id === friendId ? { ...x, synastry } : x))
        );
      }
      return synastry;
    },
    [friends, computeAndSaveSynastry]
  );

  return { friends, loading, addFriend, removeFriend, recomputeSynastry, refresh };
}
