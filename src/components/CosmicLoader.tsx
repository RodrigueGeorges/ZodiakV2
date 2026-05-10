import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

/**
 * CosmicLoader — anneaux concentriques or / ivoire (chargement).
 */
interface CosmicLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
};

export default function CosmicLoader({
  size = 'md',
  label,
  className,
}: CosmicLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Chargement en cours'}
      className={cn('flex flex-col items-center justify-center gap-5', className)}
    >
      <div className={cn('relative', sizeMap[size])}>
        {/* Halo doux en fond */}
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-aurora-400/25 blur-2xl"
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.1, 0.95] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Anneau extérieur — rotation lente, ouvert (segment) */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        >
          <defs>
            <linearGradient id="auroraOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbf3dd" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#5a472e" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#auroraOuter)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="180 110"
          />
        </motion.svg>

        {/* Anneau intérieur — sens inverse */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-2"
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <defs>
            <linearGradient id="auroraInner" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#ead183" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#fbf3dd" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#auroraInner)"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="80 200"
          />
        </motion.svg>

        {/* Cœur lumineux qui respire */}
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className={cn(
              'rounded-full bg-gradient-to-br from-ivory-50 via-aurora-200 to-magenta-400 shadow-glow-aurora',
              size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7'
            )}
          />
        </motion.div>
      </div>

      {label && (
        <p className="protocol-caption text-ivory-300/90 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
