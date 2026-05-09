import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Briefcase,
  Flame,
  Quote,
  Coins,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Telescope,
} from 'lucide-react';
import { Card } from './ui/Card';
import { GuidanceScoreBadge } from './GuidanceScoreBadge';
import { GuidanceMeter } from './GuidanceMeter';
import EmptyState from './ui/EmptyState';
import SpeakButton from './SpeakButton';
import StoryShareButton from './StoryShareButton';
import { cn } from '../lib/utils';

interface GuidanceDisplayProps {
  guidance: any;
  className?: string;
  /** Affiche le résumé en hero (par défaut). */
  withSummary?: boolean;
  /** Prénom du destinataire — utilisé pour la story image. */
  firstName?: string;
}

interface ParsedSection {
  text: string;
  score: number;
  why?: string;
}

/**
 * Tente d'extraire { text, score, why } d'un champ potentiellement encodé en JSON.
 * Tolérant : accepte chaîne, objet, JSON dans une chaîne, ou texte brut.
 */
function parseSection(input: any): ParsedSection {
  if (!input) return { text: '', score: 0 };
  if (typeof input === 'object' && input !== null) {
    return {
      text: typeof input.text === 'string' ? input.text : '',
      score: typeof input.score === 'number' ? input.score : 0,
      why: typeof input.why === 'string' && input.why.trim() ? input.why : undefined,
    };
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return {
        text: parsed.text || input,
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        why: typeof parsed.why === 'string' && parsed.why.trim() ? parsed.why : undefined,
      };
    } catch {
      const m = input.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          return {
            text: parsed.text || input.replace(m[0], '').trim(),
            score: typeof parsed.score === 'number' ? parsed.score : 0,
            why: typeof parsed.why === 'string' && parsed.why.trim() ? parsed.why : undefined,
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

function parseList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((it) => (typeof it === 'string' ? it.trim() : String(it ?? '').trim()))
      .filter(Boolean);
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseList(parsed);
    } catch {
      /* fallback */
    }
    return input
      .split(/\r?\n|·|•|–|-/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

interface SectionMeta {
  key: 'love' | 'work' | 'energy' | 'money';
  label: string;
  eyebrow: string;
  icon: typeof Heart;
  accent: string;
  aura: string;
  /** Si true, n'apparaît que si le backend renvoie le champ. */
  optional?: boolean;
}

const SECTION_META: SectionMeta[] = [
  {
    key: 'love',
    label: 'Amour',
    eyebrow: 'CŒUR',
    icon: Heart,
    accent: 'text-magenta-400',
    aura: 'from-magenta-500/15 via-aurora-500/5 to-transparent',
  },
  {
    key: 'work',
    label: 'Travail',
    eyebrow: 'CHANTIERS',
    icon: Briefcase,
    accent: 'text-aurora-300',
    aura: 'from-aurora-500/15 via-aurora-400/5 to-transparent',
  },
  {
    key: 'energy',
    label: 'Énergie',
    eyebrow: 'VITALITÉ',
    icon: Flame,
    accent: 'text-amber-300',
    aura: 'from-amber-400/15 via-magenta-500/5 to-transparent',
  },
  {
    key: 'money',
    label: 'Argent',
    eyebrow: 'FINANCES',
    icon: Coins,
    accent: 'text-emerald-300',
    aura: 'from-emerald-500/15 via-aurora-500/5 to-transparent',
    optional: true,
  },
];

export default function GuidanceDisplay({
  guidance,
  className = '',
  withSummary = true,
  firstName,
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

  const sections = SECTION_META.filter((meta) => {
    if (!meta.optional) return true;
    return Boolean((guidance as any)[meta.key]);
  }).map((meta) => {
    const raw = (guidance as any)[meta.key];
    const parsed = parseSection(raw);
    if (raw && typeof raw === 'object' && 'text' in raw) {
      parsed.text = raw.text;
      parsed.score = typeof raw.score === 'number' ? raw.score : parsed.score;
      if (typeof raw.why === 'string' && raw.why.trim()) parsed.why = raw.why;
    }
    return { ...meta, ...parsed };
  });

  const gridClass =
    sections.length === 4
      ? 'grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-4'
      : 'grid gap-5 md:gap-6 md:grid-cols-3';

  const dos = parseList((guidance as any).dos);
  const donts = parseList((guidance as any).donts);
  const hasDosDonts = dos.length > 0 || donts.length > 0;

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const mantraText: string | undefined =
    typeof guidance.mantra === 'string' && guidance.mantra.trim()
      ? guidance.mantra
      : undefined;

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

      {/* Sections détaillées (3 ou 4 piliers selon ce que renvoie le backend) */}
      <div className={gridClass}>
        {sections.map(({ key, label, eyebrow, icon: Icon, accent, aura, text, score, why }) => (
          <motion.div key={key} variants={item}>
            <PillarCard
              eyebrow={eyebrow}
              label={label}
              icon={Icon}
              accent={accent}
              aura={aura}
              text={text}
              score={score}
              why={why}
            />
          </motion.div>
        ))}
      </div>

      {/* Dos & Don'ts — bloc actionnable, signature Co-Star */}
      {hasDosDonts && (
        <motion.div variants={item}>
          <Card variant="surface" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-500/8 via-transparent to-magenta-500/8"
            />
            <div className="relative p-6 md:p-8">
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-5 text-center">
                Boussole du jour
              </p>
              <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                <DosDontsColumn tone="dos" title="À cultiver" items={dos} />
                <DosDontsColumn tone="donts" title="À éviter" items={donts} />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Mantra du jour */}
      {mantraText && (
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
                « {mantraText} »
              </blockquote>

              {/* Actions audio + story */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <SpeakButton
                  text={mantraText}
                  variant="pill"
                  ariaLabel="Écouter le mantra à voix haute"
                />
                <StoryShareButton
                  variant="ghost"
                  size="sm"
                  label="Story"
                  payload={{
                    type: 'guidance',
                    firstName: firstName ?? '',
                    date: today,
                    summary: typeof guidance.summary === 'string'
                      ? guidance.summary
                      : '',
                    mantra: mantraText,
                  }}
                />
              </div>
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

interface PillarCardProps {
  eyebrow: string;
  label: string;
  icon: typeof Heart;
  accent: string;
  aura: string;
  text: string;
  score: number;
  why?: string;
}
function PillarCard({
  eyebrow,
  label,
  icon: Icon,
  accent,
  aura,
  text,
  score,
  why,
}: PillarCardProps) {
  const [open, setOpen] = useState(false);

  return (
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

        {/* "Pourquoi ça t'est dit" — révélé sur clic */}
        {why && (
          <div className="border-t border-night-700/50 pt-3 -mb-1">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 text-caption text-aurora-200 hover:text-aurora-100 transition-colors"
              aria-expanded={open}
            >
              <span className="inline-flex items-center gap-1.5">
                <Telescope className="w-3.5 h-3.5" aria-hidden="true" />
                Pourquoi ça t'est dit
              </span>
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  open && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <span className="block mt-2 text-caption text-ivory-300 italic leading-relaxed">
                    {why}
                  </span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
}

interface DosDontsColumnProps {
  tone: 'dos' | 'donts';
  title: string;
  items: string[];
}
function DosDontsColumn({ tone, title, items }: DosDontsColumnProps) {
  if (items.length === 0) return null;
  const isDos = tone === 'dos';
  return (
    <div>
      <h4
        className={cn(
          'flex items-center gap-2 font-cinzel text-h3 mb-3',
          isDos ? 'text-emerald-300' : 'text-magenta-300',
        )}
      >
        {isDos ? (
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
        ) : (
          <XCircle className="w-5 h-5" aria-hidden="true" />
        )}
        {title}
      </h4>
      <ul className="space-y-2.5">
        {items.slice(0, 3).map((it, i) => (
          <li
            key={`${tone}-${i}`}
            className="flex items-start gap-2.5 text-body text-ivory-200 leading-relaxed"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full',
                isDos ? 'bg-emerald-400' : 'bg-magenta-400',
              )}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
