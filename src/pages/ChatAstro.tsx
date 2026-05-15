import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, MessageCircle, Lock } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useChatMemory } from '../lib/hooks/useChatMemory';
import { usePremium } from '../lib/hooks/usePremium';
import { useMood } from '../lib/hooks/useMood';
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
}

/**
 * ChatAstro v3 :
 *  - Mémoire long-terme : persistance Supabase + replay des derniers messages
 *  - Suggestions contextuelles : adaptées au mood + à la phase lunaire
 *  - Quota : free = 5 msg/jour, premium = illimité
 *  - Streaming visuel inchangé (typing letter-by-letter)
 */
export default function ChatAstro() {
  const { profile, user, isLoading } = useAuth();
  const { recentMessages, appendMessage } = useChatMemory();
  const { todayMood } = useMood();
  const { isPremium, quotas } = usePremium();
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
  const [todayUserMessages, setTodayUserMessages] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compteur de messages user pour aujourd'hui (quota free)
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const count = recentMessages.filter(
      (m) => m.role === 'user' && m.created_at.slice(0, 10) === todayStr
    ).length;
    setTodayUserMessages(count);
  }, [recentMessages]);

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

  const profileIncomplete = !user?.id || !profile?.natal_chart || !profile?.name;

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

  const quotaReached =
    !isPremium && todayUserMessages >= quotas.chatMessagesPerDay;

  useDocumentSeo({
    title: profileIncomplete
      ? 'Chat astral · compléter ton profil — Zodiak'
      : 'Chat astral & thème natal — Zodiak',
    description: profileIncomplete
      ? 'Complète ton nom et tes données de naissance pour activer le guide astral Zodiak, calé sur ton thème natal.'
      : 'Pose tes questions à un guide qui connaît ton thème natal et ton historique — messages gratuits limités ou illimité en Premium (8,99 € / mois, essai sans CB).',
  });

  const send = async (suggestion?: string) => {
    const question = (suggestion || input).trim();
    if (!question || loading) return;
    if (profileIncomplete) {
      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text: 'Ton profil est incomplet. Va sur Profil pour ajouter ton nom et tes infos de naissance.',
        },
      ]);
      return;
    }
    if (quotaReached) {
      track('paywall_seen', { feature: 'chat_quota' });
      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text: `Tu as atteint la limite de ${quotas.chatMessagesPerDay} messages gratuits aujourd'hui. Passe en Premium pour échanger sans limite.`,
        },
      ]);
      return;
    }

    setMessages((m) => [...m, { from: 'user', text: question }]);
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
    setTodayUserMessages((c) => c + 1);

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
      const data = await res.json();

      if (data.error) {
        setMessages((m) => [
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
            setMessages((m) => [...m, { from: 'bot', text: fullText }]);
            setTypingText('');
          }
        };
        typeLetter();
      }
    } catch {
      setMessages((m) => [
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
    return (
      <PageLayout
        eyebrow="Guide astral"
        title="Profil à compléter"
        subtitle="Renseigne ton nom et ta naissance pour que le guide lise ton thème natal et réponde sur ta guidance."
      >
        <Card variant="surface">
          <div className="p-8 text-center">
            <Button
              variant="primary"
              onClick={() => (window.location.href = '/profile')}
            >
              Compléter mon profil
            </Button>
          </div>
        </Card>
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
      headerSlot={
        !isPremium ? (
          <span className="text-micro text-ivory-300">
            <span className="text-ivory-50 font-semibold">
              {Math.max(0, quotas.chatMessagesPerDay - todayUserMessages)}
            </span>{' '}
            / {quotas.chatMessagesPerDay} aujourd'hui
          </span>
        ) : undefined
      }
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
                disabled={loading || quotaReached}
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
              placeholder={
                quotaReached
                  ? 'Limite atteinte — passe en Premium pour continuer.'
                  : 'Pose ta question…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || quotaReached}
              autoFocus
              hideLabel
            />
            <MessageCircle
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400 pointer-events-none"
              aria-hidden="true"
            />
          </div>
          {quotaReached ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => (window.location.href = '/subscribe')}
              iconLeft={<Lock className="w-4 h-4" />}
            >
              Premium
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !input.trim()}
              iconLeft={<Send className="w-4 h-4" />}
            >
              Envoyer
            </Button>
          )}
        </form>
      </Card>
    </PageLayout>
  );
}
