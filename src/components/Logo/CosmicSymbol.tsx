import { motion } from 'framer-motion';

/**
 * Logo glyph v3 — Cosmic Editorial cinematic.
 *
 * Symbole minimaliste qui se "compose" au load (Linear / Stripe-like) :
 *   1. Cercle aurora ouvert qui se trace
 *   2. Axes cardinaux qui apparaissent
 *   3. Cœur lumineux qui pulse en respiration cosmique 5s
 *
 * SVG pur, ~2kB. Pas de Lottie pour rester ultra léger.
 * Respect `prefers-reduced-motion` : version statique.
 */
interface CosmicSymbolProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Si false, version totalement statique. */
  animated?: boolean;
  /** Si true, animation "compose on load" depuis 0 (utilisé sur la landing). */
  composeOnLoad?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 56,
  lg: 96,
};

export const CosmicSymbol: React.FC<CosmicSymbolProps> = ({
  size = 'md',
  className = '',
  animated = true,
  composeOnLoad = false,
}) => {
  const px = sizeMap[size];

  // Le cercle ouvert : on contrôle stroke-dashoffset pour le tracer.
  const circleLen = 2 * Math.PI * 22; // ~138px

  return (
    <motion.svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      className={className}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Logo Zodiak"
      initial={composeOnLoad ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <defs>
        <linearGradient id="zk-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF7F2" />
          <stop offset="40%" stopColor="#C9A6FF" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        <radialGradient id="zk-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FAF7F2" stopOpacity="1" />
          <stop offset="60%" stopColor="#AB7AFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#6F33F0" stopOpacity="0.6" />
        </radialGradient>
        <filter id="zk-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Halo doux */}
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        fill="url(#zk-aurora)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.4, delay: composeOnLoad ? 1.0 : 0 }}
      />

      {/* Cercle ouvert principal — traceur progressif */}
      <motion.g
        animate={
          animated
            ? { rotate: 360 }
            : undefined
        }
        transition={{
          duration: 36,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformOrigin: '32px 32px' }}
      >
        <motion.circle
          cx="32"
          cy="32"
          r="22"
          fill="none"
          stroke="url(#zk-aurora)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${circleLen * 0.7} ${circleLen * 0.3}`}
          initial={
            composeOnLoad
              ? { strokeDashoffset: circleLen, opacity: 0 }
              : { strokeDashoffset: 0, opacity: 1 }
          }
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={{
            duration: 1.4,
            delay: composeOnLoad ? 0.1 : 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </motion.g>

      {/* Cercle intérieur */}
      <motion.circle
        cx="32"
        cy="32"
        r="14"
        fill="none"
        stroke="#C9A6FF"
        strokeOpacity="0.45"
        strokeWidth="0.75"
        initial={composeOnLoad ? { opacity: 0, scale: 0.5 } : { opacity: 0.45 }}
        animate={{ opacity: 0.45, scale: 1 }}
        transition={{
          duration: 0.7,
          delay: composeOnLoad ? 0.7 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: '32px 32px' }}
      />

      {/* 4 axes courts */}
      {[
        [32, 4, 32, 8],
        [32, 56, 32, 60],
        [4, 32, 8, 32],
        [56, 32, 60, 32],
      ].map(([x1, y1, x2, y2], i) => (
        <motion.line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#C9A6FF"
          strokeWidth="1.25"
          strokeOpacity="0.7"
          strokeLinecap="round"
          initial={composeOnLoad ? { opacity: 0 } : { opacity: 0.7 }}
          animate={{ opacity: 0.7 }}
          transition={{
            duration: 0.4,
            delay: composeOnLoad ? 1.0 + i * 0.05 : 0,
          }}
        />
      ))}

      {/* Cœur central qui respire */}
      <motion.circle
        cx="32"
        cy="32"
        r="4.5"
        fill="url(#zk-core)"
        filter="url(#zk-glow)"
        initial={composeOnLoad ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={
          animated
            ? {
                scale: [1, 1.18, 1],
                opacity: 1,
              }
            : { scale: 1, opacity: 1 }
        }
        transition={{
          duration: animated ? 5 : 0.6,
          delay: composeOnLoad ? 1.3 : 0,
          repeat: animated ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '32px 32px' }}
      />
      <circle cx="32" cy="32" r="1.4" fill="#FAF7F2" />

      {/* Étoile décorative */}
      <motion.circle
        cx="48"
        cy="14"
        r="1"
        fill="#FAF7F2"
        initial={composeOnLoad ? { opacity: 0 } : { opacity: 0.85 }}
        animate={
          animated
            ? { opacity: [0.4, 1, 0.4] }
            : { opacity: 0.85 }
        }
        transition={{
          duration: 3.4,
          repeat: animated ? Infinity : 0,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
    </motion.svg>
  );
};

export default CosmicSymbol;
