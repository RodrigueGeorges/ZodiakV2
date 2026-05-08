import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import type { ChatMemory, ChatMessage } from '../types/supabase';

interface UseChatMemoryReturn {
  memory: ChatMemory | null;
  recentMessages: ChatMessage[];
  loading: boolean;
  appendMessage: (
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, unknown>
  ) => Promise<ChatMessage | null>;
  refresh: () => Promise<void>;
}

const RECENT_LIMIT = 50;

/**
 * Mémoire long-terme du ChatAstro.
 *  - Tous les messages user+assistant sont persistés (`chat_messages`).
 *  - Un résumé condensé (`chat_memory.summary`) est mis à jour côté serveur
 *    par le job de maintenance (sera ajouté dans un sprint suivant si besoin —
 *    pour l'instant le front lit `summary` s'il existe et l'injecte au prompt).
 */
export function useChatMemory(): UseChatMemoryReturn {
  const { user } = useAuth();
  const [memory, setMemory] = useState<ChatMemory | null>(null);
  const [recentMessages, setRecentMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: mem }, { data: msgs }] = await Promise.all([
        supabase.from('chat_memory').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(RECENT_LIMIT),
      ]);
      setMemory((mem as ChatMemory | null) ?? null);
      setRecentMessages(((msgs as ChatMessage[] | null) ?? []).reverse());
    } catch (err) {
      console.warn('[useChatMemory] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const appendMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      metadata?: Record<string, unknown>
    ): Promise<ChatMessage | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role,
          content,
          metadata: (metadata as never) ?? null,
        })
        .select()
        .single();
      if (error) {
        console.warn('[useChatMemory] insert failed:', error);
        return null;
      }
      const msg = data as ChatMessage;
      setRecentMessages((prev) => [...prev, msg].slice(-RECENT_LIMIT));
      return msg;
    },
    [user?.id]
  );

  return { memory, recentMessages, loading, appendMessage, refresh };
}
