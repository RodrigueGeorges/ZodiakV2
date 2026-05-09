import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

interface ZodiacGlyphProps {
  sign: ZodiacSign;
  size?: number;
  className?: string;
  /** Animation initiale au mount (draw-in stroke). */
  animate?: boolean;
  delay?: number;
  /** Couleur du trait (par défaut : currentColor) */
  stroke?: string;
  /** Activer un fill très subtil pour donner du corps */
  withFill?: boolean;
  ariaLabel?: string;
}

/**
 * Pictogrammes des 12 signes du zodiaque, dessinés à la main en SVG.
 *
 * Charte : trait fin (stroke 1.5), terminaisons rondes, glyphes simplifiés
 * pour rester lisibles à toute taille. Chaque path est conçu pour s'animer
 * en "draw-in" via stroke-dasharray + framer-motion.
 *
 * Utilisation :
 *   <ZodiacGlyph sign="leo" size={48} />
 *   <ZodiacGlyph sign="leo" size={64} animate withFill />
 */
export default function ZodiacGlyph({
  sign,
  size = 32,
  className,
  animate = false,
  delay = 0,
  stroke = 'currentColor',
  withFill = false,
  ariaLabel,
}: ZodiacGlyphProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = animate && !reduced;
  const path = PATHS[sign];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('inline-block', className)}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel ?? SIGN_NAMES[sign]}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {withFill && (
        <motion.path
          d={path}
          fill={stroke}
          fillOpacity={0.08}
          stroke="none"
          initial={shouldAnimate ? { opacity: 0 } : undefined}
          animate={shouldAnimate ? { opacity: 1 } : undefined}
          transition={{ delay: delay + 0.6, duration: 0.6 }}
        />
      )}
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={shouldAnimate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={shouldAnimate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{
          pathLength: { delay, duration: 1.1, ease: [0.22, 1, 0.36, 1] },
          opacity: { delay, duration: 0.3 },
        }}
      />
    </svg>
  );
}

export const SIGN_NAMES: Record<ZodiacSign, string> = {
  aries: 'Bélier',
  taurus: 'Taureau',
  gemini: 'Gémeaux',
  cancer: 'Cancer',
  leo: 'Lion',
  virgo: 'Vierge',
  libra: 'Balance',
  scorpio: 'Scorpion',
  sagittarius: 'Sagittaire',
  capricorn: 'Capricorne',
  aquarius: 'Verseau',
  pisces: 'Poissons',
};

export const SIGN_DATES: Record<ZodiacSign, string> = {
  aries: '21 mars – 19 avril',
  taurus: '20 avril – 20 mai',
  gemini: '21 mai – 20 juin',
  cancer: '21 juin – 22 juillet',
  leo: '23 juillet – 22 août',
  virgo: '23 août – 22 septembre',
  libra: '23 septembre – 22 octobre',
  scorpio: '23 octobre – 21 novembre',
  sagittarius: '22 novembre – 21 décembre',
  capricorn: '22 décembre – 19 janvier',
  aquarius: '20 janvier – 18 février',
  pisces: '19 février – 20 mars',
};

export const ZODIAC_ORDER: ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

/**
 * Paths SVG des 12 glyphes — viewBox 64×64, centrés.
 * Dessinés pour avoir un poids visuel équivalent à toutes tailles.
 */
const PATHS: Record<ZodiacSign, string> = {
  // Bélier — 2 cornes en V courbe
  aries:
    'M32 50 L32 18 M32 18 C24 14 18 16 16 22 C14 28 18 32 22 30 M32 18 C40 14 46 16 48 22 C50 28 46 32 42 30',

  // Taureau — Cercle avec cornes
  taurus:
    'M32 44 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M23 35 C19 28 18 22 14 18 M41 35 C45 28 46 22 50 18',

  // Gémeaux — 2 piliers reliés
  gemini:
    'M22 16 L22 48 M42 16 L42 48 M18 16 L46 16 M18 48 L46 48',

  // Cancer — 2 spirales en miroir (69)
  cancer:
    'M16 26 a8 6 0 0 1 16 0 M22 24 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M48 38 a8 6 0 0 1 -16 0 M42 40 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',

  // Lion — courbe à boucle (queue)
  leo:
    'M22 24 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M28 24 C28 32 36 36 42 36 C48 36 52 32 50 26 C48 22 44 22 42 26 C40 30 44 38 50 42',

  // Vierge — M avec boucle finale
  virgo:
    'M16 48 L16 24 M16 24 C16 20 20 18 22 22 L22 48 M22 24 C22 20 26 18 28 22 L28 48 M28 24 C30 22 36 22 38 28 C40 36 36 44 30 46 M38 28 C40 32 44 32 46 30 L48 24',

  // Balance — Trait + cercle posé
  libra:
    'M14 48 L50 48 M14 38 L50 38 M22 38 C22 30 28 24 32 24 C36 24 42 30 42 38',

  // Scorpion — M avec dard
  scorpio:
    'M14 22 L14 42 M14 22 C14 18 18 16 20 20 L20 42 M20 22 C20 18 24 16 26 20 L26 42 M26 22 C26 18 30 16 32 20 L32 50 L42 50 L42 44 M42 44 L50 44 L46 40 M46 40 L50 36',

  // Sagittaire — flèche oblique
  sagittarius:
    'M16 50 L48 18 M48 18 L36 18 M48 18 L48 30 M22 32 L32 42',

  // Capricorne — V avec spirale
  capricorn:
    'M16 18 L24 38 L32 18 L36 30 C38 36 36 42 30 44 C24 46 22 40 26 38 C30 36 36 38 38 44 M38 44 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',

  // Verseau — 2 vagues parallèles
  aquarius:
    'M14 26 L20 22 L26 26 L32 22 L38 26 L44 22 L50 26 M14 38 L20 34 L26 38 L32 34 L38 38 L44 34 L50 38',

  // Poissons — 2 arcs liés par une barre
  pisces:
    'M18 16 C26 24 26 40 18 48 M46 16 C38 24 38 40 46 48 M16 32 L48 32',
};
