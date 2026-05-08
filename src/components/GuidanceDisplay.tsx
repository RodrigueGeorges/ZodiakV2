import { motion } from 'framer-motion';
import { Heart, Briefcase, Flame, Quote } from 'lucide-react';
import { Card } from './ui/Card';
import { GuidanceScoreBadge } from './GuidanceScoreBadge';
import { GuidanceMeter } from './GuidanceMeter';
import EmptyState from './ui/EmptyState';

interface GuidanceDisplayProps {
  guidance: any;
  className?: string;
  /** Affiche le résumé en hero (par défaut). */
  withSummary?: boolean;
}

/**
 * Tente d'extraire { text, score } d'un champ potentiellement encodé en JSON.
 * Tolérant : accepte chaîne, objet, JSON dans une chaîne, ou texte brut.
 */
function parseSection(input: any): { text: string; score: number } {
  if (!input) return { text: '', score: 0 };
  if (typeof input === 'object' && input !== null) {
    return {
      text: typeof input.text === 'string' ? input.text : '',
      score: typeof input.score === 'number' ? input.score : 0,
    };
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return {
        text: parsed.text || input,
        score: typeof parsed.score === 'number' ? parsed.score : 0,
      };
    } catch {
      const m = input.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          return {
            text: parsed.text || input.replace(m[0], '').trim(),
            score: typeof parsed.score === 'number' ? parsed.score : 0,
          };
        } catch {
          /* fallback */
        }
      }
      return { text: input, score: 0 };
    }
  }
  return { text: String(input), score: 0 };
}

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const SECTION_META = [
  {
    key: 'love' as const,
    label: 'Amour',
    eyebrow: 'CŒUR',
    icon: Heart,
    accent: 'text-magenta-400',
    aura: 'from-magenta-500/15 via-aurora-500/5 to-transparent',
  },
  {
    key: 'work' as const,
    label: 'Travail',
    eyebrow: 'CHANTIERS',
    icon: Briefcase,
    accent: 'text-aurora-300',
    aura: 'from-aurora-500/15 via-aurora-400/5 to-transparent',
  },
  {
    key: 'energy' as const,
    label: 'Énergie',
    eyebrow: 'VITALITÉ',
    icon: Flame,
    accent: 'text-amber-300',
    aura: 'from-amber-400/15 via-magenta-500/5 to-transparent',
  },
];

export default function GuidanceDisplay({
  guidance,
  className = '',
  withSummary = true,
}: GuidanceDisplayProps) {
  if (!guidance) {
    return (
      <EmptyState
        icon={<Quote className="w-7 h-7" />}
        title="Aucune guidance disponible"
        description="Le ciel n'a pas encore livré son message pour ce lien."
        className={className}
      />
    );
  }

  const sections = SECTION_META.map((meta) => {
    const raw = (guidance as any)[meta.key];
    const parsed = parseSection(raw);
    // si l'objet est déjà structuré côté serveur (text + score séparés)
    if (raw && typeof raw === 'object' && 'text' in raw) {
      parsed.text = raw.text;
      parsed.score = typeof raw.score === 'number' ? raw.score : parsed.score;
    }
    return { ...meta, ...parsed };
  });

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <motion.div
      className={`space-y-8 md:space-y-10 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      {/* Hero / résumé */}
      {withSummary && guidance.summary && (
        <motion.div variants={item}>
          <Card variant="elevated" glow className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/10 via-transparent to-magenta-500/10"
            />
            <div className="relative px-6 md:px-10 py-8 md:py-10 text-center">
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-3">
                {today} · Lecture du ciel
              </p>
              <h2 className="font-cinzel text-h2 md:text-display text-gradient-aurora leading-tight">
                {guidance.summary}
              </h2>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Sections détaillées */}
      <div className="grid gap-5 md:gap-6 md:grid-cols-3">
        {sections.map(({ key, label, eyebrow, icon: Icon, accent, aura, text, score }) => (
          <motion.div key={key} variants={item}>
            <Card variant="surface" className="h-full relative group">
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${aura} opacity-70 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative p-6 flex flex-col h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-micro uppercase tracking-[0.18em] text-ivory-400">
                      {eyebrow}
                    </p>
                    <h3
                      className={`mt-1 font-cinzel text-h3 ${accent} flex items-center gap-2`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      {label}
                    </h3>
                  </div>
                  <GuidanceScoreBadge score={score} />
                </div>

                <p className="text-body text-ivory-200 leading-relaxed flex-1">
                  {text || `Pas de message ${label.toLowerCase()} aujourd'hui.`}
                </p>

                <GuidanceMeter score={score} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mantra du jour */}
      {guidance.mantra && (
        <motion.div variants={item}>
          <Card variant="elevated" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 -left-20 w-60 h-60 rounded-full bg-aurora-500/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-magenta-500/15 blur-3xl"
            />
            <div className="relative px-6 md:px-12 py-10 text-center">
              <Quote
                className="w-7 h-7 text-aurora-300 mx-auto mb-4 opacity-80"
                aria-hidden="true"
              />
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-4">
                Mantra du jour
              </p>
              <blockquote className="font-cinzel italic text-h2 md:text-display text-ivory-50 leading-snug">
                « {guidance.mantra} »
              </blockquote>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pied de page sobre */}
      <motion.p
        variants={item}
        className="text-center text-micro uppercase tracking-[0.22em] text-ivory-400"
      >
        ✦ Que les étoiles te guident ✦
      </motion.p>
    </motion.div>
  );
}
