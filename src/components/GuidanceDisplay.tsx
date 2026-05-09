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
  /** Si true, n'apparaît que si le backend renvoie le champ. */
  optional?: boolean;
}

const SECTION_META: SectionMeta[] = [
  { key: 'love',   label: 'Amour',    eyebrow: 'Cœur',      icon: Heart },
  { key: 'work',   label: 'Travail',  eyebrow: 'Chantiers', icon: Briefcase },
  { key: 'energy', label: 'Énergie',  eyebrow: 'Vitalité',  icon: Flame },
  { key: 'money',  label: 'Argent',   eyebrow: 'Finances',  icon: Coins, optional: true },
];

/**
 * GuidanceDisplay v3 — refonte "Cosmic Editorial Ritual" (mai 2026).
 *
 * Refonte :
 *   - Hero résumé : Card élevée minimaliste, titre Fraunces XXL en italique or
 *   - Piliers : cards uniformes avec eyebrow Cinzel + icône or discrète
 *   - Suppression des gradients tonalisés (love/work/energy/money en arc-en-ciel)
 *   - Mantra : pleine page éditoriale, pas de blob halos colorés
 *   - Boussole : grille épurée, pas de fond emerald/magenta
 *   - Pied de page : signature manuscrite simple
 */
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
      ? 'grid gap-px bg-ivory-50/[0.06] md:grid-cols-2 lg:grid-cols-4'
      : 'grid gap-px bg-ivory-50/[0.06] md:grid-cols-3';

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
      className={`space-y-12 md:space-y-16 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      {/* Hero / résumé éditorial */}
      {withSummary && guidance.summary && (
        <motion.div variants={item}>
          <Card variant="elevated" className="relative">
            <div className="relative px-7 md:px-14 py-12 md:py-16 text-center">
              <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-7">
                <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
                <span>{today} · Lecture du ciel</span>
                <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              </p>
              <h2 className="font-serif italic-editorial text-h1 md:text-display text-ivory-50 leading-[1.1]">
                {guidance.summary}
              </h2>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Sections piliers (3 ou 4 selon backend) — grille hairline éditoriale */}
      <div className={gridClass}>
        {sections.map(({ key, label, eyebrow, icon: Icon, text, score, why }) => (
          <motion.div key={key} variants={item} className="bg-night-950">
            <PillarCard
              eyebrow={eyebrow}
              label={label}
              icon={Icon}
              text={text}
              score={score}
              why={why}
            />
          </motion.div>
        ))}
      </div>

      {/* Boussole du jour : Dos & Don'ts */}
      {hasDosDonts && (
        <motion.div variants={item}>
          <Card variant="surface" className="relative overflow-hidden">
            <div className="relative p-7 md:p-12">
              <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-9">
                <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
                <span>Boussole du jour</span>
                <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              </p>
              <div className="grid gap-10 md:gap-14 md:grid-cols-2">
                <DosDontsColumn tone="dos" title="À cultiver" items={dos} />
                <DosDontsColumn tone="donts" title="À éviter" items={donts} />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Mantra du jour — pleine page éditoriale */}
      {mantraText && (
        <motion.div variants={item}>
          <Card variant="elevated" className="relative overflow-hidden">
            <div className="relative px-7 md:px-16 py-14 md:py-20 text-center">
              <Quote
                className="w-6 h-6 text-aurora-400/70 mx-auto mb-6"
                aria-hidden="true"
              />
              <p className="eyebrow-ritual mb-8">Mantra du jour</p>
              <blockquote className="font-serif italic-editorial text-h1 md:text-display text-ivory-50 leading-[1.15]">
                « {mantraText} »
              </blockquote>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
                    summary:
                      typeof guidance.summary === 'string'
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

      {/* Pied de page éditorial */}
      <motion.div
        variants={item}
        className="text-center eyebrow-ritual text-ivory-400/70 flex items-center justify-center gap-3"
      >
        <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/40" />
        <span>Que les étoiles te guident</span>
        <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/40" />
      </motion.div>
    </motion.div>
  );
}

interface PillarCardProps {
  eyebrow: string;
  label: string;
  icon: typeof Heart;
  text: string;
  score: number;
  why?: string;
}
function PillarCard({
  eyebrow,
  label,
  icon: Icon,
  text,
  score,
  why,
}: PillarCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <article className="h-full relative group bg-night-950 hover:bg-night-900/60 transition-colors duration-500 p-7 md:p-9 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow-ritual text-ivory-400/70">{eyebrow}</p>
          <h3 className="mt-2 font-serif text-h2 text-ivory-50 flex items-center gap-3 leading-tight">
            <Icon className="w-5 h-5 text-aurora-400" aria-hidden="true" />
            {label}
          </h3>
        </div>
        <GuidanceScoreBadge score={score} />
      </div>

      <p className="text-body text-ivory-200/85 leading-[1.7] flex-1">
        {text || `Pas de message ${label.toLowerCase()} aujourd'hui.`}
      </p>

      <GuidanceMeter score={score} />

      {/* "Pourquoi ça t'est dit" — révélé sur clic */}
      {why && (
        <div className="border-t border-signal-600/15 pt-4 -mb-1">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 text-caption text-aurora-400 hover:text-aurora-300 transition-colors"
            aria-expanded={open}
          >
            <span className="inline-flex items-center gap-2">
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
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="block mt-3 text-caption text-ivory-300/80 italic-editorial leading-relaxed">
                  {why}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </article>
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
      <h4 className="flex items-center gap-3 font-serif text-h2 text-ivory-50 mb-5 leading-tight">
        {isDos ? (
          <CheckCircle2 className="w-5 h-5 text-aurora-400" aria-hidden="true" />
        ) : (
          <XCircle className="w-5 h-5 text-magenta-400" aria-hidden="true" />
        )}
        <span className={isDos ? 'text-ivory-50' : 'text-ivory-50'}>
          {title}
        </span>
      </h4>
      <ul className="space-y-3">
        {items.slice(0, 3).map((it, i) => (
          <li
            key={`${tone}-${i}`}
            className="flex items-start gap-3 text-body text-ivory-200/90 leading-[1.7]"
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex-shrink-0 mt-2.5 block h-px w-4',
                isDos ? 'bg-aurora-400/60' : 'bg-magenta-400/60',
              )}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
