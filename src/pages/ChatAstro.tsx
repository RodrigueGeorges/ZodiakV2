import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useChatMemory } from '../lib/hooks/useChatMemory';
import { usePremium } from '../lib/hooks/usePremium';
import { useSubscription } from '../lib/hooks/useSubscription';
import { useMood } from '../lib/hooks/useMood';
import { ChatEnergyMeter } from '../components/ChatEnergyMeter';
import { UpgradePackModal } from '../components/UpgradePackModal';
import PremiumGate from '../components/PremiumGate';
import { moonPhaseAt } from '../lib/moonPhase';
import { vibrate } from '../lib/haptics';
import { track } from '../lib/analytics';
import { MOOD_LABELS } from '../components/MoodCheck';
import { cn } from '../lib/utils';
import { useDocumentSeo } from '../lib/documentSeo';

const BASE_SUGGESTIONS = [
  'Quels sont mes points forts selon mon thème ?',
  'À quoi m\'attendre cette semaine ?',
  'Un conseil pour mon couple ?',
  'Quel mantra me correspond aujourd\'hui ?',
  'Pourquoi je me sens fatigué·e ?',
  'Quels transits m\'influencent ce mois-ci ?',
];

interface Message {
  from: 'user' | 'bot';
  text: string;
  cta?: { label: string; href: string };
}

/**
 * ChatAstro v3 :
 *  - Mémoire long-terme : persistance Supabase + replay des derniers messages
 *  - Suggestions contextuelles : adaptées au mood + à la phase lunaire
 *  - Quota : 100 messages chat inclus/cycle + extras achetables (UpgradePackModal)
 *  - Streaming visuel inchangé (typing letter-by-letter)
 */
export default function ChatAstro() {
  const navigate = useNavigate();
  const { profile, user, isLoading } = useAuth();
  const { recentMessages, appendMessage } = useChatMemory();
  const { todayMood } = useMood();
  const { isPremium } = usePremium(); // @deprecated — gardé pour analytics
  const { isActive } = useSubscription();
  const firstName = profile?.name?.split(' ')[0] || 'voyageur';
  const natalChart = profile?.natal_chart
    ? typeof profile.natal_chart === 'string'
      ? JSON.parse(profile.natal_chart)
      : profile.natal_chart
    : null;

  const [conversationId, setConversationId] = useState<string | null>(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('astro_conversation_id')
      : null
  );

  const greeting = useMemo<Message>(
    () => ({
      from: 'bot',
      text: `Bienvenue ${firstName}. Je me souviens de nos conversations — pose-moi une question sur ton thème, ta guidance ou ta vie.`,
    }),
    [firstName]
  );

  const initialMessages = useMemo<Message[]>(() => {
    // Si on a un historique récent en DB, on le rejoue (max 10 messages)
    if (recentMessages.length > 0) {
      const replay = recentMessages.slice(-10).map<Message>((m) => ({
        from: m.role === 'assistant' ? 'bot' : 'user',
        text: m.content,
      }));
      return [greeting, ...replay];
    }
    return [greeting];
  }, [recentMessages, greeting]);

  const [messages, setMessages] = useState<Message[]>([greeting]);
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll auto en bas
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading, typingText]);

  // Reset si changement d'utilisateur
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setConversationId(null);
    localStorage.removeItem('astro_conversation_id');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Toast inline après paiement réussi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const subscribed = params.get('subscribed');
    const packSuccess = params.get('pack_success');
    if (!subscribed && !packSuccess) return;

    // Nettoie l'URL sans rechargement
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    const msg: Message = subscribed
      ? {
          from: 'bot',
          text: `Bienvenue dans Zodiak Astro Premium, ${firstName} ! Ton abonnement est actif — tu disposes de 100 messages chat inclus par mois. Bonne exploration ✨`,
        }
      : {
          from: 'bot',
          text: `Tes crédits supplémentaires ont bien été ajoutés à ton solde. Continue à poser tes questions — ton guide est là.`,
        };

    // Délai court pour laisser les messages initiaux s'afficher
    const t = setTimeout(() => {
      setMessages((m: Message[]) => [...m, msg]);
    }, 600);
    return () => clearTimeout(t);
  // firstName peut changer après chargement du profil — on ne le met pas en dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missingName = !profile?.name;
  const missingBirth = !profile?.natal_chart;
  const profileIncomplete = !user?.id || missingName || missingBirth;

  // Suggestions contextuelles
  const contextSuggestions = useMemo<string[]>(() => {
    const out: string[] = [];
    const phase = moonPhaseAt(new Date());
    if (phase.kind === 'new') {
      out.push('Quelle intention poser pour cette nouvelle lune ?');
    } else if (phase.kind === 'full') {
      out.push('Que vient révéler cette pleine lune dans ma vie ?');
    }
    if (todayMood) {
      const moodFr = MOOD_LABELS[todayMood.mood].toLowerCase();
      out.push(`Pourquoi je me sens ${moodFr} aujourd'hui ?`);
    }
    return out;
  }, [todayMood]);

  const allSuggestions = useMemo(
    () => [...contextSuggestions, ...BASE_SUGGESTIONS].slice(0, 8),
    [contextSuggestions]
  );

  // Quota vérifié côté serveur (402) — plus de gating client-side

  useDocumentSeo({
    title: profileIncomplete
      ? 'Chat astral · compléter ton profil — Zodiak Astro'
      : 'Chat astral & thème natal — Zodiak Astro',
    description: profileIncomplete
      ? 'Complète ton nom et tes données de naissance pour activer le guide astral Zodiak Astro, calé sur ton thème natal.'
      : 'Pose tes questions à un guide qui connaît ton thème natal et ton historique — 100 messages chat inclus par mois avec Zodiak Astro Premium (8,90 € / mois, essai 7 jours).',
  });

  const send = async (suggestion?: string) => {
    const question = (suggestion || input).trim();
    if (!question || loading) return;
    if (profileIncomplete) {
      setMessages((m: Message[]) => [
        ...m,
        {
          from: 'bot',
          text: 'Ton profil est incomplet. Va sur Profil pour ajouter ton nom et tes infos de naissance.',
        },
      ]);
      return;
    }
    setMessages((m: Message[]) => [...m, { from: 'user', text: question }]);
    setInput('');
    setLoading(true);
    setTypingText('');
    vibrate('tap');
    track('chat_message_sent', {
      mood: todayMood?.mood,
      moon: moonPhaseAt(new Date()).kind,
      premium: isPremium,
    });
    await appendMessage('user', question);

    try {
      const res = await fetch('/.netlify/functions/astro-chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          firstName,
          natalChart,
          userId: user?.id,
          conversationId,
          // Contexte enrichi pour la mémoire
          mood: todayMood?.mood,
          moonPhase: moonPhaseAt(new Date()).kind,
          recentExchanges: recentMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      // 402 → quota épuisé → modal paywall
      if (res.status === 402) {
        track('paywall_modal_shown', { source: 'chat_quota' });
        setShowUpgradeModal(true);
        setMessages((m: Message[]) => m.slice(0, -1)); // retire le message user optimiste
        return;
      }

      // 403 → abonnement inactif
      if (res.status === 403) {
        setMessages((m: Message[]) => [
          ...m,
          {
            from: 'bot',
            text: 'Ton abonnement est inactif. Renouvelle-le pour continuer à dialoguer avec ton guide astral.',
            cta: { label: 'Renouveler mon abonnement', href: '/subscribe' },
          },
        ]);
        return;
      }

      const data = await res.json() as {
        answer?: string;
        conversationId?: string;
        error?: string;
        source?: 'included' | 'extra' | null;
      };

      // PostHog : tracker la consommation réelle (après succès API) avec la source
      if (data.source) {
        track('chat_message_consumed', { source: data.source });
      }

      if (data.error) {
        setMessages((m: Message[]) => [
          ...m,
          { from: 'bot', text: 'Désolé, une erreur est survenue. Réessaie dans un instant.' },
        ]);
        return;
      }

      if (data.answer) {
        setConversationId(data.conversationId);
        if (data.conversationId) {
          try {
            localStorage.setItem('astro_conversation_id', data.conversationId);
          } catch {
            /* ignore */
          }
        }
        const fullText = data.answer as string;
        await appendMessage('assistant', fullText, {
          conversation_id: data.conversationId,
        });

        let i = 0;
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        const typeLetter = () => {
          setTypingText((prev) => prev + fullText[i]);
          i++;
          if (i < fullText.length) {
            typingTimeout.current = setTimeout(
              typeLetter,
              10 + Math.random() * 18
            );
          } else {
            setMessages((m: Message[]) => [...m, { from: 'bot', text: fullText }]);
            setTypingText('');
          }
        };
        typeLetter();
      }
    } catch {
      setMessages((m: Message[]) => [
        ...m,
        { from: 'bot', text: 'Erreur réseau. Réessaie plus tard.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Connexion à ton guide…" />;
  }

  if (profileIncomplete) {
    const missing: string[] = [];
    if (missingName) missing.push('ton prénom');
    if (missingBirth) missing.push('ta date, heure et lieu de naissance');

    return (
      <PageLayout
        eyebrow="Guide astral"
        title="Complète ton profil"
        subtitle="Le guide astral se calibre sur ton thème natal — il a besoin de quelques infos pour personnaliser ses réponses."
      >
        <Card variant="surface">
          <div className="p-8 flex flex-col items-center gap-5 text-center">
            <p className="text-body text-ivory-300">
              Il manque encore{' '}
              <span className="text-ivory-100 font-medium">
                {missing.join(' et ')}
              </span>{' '}
              pour activer ton guide.
            </p>
            <Button
              variant="primary"
              iconLeft={<Sparkles className="w-4 h-4" />}
              onClick={() => navigate('/profile')}
            >
              Compléter mon profil
            </Button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  if (!isActive) {
    return (
      <PageLayout
        eyebrow="Guide astral"
        title="Chat réservé aux abonnés"
        subtitle="Active Zodiak Astro Premium pour poser tes questions à ton guide astral — 100 messages inclus par mois."
        maxWidth="lg"
        showLogo={false}
      >
        <PremiumGate
          feature="chat_astral"
          preview={false}
          title="Débloquer le chat astral"
          description="Guidance quotidienne + 100 messages chat par mois, calibrés sur ton thème natal. Essai 7 jours avec carte."
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow="Guide astral"
      title="Pose tes questions"
      subtitle="Une conversation directe avec ton thème natal en mémoire — pour compléter ta guidance WhatsApp ou Instagram."
      maxWidth="3xl"
      showLogo={false}
      dim
      headerSlot={isActive ? <ChatEnergyMeter onBuyPack={() => setShowUpgradeModal(true)} /> : undefined}
    >
      <Card variant="elevated" className="relative overflow-hidden flex flex-col">
        <div
          ref={chatRef}
          className="relative flex-1 overflow-y-auto p-7 space-y-4 max-h-[58vh] min-h-[360px]"
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
              }}
              className={cn(
                'flex',
                msg.from === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-4 py-3 text-body whitespace-pre-line',
                  msg.from === 'user'
                    ? 'bg-aurora-500 text-night-950'
                    : 'bg-night-800/80 text-ivory-100 border border-white/[0.1]'
                )}
              >
                {msg.from === 'bot' && (
                  <span className="inline-flex items-center gap-1.5 eyebrow-ritual mb-1">
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    Guide
                  </span>
                )}
                <div>
                  {msg.from === 'bot' && <br />}
                  {msg.text}
                </div>
                {msg.cta && (
                  <button
                    onClick={() => navigate(msg.cta!.href)}
                    className="mt-3 w-full rounded-lg bg-aurora-500/20 border border-aurora-400/40 text-aurora-200 text-xs font-semibold py-2 px-3 hover:bg-aurora-500/30 transition-colors"
                  >
                    {msg.cta.label}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {typingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-night-800/80 text-ivory-100 border border-white/[0.1]">
                <span className="inline-flex items-center gap-1.5 eyebrow-ritual mb-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  Guide
                </span>
                <br />
                {typingText}
                <span className="inline-block w-2 h-4 align-middle bg-aurora-300 ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !typingText && (
            <div className="flex justify-start">
              <div className="rounded-xl px-4 py-3 bg-night-800/80 text-ivory-300 border border-white/[0.1] italic">
                Le guide consulte les étoiles…
              </div>
            </div>
          )}
        </div>

        {/* Suggestions contextuelles */}
        <div className="relative px-7 pt-2 pb-3 border-t border-white/[0.09]">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
            {allSuggestions.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={loading}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-caption transition-colors disabled:opacity-50',
                  i < contextSuggestions.length
                    ? 'border-magenta-500/30 bg-magenta-500/8 hover:bg-magenta-500/15 text-ivory-100'
                    : 'border-aurora-500/25 bg-aurora-500/8 hover:bg-aurora-500/15 text-ivory-200 hover:text-ivory-50'
                )}
              >
                <Sparkles
                  className={cn(
                    'w-3.5 h-3.5',
                    i < contextSuggestions.length
                      ? 'text-magenta-300'
                      : 'text-aurora-300'
                  )}
                />
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="relative flex items-center gap-2 p-4 border-t border-white/[0.09] bg-white/[0.04]"
        >
          <div className="relative flex-1">
            <Input
              className="!pl-9"
              placeholder="Pose ta question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
              hideLabel
            />
            <MessageCircle
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !input.trim()}
            iconLeft={<Send className="w-4 h-4" />}
          >
            Envoyer
          </Button>
        </form>
      </Card>

      <UpgradePackModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={user?.id ?? ''}
        userEmail={user?.email ?? ''}
      />
    </PageLayout>
  );
}
