import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, Briefcase, Flame, Quote, MessageCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

/**
 * GuidanceDemo — aperçu animé d'une guidance quotidienne pour la landing.
 *
 * Séquence par échantillon :
 *   1. Mini bulle WhatsApp (livraison matinale)
 *   2. Résumé en machine-à-écrire (Fraunces italique)
 *   3. Piliers qui entrent en cascade + jauges aurora
 *   4. Mantra rituel
 *
 * Contrôles : pause au survol, dots cliquables, respect `prefers-reduced-motion`.
 */

interface Pillar {
  eyebrow: string;
  label: string;
  icon: typeof Heart;
  score: number;
  text: string;
}

interface Sample {
  greeting: string;
  summary: string;
  pillars: Pillar[];
  mantra: string;
}

const SAMPLES: Sample[] = [
  {
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

export default function GuidanceDemo({ className = '' }: { className?: string }) {
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

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setPhase(0);
  }, []);

  const nextSample = useCallback(() => {
    goTo((index + 1) % SAMPLES.length);
  }, [goTo, index]);

  // Orchestration des phases (bulle → résumé → piliers → mantra)
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

  // Auto-cycle (pause au survol)
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
      {/* Halo respirant */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-aurora-400/[0.07] blur-3xl"
        animate={reduceMotion ? undefined : { opacity: [0.45, 0.75, 0.45], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <Card
        variant="elevated"
        className="relative overflow-hidden rounded-2xl border-aurora-400/35 shadow-[inset_0_1px_0_rgba(56,189,248,0.16),0_28px_72px_-44px_rgba(0,0,0,0.9)]"
      >
        <span
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
        />

        <div className="relative p-6 md:p-9">
          {/* Mini livraison WhatsApp */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`wa-${index}`}
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.45, ease }}
              className="mx-auto max-w-[280px] rounded-2xl border border-white/[0.08] bg-[#0c1c14]/90 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] text-ivory-400/80">
                <MessageCircle className="w-3 h-3 text-[#25D366]" aria-hidden />
                <span>WhatsApp · 8h00</span>
              </div>
              <p className="text-[12.5px] leading-snug text-ivory-100/95 rounded-xl rounded-tl-sm bg-white/[0.06] px-3 py-2.5 border border-white/[0.06]">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-aurora-300/90 mb-1">
                  {sample.greeting.split(' — ')[0]}
                </span>
                {sample.greeting.split(' — ')[1] ?? sample.greeting}
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="mt-6 eyebrow-ritual flex items-center justify-center gap-3 text-ivory-400/80">
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
              {/* Résumé machine-à-écrire */}
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

              {/* Piliers */}
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

              {/* Mantra */}
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

          {/* Navigation dots (cliquables) */}
          <div
            className="mt-8 flex items-center justify-center gap-2"
            role="tablist"
            aria-label="Exemples de guidance"
          >
            {SAMPLES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Exemple ${i + 1} sur ${SAMPLES.length}`}
                onClick={() => goTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                  i === index ? 'w-6 bg-aurora-400' : 'w-1.5 bg-white/20 hover:bg-white/35',
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
