import { useEffect, useRef, useState } from 'react';
import { Copy, Check, RefreshCw, MessageCircle, Instagram } from 'lucide-react';
import { toast } from '../lib/toast';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

/**
 * PairingCode — DA aurora.
 *
 * Génère un code 6 chiffres via la fonction SQL `generate_pairing_code`,
 * affiche un compte à rebours (15min), un bouton copie, et un deep link
 * direct vers WhatsApp ou Instagram.
 */
interface PairingCodeProps {
  channel: 'whatsapp' | 'instagram';
  userId: string;
  zodiakWhatsAppNumber?: string;
  zodiakInstagramHandle?: string;
}

export default function PairingCode({
  channel,
  userId,
  zodiakWhatsAppNumber = '33000000000',
  zodiakInstagramHandle = 'zodiak.app',
}: PairingCodeProps) {
  const [code, setCode] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        'generate_pairing_code',
        { p_user_id: userId }
      );
      if (rpcError) throw rpcError;
      if (!data) throw new Error('Réponse vide.');
      setCode(String(data));
      setGeneratedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de générer le code.');
      toast.error('Erreur lors de la génération du code.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copié.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copie impossible — sélectionne manuellement.');
    }
  };

  const remainingMs =
    generatedAt !== null
      ? Math.max(0, generatedAt + 15 * 60 * 1000 - Date.now())
      : 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);
  const expired = generatedAt !== null && remainingMs === 0;

  const isWA = channel === 'whatsapp';
  const channelLabel = isWA ? 'WhatsApp' : 'Instagram';
  const deepLinkLabel = isWA
    ? `wa.me/${zodiakWhatsAppNumber}`
    : `ig.me/m/${zodiakInstagramHandle}`;
  const deepLinkUrl = isWA
    ? `https://wa.me/${zodiakWhatsAppNumber}?text=${code ?? ''}`
    : `https://ig.me/m/${zodiakInstagramHandle}`;
  const Icon = isWA ? MessageCircle : Instagram;

  return (
    <div className="rounded-2xl border border-aurora-500/20 bg-night-900/60 backdrop-blur-md p-5 space-y-4">
      {!code ? (
        <Button
          variant="secondary"
          fullWidth
          loading={loading}
          onClick={generate}
          iconLeft={<Icon className="w-4 h-4" />}
        >
          Lier mon {channelLabel}
        </Button>
      ) : (
        <>
          <div>
            <p className="text-micro uppercase tracking-[0.18em] text-aurora-300 mb-2">
              Étape 1 · Copie ton code
            </p>
            <div className="flex items-center gap-2">
              <div
                role="code"
                aria-label={`Code de jumelage ${code}`}
                className="flex-1 text-center text-2xl md:text-3xl tracking-[0.4em] font-mono font-semibold text-ivory-50 bg-night-800/80 border border-night-700 py-4 rounded-xl select-all"
              >
                {code}
              </div>
              <button
                type="button"
                onClick={copy}
                className="p-3.5 rounded-xl bg-aurora-500/15 hover:bg-aurora-500/25 transition-colors text-aurora-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300"
                aria-label="Copier le code"
              >
                {copied ? (
                  <Check className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Copy className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-micro uppercase tracking-[0.18em] text-aurora-300 mb-2">
              Étape 2 · Envoie-le à
            </p>
            <a
              href={deepLinkUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-body text-ivory-100 hover:text-aurora-200 transition-colors underline-offset-2 hover:underline"
            >
              <Icon className="w-4 h-4 text-aurora-300" aria-hidden="true" />
              {deepLinkLabel}
            </a>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-caption ${
                expired
                  ? 'text-magenta-400'
                  : remainingMs < 2 * 60 * 1000
                  ? 'text-amber-300'
                  : 'text-ivory-400'
              }`}
              aria-live="polite"
            >
              {expired
                ? 'Code expiré'
                : `Valide ${String(remainingMin).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`}
            </span>
            <Button
              variant="text"
              size="sm"
              onClick={generate}
              loading={loading}
              iconLeft={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Nouveau code
            </Button>
          </div>
        </>
      )}

      {error && (
        <p className="text-caption text-magenta-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
