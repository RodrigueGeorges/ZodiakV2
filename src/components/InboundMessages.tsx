import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Loader2, MessageCircle, Instagram } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InteractiveCard from './InteractiveCard';

/**
 * Liste des messages entrants reçus de l'utilisateur via WhatsApp / Instagram.
 *
 * Source : table `message_log` (direction = inbound), filtrée RLS sur
 * `auth.uid() = user_id`. Aucune dépendance à un service Brevo / Vonage côté
 * client (les secrets ne doivent jamais être exposés dans le bundle).
 */

interface InboundRow {
  id: string;
  channel: 'whatsapp' | 'instagram';
  payload: Record<string, unknown> | null;
  sent_at: string;
}

interface InboundMessagesProps {
  userId: string;
}

export function InboundMessages({ userId }: InboundMessagesProps) {
  const [rows, setRows] = useState<InboundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('message_log')
        .select('id, channel, payload, sent_at')
        .eq('user_id', userId)
        .eq('direction', 'inbound')
        .order('sent_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setRows((data ?? []) as InboundRow[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const extractText = (payload: Record<string, unknown> | null): string => {
    if (!payload) return '';
    // WhatsApp Cloud API → message.text.body
    const wa = payload as { text?: { body?: string }; button?: { text?: string } };
    if (wa.text?.body) return wa.text.body;
    if (wa.button?.text) return wa.button.text;
    // Instagram → message.text
    const ig = payload as { message?: { text?: string }; postback?: { title?: string } };
    if (ig.message?.text) return ig.message.text;
    if (ig.postback?.title) return ig.postback.title;
    return '';
  };

  return (
    <InteractiveCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-6 h-6 text-primary" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-primary">Messages reçus</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8" role="status">
          <Loader2 className="w-8 h-8 text-primary animate-spin" aria-hidden="true" />
          <span className="sr-only">Chargement…</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-lg" role="alert">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Aucun message reçu pour le moment
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => {
            const Icon = row.channel === 'whatsapp' ? MessageCircle : Instagram;
            const channelLabel = row.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram';
            return (
              <li key={row.id} className="p-4 bg-primary/10 rounded-lg space-y-2">
                <div className="flex justify-between text-sm text-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {channelLabel}
                  </span>
                  <span>{formatDate(row.sent_at)}</span>
                </div>
                <p className="text-primary whitespace-pre-wrap break-words">
                  {extractText(row.payload)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </InteractiveCard>
  );
}

export default InboundMessages;
