import { motion, useReducedMotion } from 'framer-motion';
import ZodiacGlyph, { ZODIAC_ORDER } from './ZodiacGlyph';
import { cn } from '../lib/utils';

interface PlanetMark {
  symbol: string;
  /** Angle en degrés (0 = haut, sens horaire). */
  angle: number;
  color: string;
  label: string;
  size?: number;
}

interface AspectLine {
  from: number;
  to: number;
  type: 'trine' | 'square' | 'sextile';
}

interface CosmicWheelProps {
  className?: string;
  /** Vitesse de rotation en secondes pour un tour complet (0 = pas de rotation). */
  spinDuration?: number;
  /** Active les planètes (par défaut true). */
  withPlanets?: boolean;
  /** Active les aspects (par défaut true). */
  withAspects?: boolean;
}

/**
 * CosmicWheel — roue natale animée (or / bronze sur vide).
 *
 * Composition (4 anneaux) :
 *  1. Anneau extérieur : 12 secteurs zodiacaux avec glyphes custom
 *  2. Anneau intermédiaire : 12 maisons (chiffres romains discrets)
 *  3. Anneau planétaire : positions des planètes (Soleil, Lune, Mercure, Vénus, Mars, Jupiter, Saturne)
 *  4. Centre : aspects (lignes pulsantes entre planètes)
 *
 * Animations :
 *  - Roue extérieure tourne lentement (90s/tour, sens horaire)
 *  - Maisons restent fixes
 *  - Aspects pulsent en respiration (4s)
 *  - Planètes ont un halo qui respire
 *
 * Respect prefers-reduced-motion : anim coupées si activé.
 */
export default function CosmicWheel({
  className,
  spinDuration = 90,
  withPlanets = true,
  withAspects = true,
}: CosmicWheelProps) {
  const reduced = useReducedMotion();
  const spin = reduced ? 0 : spinDuration;

  // Positions planétaires "esthétiques" (pas un vrai thème natal — on choisit
  // des angles qui forment de jolis aspects).
  const planets: PlanetMark[] = [
    { symbol: '☉', angle: 25, color: '#EAD183', label: 'Soleil', size: 18 },
    { symbol: '☽', angle: 130, color: '#e8dcc8', label: 'Lune' },
    { symbol: '☿', angle: 65, color: '#c9ae8c', label: 'Mercure', size: 14 },
    { symbol: '♀', angle: 195, color: '#e48bb7', label: 'Vénus', size: 14 },
    { symbol: '♂', angle: 250, color: '#c45c5c', label: 'Mars', size: 14 },
    { symbol: '♃', angle: 305, color: '#dfba62', label: 'Jupiter', size: 16 },
    { symbol: '♄', angle: 340, color: '#8f6f47', label: 'Saturne' },
  ];

  // Aspects choisis pour l'esthétique (trines = harmonie, square = tension)
  const aspects: AspectLine[] = withAspects
    ? [
        { from: 0, to: 4, type: 'trine' },     // Soleil ↔ Mars
        { from: 1, to: 5, type: 'trine' },     // Lune ↔ Jupiter
        { from: 0, to: 3, type: 'square' },    // Soleil ↔ Vénus
        { from: 2, to: 6, type: 'sextile' },   // Mercure ↔ Saturne
        { from: 1, to: 4, type: 'square' },    // Lune ↔ Mars
      ]
    : [];

  // Géométrie SVG (viewBox 400)
  const cx = 200;
  const cy = 200;
  const rOuter = 196;
  const rZodiac = 168;
  const rHouseOuter = 142;
  const rHouseInner = 116;
  const rPlanet = 92;
  const rAspect = 70;

  return (
    <div className={cn('relative w-full aspect-square', className)}>
      {/* Halo discret derrière la roue */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(170,133,88,0.22),rgba(90,71,46,0.12)_45%,transparent_72%)] blur-2xl"
      />

      {/* Étoiles décoratives subtiles */}
      <SvgStars />

      <svg
        viewBox="0 0 400 400"
        className="relative w-full h-full"
        aria-label="Roue natale animée"
        role="img"
      >
        <defs>
          {/* Gradient pour le bord extérieur */}
          <linearGradient id="rim-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbf3dd" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#5a472e" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="house-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#c9ae8c" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="planet-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="60%" stopColor="rgba(170,133,88,0.18)" />
            <stop offset="100%" stopColor="rgba(170,133,88,0)" />
          </radialGradient>
        </defs>

        {/* ─── Anneau extérieur (rotation lente) ──────────────── */}
        <motion.g
          animate={spin > 0 ? { rotate: 360 } : undefined}
          transition={
            spin > 0
              ? { duration: spin, ease: 'linear', repeat: Infinity }
              : undefined
          }
          style={{ transformOrigin: '200px 200px' }}
        >
          {/* Anneau circle */}
          <circle
            cx={cx}
            cy={cy}
            r={rOuter}
            fill="none"
            stroke="url(#rim-gradient)"
            strokeWidth="1"
            opacity="0.9"
          />
          <circle
            cx={cx}
            cy={cy}
            r={rZodiac + 14}
            fill="none"
            stroke="rgba(201,166,255,0.25)"
            strokeWidth="0.6"
          />

          {/* 12 secteurs séparés par des lignes radiales */}
          {ZODIAC_ORDER.map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = cx + Math.cos(angle) * (rZodiac + 14);
            const y1 = cy + Math.sin(angle) * (rZodiac + 14);
            const x2 = cx + Math.cos(angle) * rOuter;
            const y2 = cy + Math.sin(angle) * rOuter;
            return (
              <line
                key={`spoke-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(201,166,255,0.35)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Glyphes des 12 signes */}
          {ZODIAC_ORDER.map((sign, i) => {
            const angle = (i * 30 - 75) * (Math.PI / 180);
            const x = cx + Math.cos(angle) * rZodiac;
            const y = cy + Math.sin(angle) * rZodiac;
            return (
              <g
                key={sign}
                transform={`translate(${x - 12} ${y - 12})`}
                opacity="0.92"
              >
                <foreignObject width="24" height="24">
                  <div className="text-aurora-100">
                    <ZodiacGlyph sign={sign} size={24} />
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </motion.g>

        {/* ─── Anneau des maisons (fixe) ──────────────────────── */}
        <circle
          cx={cx}
          cy={cy}
          r={rHouseOuter}
          fill="none"
          stroke="url(#house-gradient)"
          strokeWidth="0.7"
          opacity="0.6"
        />
        <circle
          cx={cx}
          cy={cy}
          r={rHouseInner}
          fill="none"
          stroke="rgba(201,166,255,0.25)"
          strokeWidth="0.5"
        />

        {/* 12 spokes des maisons */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = cx + Math.cos(angle) * rHouseInner;
          const y1 = cy + Math.sin(angle) * rHouseInner;
          const x2 = cx + Math.cos(angle) * rHouseOuter;
          const y2 = cy + Math.sin(angle) * rHouseOuter;
          return (
            <line
              key={`house-spoke-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(201,166,255,0.2)"
              strokeWidth="0.4"
            />
          );
        })}

        {/* Numéros des maisons (chiffres romains discrets) */}
        {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'].map(
          (numeral, i) => {
            const angle = (i * 30 - 75) * (Math.PI / 180);
            const r = (rHouseOuter + rHouseInner) / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            return (
              <text
                key={numeral}
                x={x}
                y={y + 3}
                fontSize="8"
                fill="rgba(201,166,255,0.6)"
                textAnchor="middle"
                fontFamily="serif"
                letterSpacing="0.5"
              >
                {numeral}
              </text>
            );
          },
        )}

        {/* ─── Aspects (lignes pulsantes au centre) ───────────── */}
        {withAspects &&
          aspects.map((asp, i) => {
            const a = planets[asp.from];
            const b = planets[asp.to];
            const aRad = ((a.angle - 90) * Math.PI) / 180;
            const bRad = ((b.angle - 90) * Math.PI) / 180;
            const ax = cx + Math.cos(aRad) * rAspect;
            const ay = cy + Math.sin(aRad) * rAspect;
            const bx = cx + Math.cos(bRad) * rAspect;
            const by = cy + Math.sin(bRad) * rAspect;
            const colorMap = {
              trine: 'rgba(245,182,56,0.55)',
              square: 'rgba(232,74,147,0.55)',
              sextile: 'rgba(157,217,255,0.55)',
            };
            return (
              <motion.line
                key={`aspect-${i}`}
                x1={ax}
                y1={ay}
                x2={bx}
                y2={by}
                stroke={colorMap[asp.type]}
                strokeWidth="0.7"
                strokeLinecap="round"
                strokeDasharray={asp.type === 'square' ? '3 3' : undefined}
                animate={
                  reduced
                    ? undefined
                    : { opacity: [0.25, 0.7, 0.25] }
                }
                transition={
                  reduced
                    ? undefined
                    : {
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                      }
                }
              />
            );
          })}

        {/* ─── Planètes ────────────────────────────────────── */}
        {withPlanets &&
          planets.map((p, i) => {
            const angle = ((p.angle - 90) * Math.PI) / 180;
            const x = cx + Math.cos(angle) * rPlanet;
            const y = cy + Math.sin(angle) * rPlanet;
            const planetSize = p.size ?? 14;
            return (
              <g key={p.label}>
                {/* Halo respirant */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={planetSize + 4}
                  fill="url(#planet-glow)"
                  initial={false}
                  animate={
                    reduced
                      ? { opacity: 0.55 }
                      : { opacity: [0.25, 0.55, 0.25], scale: [1, 1.1, 1] }
                  }
                  transition={
                    reduced
                      ? undefined
                      : {
                          duration: 3 + (i % 3),
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: i * 0.4,
                        }
                  }
                  style={{ transformOrigin: `${x}px ${y}px` }}
                />
                {/* Disque de la planète */}
                <circle
                  cx={x}
                  cy={y}
                  r={planetSize / 2}
                  fill={p.color}
                  opacity="0.95"
                />
                {/* Symbole */}
                <text
                  x={x}
                  y={y + planetSize / 2 + 10}
                  fontSize={planetSize - 2}
                  fill={p.color}
                  textAnchor="middle"
                  fontFamily="serif"
                  opacity="0.85"
                >
                  {p.symbol}
                </text>
              </g>
            );
          })}

        {/* Cœur de la roue */}
        <motion.circle
          cx={cx}
          cy={cy}
          r="6"
          fill="rgba(250,247,242,0.9)"
          animate={
            reduced
              ? undefined
              : { scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }
          }
          transition={
            reduced
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>
    </div>
  );
}

/** Étoiles décoratives derrière la roue (positions semi-aléatoires fixes). */
function SvgStars() {
  const stars = [
    { x: 12, y: 18, r: 0.6 },
    { x: 88, y: 12, r: 0.4 },
    { x: 92, y: 84, r: 0.7 },
    { x: 8, y: 76, r: 0.5 },
    { x: 50, y: 6, r: 0.4 },
    { x: 6, y: 50, r: 0.5 },
    { x: 94, y: 50, r: 0.6 },
    { x: 50, y: 94, r: 0.5 },
    { x: 18, y: 38, r: 0.3 },
    { x: 82, y: 38, r: 0.3 },
    { x: 18, y: 62, r: 0.3 },
    { x: 82, y: 62, r: 0.3 },
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {stars.map((s, i) => (
        <motion.circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="rgba(250,247,242,0.85)"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  );
}
