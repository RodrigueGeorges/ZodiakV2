import React, { useState } from 'react';
import PageLayout from '../components/PageLayout';
import { motion } from 'framer-motion';
import { Sparkle, Send } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';

const SUGGESTIONS = [
  "Quels sont mes points forts selon mon thème natal ?",
  "Que puis-je attendre cette semaine ?",
  "Un conseil pour mon couple ?",
  "Comment surmonter mes défis actuels ?",
  "Quel mantra me correspond aujourd'hui ?",
  "Pourquoi je me sens fatigué(e) en ce moment ?",
  "Comment améliorer mon bien-être ?",
  "Quels transits m'influencent aujourd'hui ?"
];

export default function ChatAstro() {
  const { profile, user } = useAuth();
  const firstName = profile?.name?.split(' ')[0] || 'Utilisateur';
  const natalChart = profile?.natal_chart ? (typeof profile.natal_chart === 'string' ? JSON.parse(profile.natal_chart) : profile.natal_chart) : null;

  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Bienvenue dans le Guide Astral ! Pose-moi une question sur ton thème, ta guidance ou ta vie.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (suggestion?: string) => {
    const question = suggestion || input;
    if (!question.trim()) return;
    setMessages([...messages, { from: 'user', text: question }]);
    setInput('');
    setLoading(true);
    if (!natalChart) {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Pour une réponse personnalisée, complète d\'abord ton profil avec ta date, heure et lieu de naissance.' }]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/.netlify/functions/astro-chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, firstName, natalChart })
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { from: 'bot', text: data.answer || 'Je suis désolé, je n\'ai pas pu générer de réponse pour le moment.' }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Erreur lors de la connexion au guide astral. Réessaie plus tard.' }]);
    }
    setLoading(false);
  };

  return (
    <PageLayout title="Guide Astral" subtitle="Pose tes questions à ton guide astrologique personnel" maxWidth="2xl">
      <div className="flex flex-col flex-1 bg-cosmic-900/80 rounded-2xl shadow-xl border border-primary/20 p-4 overflow-y-auto pb-24 md:pb-0">
        <div className="flex-1 overflow-y-auto space-y-4 pb-2">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`rounded-xl px-4 py-2 max-w-[80%] text-base font-cinzel ${msg.from === 'user' ? 'bg-primary/80 text-cosmic-900' : 'bg-cosmic-800/80 text-primary'} shadow`}>
                {msg.from === 'bot' && <Sparkle className="inline w-4 h-4 mr-1 text-secondary align-middle" />} {msg.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start"><div className="animate-pulse px-4 py-2 bg-cosmic-800/80 text-primary rounded-xl font-cinzel">Le guide réfléchit...</div></div>
          )}
        </div>
        {/* Suggestions de questions */}
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              type="button"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition text-sm font-cinzel"
              onClick={() => handleSend(s)}
              disabled={loading}
            >
              <Sparkle className="w-4 h-4" /> {s}
            </button>
          ))}
        </div>
        <form className="flex gap-2 mt-2" onSubmit={e => { e.preventDefault(); handleSend(); }}>
          <input
            className="flex-1 rounded-lg px-4 py-2 bg-cosmic-800/80 border border-primary/20 text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 font-cinzel"
            placeholder="Pose ta question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button type="submit" className="bg-primary text-cosmic-900 rounded-lg px-4 py-2 font-bold flex items-center gap-1 hover:bg-secondary transition disabled:opacity-50" disabled={loading || !input.trim()}>
            <Send className="w-5 h-5" />
            Envoyer
          </button>
        </form>
      </div>
    </PageLayout>
  );
} 