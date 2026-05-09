import { motion, useReducedMotion } from 'framer-motion';
import ZodiacGlyph, {
  SIGN_NAMES,
  ZODIAC_ORDER,
  ZodiacSign,
} from './ZodiacGlyph';
import { cn } from '../lib/utils';

interface ZodiacStripProps {
  className?: string;
  /** Met en évidence un signe (ex : signe solaire de l'utilisateur) */
  highlight?: ZodiacSign;
  /** Mode marquee infini horizontal (par défaut) ou statique. */
  variant?: 'marquee' | 'static';
  /** Durée d'un cycle marquee (s). */
  duration?: number;
}

/**
 * Bandeau des 12 glyphes zodiacaux premium.
 *
 * Variante "marquee" (par défaut) : défile horizontalement à l'infini,
 * style Stripe / Vercel. Le rang est doublé pour assurer une boucle
 * sans saut visuel. Fade aux extrémités pour adoucir la coupure.
 *
 * Variante "static" : grille statique pour des contextes plus posés.
 *
 * Premium : glyphes SVG custom (pas Unicode), tous animés au hover,
 * tailles homogènes, espacement aligné sur la baseline.
 */
export default function ZodiacStrip({
  className,
  highlight,
  variant = 'marquee',
  duration = 60,
}: ZodiacStripProps) {
  const reduced = useReducedMotion();

  if (variant === 'static') {
    return (
      <ul
        className={cn(
          'flex items-center justify-center gap-4 sm:gap-7 md:gap-10 flex-wrap select-none',
          className,
        )}
        aria-label="Les douze signes du zodiaque"
      >
        {ZODIAC_ORDER.map((sign, i) => (
          <GlyphItem
            key={sign}
            sign={sign}
            isHighlight={highlight === sign}
            delay={i * 0.04}
          />
        ))}
      </ul>
    );
  }

  // Marquee : on duplique la liste pour boucler sans saut visuel.
  const sequence = [...ZODIAC_ORDER, ...ZODIAC_ORDER];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden select-none',
        '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]',
        className,
      )}
      aria-label="Les douze signes du zodiaque"
    >
      <motion.ul
        className="flex items-center gap-12 md:gap-16 py-2 whitespace-nowrap will-change-transform"
        animate={
          reduced
            ? undefined
            : { x: ['0%', '-50%'] }
        }
        transition={
          reduced
            ? undefined
            : {
                duration,
                ease: 'linear',
                repeat: Infinity,
              }
        }
      >
        {sequence.map((sign, i) => (
          <li
            key={`${sign}-${i}`}
            className={cn(
              'flex items-center gap-3 flex-shrink-0 transition-all duration-300',
              highlight === sign
                ? 'text-aurora-200 opacity-100'
                : 'text-ivory-200/55 hover:text-aurora-200 hover:opacity-100',
            )}
            title={SIGN_NAMES[sign]}
          >
            <ZodiacGlyph sign={sign} size={36} />
            <span className="font-cinzel text-caption uppercase tracking-[0.22em] text-ivory-300/70">
              {SIGN_NAMES[sign]}
            </span>
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

function GlyphItem({
  sign,
  isHighlight,
  delay,
}: {
  sign: ZodiacSign;
  isHighlight: boolean;
  delay: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 6 }}
      whileInView={{ opacity: isHighlight ? 1 : 0.55, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ opacity: 1, scale: 1.15 }}
      title={SIGN_NAMES[sign]}
      className={cn(
        'transition-colors',
        isHighlight ? 'text-aurora-200' : 'text-ivory-200/55 hover:text-aurora-200',
      )}
    >
      <ZodiacGlyph sign={sign} size={32} />
      <span className="sr-only">{SIGN_NAMES[sign]}</span>
    </motion.li>
  );
}
