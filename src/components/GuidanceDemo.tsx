import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, Briefcase, Flame, Quote } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon } from './icons/SocialChannelIcons';
import type { DeliveryChannel } from './FloatingSocialChannels';

/**
 * GuidanceDemo — aperçu animé d'une guidance quotidienne pour la landing.
 *
 * Séquence : bulle canal (WA/IG) → résumé → piliers → mantra.
 * Alterne WhatsApp / Instagram à chaque exemple.
 */

interface Pillar {
  eyebrow: string;
  label: string;
  icon: typeof Heart;
  score: number;
  text: string;
}

interface Sample {
  channel: DeliveryChannel;
  greeting: string;
  summary: string;
  pillars: Pillar[];
  mantra: string;
}

const SAMPLES: Sample[] = [
  {
    channel: 'whatsapp',
    greeting: 'Bonjour, Léa — ta guidance est prête ✦',
    summary: 'Une journée pour avancer sans forcer : le ciel t’invite à la nuance.',
    pillars: [
      { eyebrow: 'Cœur', label: 'Amour', icon: Heart, score: 82, text: 'Vénus adoucit tes échanges — dis les choses simplement.' },
      { eyebrow: 'Chantiers', label: 'Travail', icon: Briefcase, score: 68, text: 'Mercure éclaire tes idées. Note-les avant midi.' },
      { eyebrow: 'Vitalité', label: 'Énergie', icon: Flame, score: 74, text: 'La Lune en Taureau ancre ton énergie : ralentis, ça te réussit.' },
    ],
    mantra: 'Je choisis la douceur plutôt que la vitesse.',
  },
  {
    channel: 'instagram',
    greeting: 'Bonjour, Thomas — ta guidance est prête ✦',
    summary: 'Le Soleil réchauffe ta confiance : c’est le moment de te montrer.',
    pillars: [
      { eyebrow: 'Cœur', label: 'Amour', icon: Heart, score: 71, text: 'Un élan sincère répare plus qu’un long discours.' },
      { eyebrow: 'Chantiers', label: 'Travail', icon: Briefcase, score: 88, text: 'Mars te donne du cran. Lance ce que tu repoussais.' },
      { eyebrow: 'Vitalité', label: 'Énergie', icon: Flame, score: 79, text: 'Bouge tôt : ton corps réclame de l’air et de la lumière.' },
    ],
    mantra: 'Ce que j’ose aujourd’hui dessine demain.',
  },
  {
    channel: 'whatsapp',
    greeting: 'Bonjour, Camille — ta guidance est prête ✦',
    summary: 'Jour de recueillement : la Lune te demande de ralentir pour mieux sentir.',
    pillars: [
      { eyebrow: 'Cœur', label: 'Amour', icon: Heart, score: 64, text: 'Écoute plus que tu ne réponds — la tendresse est dans le silence.' },
      { eyebrow: 'Chantiers', label: 'Travail', icon: Briefcase, score: 58, text: 'Range, classe, prépare. Le grand saut, ce sera demain.' },
      { eyebrow: 'Vitalité', label: 'Énergie', icon: Flame, score: 86, text: 'Neptune favorise le repos vrai : accorde-toi une vraie pause.' },
    ],
    mantra: 'Le calme aussi est une forme d’avancée.',
  },
];

const ease = [0.22, 1, 0.36, 1] as const;
const CYCLE_MS = 9200;

function useTypewriter(text: string, active: boolean, speedMs = 28) {
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

interface DeliveryBubbleProps {
  channel: DeliveryChannel;
  greeting: string;
  index: number;
  reduceMotion: boolean | null;
}

function DeliveryBubble({ channel, greeting, index, reduceMotion }: DeliveryBubbleProps) {
  const isWA = channel === 'whatsapp';
  const [headline, detail] = greeting.includes(' — ')
    ? greeting.split(' — ')
    : [greeting, ''];

  return (
    <motion.div
      key={`${channel}-${index}`}
      initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.5, ease }}
      className={cn(
        'mx-auto max-w-[290px] rounded-2xl border overflow-hidden shadow-[0_16px_48px_-28px_rgba(0,0,0,0.85)]',
        isWA
          ? 'border-white/[0.08] bg-[#0c1c14]/95'
          : 'border-magenta-500/20 bg-gradient-to-b from-[#1a0d2e]/95 via-[#0d0a1f]/95 to-night-900/95',
      )}
    >
      {/* Chrome header */}
      <div
        className={cn(
          'flex items-center gap-2.5 px-3.5 py-2.5 border-b',
          isWA
            ? 'border-white/[0.06] bg-[#075e54]/90'
            : 'border-magenta-500/15 bg-night-900/80',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full ring-1',
            isWA
              ? 'bg-aurora-500/15 ring-aurora-400/35'
              : 'bg-magenta-500/15 ring-magenta-500/35',
          )}
        >
          {isWA ? (
            <WhatsAppIcon className="h-3.5 w-3.5 text-aurora-300" />
          ) : (
            <InstagramIcon className="h-3.5 w-3.5 text-magenta-300" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ivory-100 truncate">Zodiak Astro</p>
          <p className="text-[9px] text-ivory-400/85">
            {isWA ? 'WhatsApp · en ligne' : 'Instagram · message direct'}
          </p>
        </div>
        <span className="font-mono text-[9px] text-ivory-400/70 tabular-nums">8:00</span>
      </div>

      <div className="px-3.5 py-3">
        <p
          className={cn(
            'text-[12.5px] leading-snug text-ivory-100/95 rounded-2xl px-3 py-2.5 border',
            isWA
              ? 'rounded-tl-sm bg-white/[0.06] border-white/[0.06]'
              : 'rounded-tr-sm bg-magenta-500/[0.08] border-magenta-500/15',
          )}
        >
          <span
            className={cn(
              'block text-[10px] font-semibold uppercase tracking-wider mb-1',
              isWA ? 'text-aurora-300/90' : 'text-magenta-300/90',
            )}
          >
            {headline}
          </span>
          {detail || greeting}
        </p>
      </div>
    </motion.div>
  );
}

interface GuidanceDemoProps {
  className?: string;
  onDeliveryChannelChange?: (channel: DeliveryChannel) => void;
}

export default function GuidanceDemo({ className = '', onDeliveryChannelChange }: GuidanceDemoProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState(0);
  const timerRef = useRef<number | null>(null);

  const sample = SAMPLES[index];
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const { display: typedSummary, done: summaryDone } = useTypewriter(
    sample.summary,
    phase >= 1,
    reduceMotion ? 0 : 26,
  );

  useEffect(() => {
    onDeliveryChannelChange?.(sample.channel);
  }, [sample.channel, onDeliveryChannelChange]);

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setPhase(0);
  }, []);

  const nextSample = useCallback(() => {
    goTo((index + 1) % SAMPLES.length);
  }, [goTo, index]);

  useEffect(() => {
    if (reduceMotion) {
      setPhase(3);
      return;
    }
    setPhase(0);
    const t1 = window.setTimeout(() => setPhase(1), 400);
    return () => window.clearTimeout(t1);
  }, [index, reduceMotion]);

  useEffect(() => {
    if (!summaryDone || phase >= 2) return;
    const t = window.setTimeout(() => setPhase(2), 280);
    return () => window.clearTimeout(t);
  }, [summaryDone, phase]);

  useEffect(() => {
    if (phase !== 2) return;
    const t = window.setTimeout(() => setPhase(3), 900);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (reduceMotion || paused) return;
    timerRef.current = window.setTimeout(nextSample, CYCLE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [index, paused, reduceMotion, nextSample]);

  return (
    <div
      className={cn('relative', className)}
      aria-label="Exemple animé de guidance quotidienne"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <motion.div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -inset-6 rounded-[2rem] blur-3xl transition-colors duration-700',
          sample.channel === 'whatsapp' ? 'bg-aurora-400/[0.08]' : 'bg-magenta-500/[0.07]',
        )}
        animate={reduceMotion ? undefined : { opacity: [0.4, 0.72, 0.4], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Card
        variant="elevated"
        className={cn(
          'relative overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-700',
          sample.channel === 'whatsapp'
            ? 'border-aurora-400/35 shadow-[inset_0_1px_0_rgba(56,189,248,0.16),0_28px_72px_-44px_rgba(0,0,0,0.9)]'
            : 'border-magenta-500/30 shadow-[inset_0_1px_0_rgba(201,97,155,0.12),0_28px_72px_-44px_rgba(0,0,0,0.9)]',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent',
            sample.channel === 'whatsapp' ? 'via-aurora-400/85' : 'via-magenta-400/70',
          )}
        />

        <div className="relative p-6 md:p-9">
          <AnimatePresence mode="wait">
            <DeliveryBubble
              channel={sample.channel}
              greeting={sample.greeting}
              index={index}
              reduceMotion={reduceMotion}
            />
          </AnimatePresence>

          {/* Indicateurs canal */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {(['whatsapp', 'instagram'] as const).map((ch) => {
              const active = sample.channel === ch;
              return (
                <span
                  key={ch}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.16em] transition-all duration-500',
                    active
                      ? ch === 'whatsapp'
                        ? 'border-aurora-400/40 bg-aurora-500/10 text-aurora-200'
                        : 'border-magenta-500/35 bg-magenta-500/10 text-magenta-200'
                      : 'border-white/[0.06] bg-white/[0.02] text-ivory-500/70',
                  )}
                >
                  {ch === 'whatsapp' ? (
                    <WhatsAppIcon className="h-3 w-3" />
                  ) : (
                    <InstagramIcon className="h-3 w-3" />
                  )}
                  {ch === 'whatsapp' ? 'WA' : 'IG'}
                </span>
              );
            })}
          </div>

          <p className="mt-5 eyebrow-ritual flex items-center justify-center gap-3 text-ivory-400/80">
            <span aria-hidden="true" className="block h-px w-7 bg-aurora-400/45" />
            <span className="capitalize">{today} · Lecture complète</span>
            <span aria-hidden="true" className="block h-px w-7 bg-aurora-400/45" />
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              <h3 className="mt-5 min-h-[4.5rem] md:min-h-[5rem] text-center font-display italic-editorial text-h2 md:text-h1 text-ivory-50 leading-[1.18]">
                {typedSummary}
                {!summaryDone && phase >= 1 && !reduceMotion && (
                  <motion.span
                    aria-hidden
                    className="inline-block w-[2px] h-[0.85em] ml-0.5 align-middle bg-aurora-400"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </h3>

              <div className="mt-7 space-y-3.5">
                {sample.pillars.map((p, i) => {
                  const Icon = p.icon;
                  const visible = phase >= 2 || reduceMotion;
                  return (
                    <motion.div
                      key={`${index}-${p.label}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                      animate={
                        visible
                          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                          : { opacity: 0, y: 14, filter: 'blur(4px)' }
                      }
                      transition={{ duration: 0.55, ease, delay: reduceMotion ? 0 : i * 0.1 }}
                      className="rounded-xl border border-white/[0.08] bg-night-900/45 backdrop-blur-md px-4 py-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-aurora-400 shrink-0" aria-hidden="true" />
                        <span className="eyebrow-ritual text-ivory-400/75">{p.eyebrow}</span>
                        <span className="ml-auto font-mono text-[11px] tabular-nums text-aurora-200/90">
                          {p.score}
                        </span>
                      </div>
                      <p className="mt-2 text-caption text-ivory-200/85 leading-[1.6]">{p.text}</p>
                      <div className="mt-3 h-1 rounded-full bg-white/[0.07] overflow-hidden">
                        <motion.span
                          className="block h-full rounded-full bg-gradient-to-r from-aurora-500 via-aurora-400 to-aurora-200"
                          initial={reduceMotion ? false : { width: 0 }}
                          animate={visible ? { width: `${p.score}%` } : { width: 0 }}
                          transition={{ duration: 0.85, ease, delay: reduceMotion ? 0 : 0.15 + i * 0.12 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={phase >= 3 || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.65, ease }}
                className="mt-8 text-center"
              >
                <Quote className="w-5 h-5 text-aurora-400/70 mx-auto mb-3" aria-hidden="true" />
                <blockquote className="font-display italic-editorial text-body-lg md:text-h2 text-ivory-50 leading-[1.25]">
                  « {sample.mantra} »
                </blockquote>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div
            className="mt-8 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Exemples de guidance"
          >
            {SAMPLES.map((s, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Exemple ${i + 1} sur ${SAMPLES.length} — ${s.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}`}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                  i === index
                    ? cn(
                        'w-6',
                        s.channel === 'whatsapp' ? 'bg-aurora-400' : 'bg-magenta-400',
                      )
                    : 'w-1.5 bg-white/20 hover:bg-white/35',
                )}
              />
            ))}
          </div>

          {paused && !reduceMotion && (
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] text-ivory-500/90">
              Pause · survol
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
