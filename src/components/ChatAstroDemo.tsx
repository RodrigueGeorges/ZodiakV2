import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface ChatLine {
  from: 'user' | 'bot';
  text: string;
}

const SCRIPT: ChatLine[] = [
  { from: 'user', text: 'Un conseil pour mon couple ce soir ?' },
  {
    from: 'bot',
    text:
      'Vénus en trigone à ta Lune natale adoucit les échanges ce soir. ' +
      'Privilégie l’écoute plutôt que d’avoir raison — ta carte montre un besoin de réassurance, pas de débat.',
  },
];

const SUGGESTIONS = [
  'Un conseil pour mon couple ?',
  'Quels transits m’influencent ?',
  'Quel mantra pour aujourd’hui ?',
];

const ease = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 11000;

function useTypewriter(text: string, active: boolean, speedMs = 14) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      setDisplay(text);
      setDone(true);
      return;
    }
    setDisplay('');
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, speedMs);
    return () => window.clearInterval(id);
  }, [text, active, speedMs, reduceMotion]);

  return { display, done };
}

export default function ChatAstroDemo({ className = '' }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [showUser, setShowUser] = useState(true);
  const [showBot, setShowBot] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const timerRef = useRef<number | null>(null);

  const botLine = SCRIPT[1];
  const { display: typedBot, done: botDone } = useTypewriter(
    botLine.text,
    showBot,
    reduceMotion ? 0 : 12,
  );

  const reset = useCallback(() => {
    setShowBot(false);
    setCycle((c) => c + 1);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setShowBot(true);
      return;
    }
    const t = window.setTimeout(() => setShowBot(true), 800);
    return () => window.clearTimeout(t);
  }, [reduceMotion, cycle]);

  useEffect(() => {
    if (!botDone || reduceMotion || paused) return;
    timerRef.current = window.setTimeout(reset, CYCLE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [botDone, paused, reduceMotion, reset]);

  return (
    <div
      className={cn('relative', className)}
      aria-label="Exemple animé du chat astral"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-magenta-500/[0.05] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Card
        variant="elevated"
        className="relative overflow-hidden rounded-2xl border-magenta-500/20 shadow-[inset_0_1px_0_rgba(236,72,153,0.12),0_28px_72px_-44px_rgba(0,0,0,0.9)]"
      >
        <span
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-magenta-400/50 to-transparent"
        />

        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-magenta-300 shrink-0" aria-hidden />
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium text-ivory-100 truncate">Guide astral</p>
              <p className="text-[10px] text-ivory-400/80 truncate">Dans l’app · mémoire de ton thème</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-aurora-400/25 bg-aurora-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-aurora-200/90">
            100 msg/mois
          </span>
        </div>

        <div className="relative p-5 md:p-6 space-y-3.5 min-h-[280px] max-h-[320px] overflow-hidden">
          {showUser && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex justify-end"
            >
              <div className="max-w-[88%] rounded-xl px-3.5 py-2.5 text-[12px] leading-[1.55] bg-aurora-500 text-night-950">
                {SCRIPT[0].text}
              </div>
            </motion.div>
          )}

          {showBot && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease }}
              className="flex justify-start"
            >
              <div className="max-w-[88%] rounded-xl px-3.5 py-2.5 bg-night-800/80 text-ivory-100 border border-white/[0.1]">
                <span className="inline-flex items-center gap-1 eyebrow-ritual text-[9px] mb-1">
                  <Sparkles className="w-3 h-3" aria-hidden />
                  Guide
                </span>
                <p className="text-[12px] leading-[1.55] whitespace-pre-line">
                  {typedBot}
                  {!botDone && !reduceMotion && (
                    <span className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle bg-aurora-300 animate-pulse" />
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-4 pb-3 border-t border-white/[0.08]">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {SUGGESTIONS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px]',
                  i === 0
                    ? 'border-magenta-500/30 bg-magenta-500/10 text-ivory-100'
                    : 'border-aurora-500/20 bg-aurora-500/8 text-ivory-300/90',
                )}
              >
                {i === 0 && <Sparkles className="w-3 h-3 text-magenta-300" aria-hidden />}
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-night-900/40 px-3 py-2">
            <span className="flex-1 text-[11px] text-ivory-500/80 truncate">Pose ta question…</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-aurora-500/20 text-aurora-300">
              <Send className="w-3.5 h-3.5" aria-hidden />
            </span>
          </div>
        </div>

        <p className="pb-4 text-center text-[10px] text-ivory-500/85 px-4">
          Exemple illustratif — réponses calibrées sur ton thème natal en app.
        </p>
      </Card>
    </div>
  );
}
