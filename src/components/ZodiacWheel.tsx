import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * ZodiacWheel — roue du thème natal (anneaux or / bronze sur vide noir).
 * SVG responsive, glyphes ivoire, tooltips planètes, animations d’entrée.
 */

interface Planet {
  name: string;
  sign?: string;
  degree?: number;
  longitude: number;
}

interface NatalChart {
  planets?: Planet[];
  ascendant?: { sign?: string; longitude?: number; degree?: number };
}

interface ZodiacWheelProps {
  natalChart: NatalChart;
  className?: string;
  size?: number;
}

const ZODIAC = [
  { name: 'Bélier', symbol: '♈' },
  { name: 'Taureau', symbol: '♉' },
  { name: 'Gémeaux', symbol: '♊' },
  { name: 'Cancer', symbol: '♋' },
  { name: 'Lion', symbol: '♌' },
  { name: 'Vierge', symbol: '♍' },
  { name: 'Balance', symbol: '♎' },
  { name: 'Scorpion', symbol: '♏' },
  { name: 'Sagittaire', symbol: '♐' },
  { name: 'Capricorne', symbol: '♑' },
  { name: 'Verseau', symbol: '♒' },
  { name: 'Poissons', symbol: '♓' },
];

const PLANET_GLYPH: Record<string, string> = {
  Soleil: '☉',
  Lune: '☾',
  Mercure: '☿',
  Vénus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturne: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluton: '♇',
};

export default function ZodiacWheel({
  natalChart,
  className,
  size = 320,
}: ZodiacWheelProps) {
  const [hover, setHover] = useState<string | null>(null);

  const cx = 200;
  const cy = 200;
  const rOuter = 175;
  const rInnerRing = 145;
  const rPlanetTrack = 110;
  const rHubInner = 60;

  const polar = (deg: number, r: number) => {
    // 0° = Bélier en haut (12h), sens trigo classique
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div
      role="img"
      aria-label="Carte du ciel — thème natal"
      className={cn('relative w-full max-w-md mx-auto', className)}
      style={{ aspectRatio: '1 / 1' }}
    >
      <motion.svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: size, height: size, maxWidth: '100%' }}
      >
        <defs>
          <linearGradient id="zw-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbf3dd" />
            <stop offset="50%" stopColor="#aa8558" />
            <stop offset="100%" stopColor="#5a472e" />
          </linearGradient>
          <radialGradient id="zw-planet" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#f4ecdb" />
            <stop offset="55%" stopColor="#c9ae8c" />
            <stop offset="100%" stopColor="#3d3832" />
          </radialGradient>
          <radialGradient id="zw-hub" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1714" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <filter id="zw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* Anneau extérieur */}
        <circle
          cx={cx}
          cy={cy}
          r={rOuter}
          fill="none"
          stroke="url(#zw-ring)"
          strokeWidth="1.25"
          opacity="0.85"
        />
        <circle
          cx={cx}
          cy={cy}
          r={rInnerRing}
          fill="none"
          stroke="url(#zw-ring)"
          strokeWidth="0.75"
          opacity="0.5"
        />

        {/* 12 graduations de signes */}
        {ZODIAC.map((sign, i) => {
          const startDeg = i * 30;
          const inner = polar(startDeg, rInnerRing);
          const outer = polar(startDeg, rOuter);
          const labelPos = polar(startDeg + 15, (rOuter + rInnerRing) / 2);
          return (
            <motion.g
              key={sign.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
            >
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#aa8558"
                strokeOpacity="0.22"
                strokeWidth="0.75"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fill="#f4ecdb"
                opacity="0.85"
              >
                {sign.symbol}
              </text>
            </motion.g>
          );
        })}

        {/* 12 maisons (cusps) — lignes très subtiles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = polar(i * 30, rHubInner);
          const b = polar(i * 30, rInnerRing);
          return (
            <line
              key={`house-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#5C5C82"
              strokeOpacity="0.25"
              strokeWidth="0.5"
              strokeDasharray="2 3"
            />
          );
        })}

        {/* Hub central (esthétique) */}
        <circle
          cx={cx}
          cy={cy}
          r={rHubInner}
          fill="url(#zw-hub)"
          stroke="#171729"
          strokeWidth="1"
        />

        {/* Planètes */}
        {natalChart?.planets?.map((planet, i) => {
          const pos = polar(planet.longitude, rPlanetTrack);
          const labelPos = polar(planet.longitude, rPlanetTrack - 24);
          const id = `planet-${planet.name}`;
          const tooltip = `${planet.name}${planet.sign ? ' en ' + planet.sign : ''}${
            typeof planet.degree === 'number'
              ? ` · ${planet.degree.toFixed(1)}°`
              : ''
          }`;
          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06, duration: 0.5 }}
              onMouseEnter={() => setHover(tooltip)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'help' }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="9"
                fill="url(#zw-planet)"
                filter="url(#zw-glow)"
                opacity="0.95"
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="600"
                fill="#080706"
              >
                {PLANET_GLYPH[planet.name] || '✦'}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                fontSize="9"
                fill="#EAE2D4"
                opacity="0.7"
              >
                {planet.name.slice(0, 3)}
              </text>
            </motion.g>
          );
        })}

        {/* Ascendant — repère cardinal */}
        {natalChart?.ascendant?.longitude !== undefined && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          >
            {(() => {
              const asc = polar(natalChart.ascendant!.longitude!, rOuter + 14);
              return (
                <>
                  <text
                    x={asc.x}
                    y={asc.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontFamily="Cinzel, serif"
                    fill="#c9619b"
                    letterSpacing="0.1em"
                  >
                    ASC
                  </text>
                </>
              );
            })()}
          </motion.g>
        )}

        {/* Glyphe central */}
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fill="#aa8558"
          opacity="0.9"
        >
          ✦
        </text>
      </motion.svg>

      {/* Tooltip flottant */}
      {hover && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 px-3 py-1.5 rounded-full bg-night-900/95 border border-aurora-500/30 text-caption text-ivory-100 font-cinzel shadow-card backdrop-blur-md"
        >
          {hover}
        </motion.div>
      )}
    </div>
  );
}
