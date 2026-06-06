import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo } from 'react';

/**
 * Glyphe marque : orbite tronquée + cardinaux discrets + foyer glace (#38bdf8).
 * Magenta réservé aux rituels in-app.
 */
interface CosmicSymbolProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  composeOnLoad?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 56,
  lg: 96,
};

const circleLen = 2 * Math.PI * 24;

export const CosmicSymbol: React.FC<CosmicSymbolProps> = ({
  size = 'md',
  className = '',
  animated = true,
  composeOnLoad = false,
}) => {
  const px = sizeMap[size];
  const prefersReducedMotion = useReducedMotion();
  const runMotion = Boolean(animated && !prefersReducedMotion);
  const rawId = useId();
  const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ''), [rawId]);
  const idFrost = `zk-mark-frost-${uid}`;
  const idCore = `zk-mark-core-${uid}`;

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      className={className}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Logo Zodiak Astro"
      initial={composeOnLoad ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <linearGradient id={idFrost} x1="14" y1="14" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" stopOpacity={0.98} />
          <stop offset="52%" stopColor="#7dd3fc" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <radialGradient id={idCore} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#f0f9ff" stopOpacity={1} />
          <stop offset="48%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity={0.45} />
        </radialGradient>
        <radialGradient id={`zk-mark-halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(56, 189, 248, 0)" />
          <stop offset="100%" stopColor="rgba(56, 189, 248, 0.12)" />
        </radialGradient>
      </defs>

      {/* Foyer + halo lecture */}
      <circle cx="32" cy="32" r="30.5" fill={`url(#zk-mark-halo-${uid})`} opacity={0.95} />
      <circle cx="32" cy="32" r="29" fill="rgba(56, 189, 248, 0.055)" />

      {/* Orbite : arc incomplet */}
      {runMotion ? (
        <motion.g
          style={{ transformOrigin: '32px 32px' }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 200,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <motion.circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke={`url(#${idFrost})`}
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeDasharray={`${circleLen * 0.62} ${circleLen}`}
            initial={
              composeOnLoad ? { strokeDashoffset: circleLen, opacity: 0 } : { strokeDashoffset: 0, opacity: 1 }
            }
            animate={{ strokeDashoffset: 0, opacity: 1 }}
            transition={{
              duration: 1.15,
              delay: composeOnLoad ? 0.08 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </motion.g>
      ) : (
        <g>
          <circle
            cx="32"
            cy="32"
            r="24"
            fill="none"
            stroke={`url(#${idFrost})`}
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeDasharray={`${circleLen * 0.62} ${circleLen}`}
          />
        </g>
      )}

      {/* Anneau de précision stationnaire */}
      <circle
        cx="32"
        cy="32"
        r="16.5"
        fill="none"
        stroke="#bae6fd"
        strokeOpacity={0.18}
        strokeWidth="0.45"
      />

      {/* Cardinals — traits d’instrument */}
      {[
        [32, 10, 32, 13],
        [32, 51, 32, 54],
        [10, 32, 13, 32],
        [51, 32, 54, 32],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line
          key={`c-${String(i)}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#bae6fd"
          strokeOpacity={0.42}
          strokeWidth="1.1"
          strokeLinecap="round"
          initial={composeOnLoad ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.35,
            delay: composeOnLoad ? 0.55 + i * 0.04 : 0,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {/* Foyer : point + halon 1px */}
      <motion.circle
        cx="32"
        cy="32"
        r="5.5"
        fill="none"
        stroke={`url(#${idCore})`}
        strokeOpacity={0.35}
        strokeWidth="0.6"
        initial={composeOnLoad ? { scale: 0.85, opacity: 0 } : { opacity: 0.35 }}
        animate={
          runMotion
            ? { scale: [1, 1.06, 1], opacity: [0.28, 0.4, 0.28] }
            : { scale: 1, opacity: 0.35 }
        }
        transition={
          runMotion
            ? {
                duration: 5.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: composeOnLoad ? 0.95 : 0,
              }
            : { duration: 0.5, delay: composeOnLoad ? 0.95 : 0 }
        }
      />
      <motion.circle
        cx="32"
        cy="32"
        r="2.15"
        fill={`url(#${idCore})`}
        initial={composeOnLoad ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.55,
          delay: composeOnLoad ? 0.85 : 0,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
      <circle cx="32" cy="32" r="0.95" fill="#fafafa" fillOpacity={0.95} />

      {/* Repère nord — losange microscopique (évite le point « pastille » cheap) */}
      <motion.path
        d="M50 13.4l1.05 1.6-1.05 1.6-1.05-1.6 1.05-1.6z"
        fill="#38bdf8"
        fillOpacity={0.75}
        initial={composeOnLoad ? { opacity: 0 } : { opacity: 0.75 }}
        animate={
          runMotion ? { opacity: [0.35, 0.85, 0.35] } : { opacity: 0.75 }
        }
        transition={
          runMotion
            ? { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }
            : { duration: 0.35 }
        }
      />
    </motion.svg>
  );
};

export default CosmicSymbol;
