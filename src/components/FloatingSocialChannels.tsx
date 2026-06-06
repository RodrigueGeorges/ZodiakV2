import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon } from './icons/SocialChannelIcons';

export type DeliveryChannel = 'whatsapp' | 'instagram';

type Variant = 'hero' | 'section';

interface ChannelConfig {
  id: DeliveryChannel;
  label: string;
  deliveryLabel: string;
  Icon: typeof WhatsAppIcon;
  accent: 'aurora' | 'magenta';
  className: string;
  float: { y: number; rotate: number; duration: number; delay: number };
}

const HERO_CHANNELS: ChannelConfig[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    deliveryLabel: 'DM · 8h00',
    Icon: WhatsAppIcon,
    accent: 'aurora',
    className: 'top-[16%] left-[3%] sm:left-[7%] md:left-[11%] lg:left-[14%]',
    float: { y: 12, rotate: 4, duration: 5.4, delay: 0 },
  },
  {
    id: 'instagram',
    label: 'Instagram',
    deliveryLabel: 'DM · 8h00',
    Icon: InstagramIcon,
    accent: 'magenta',
    className: 'top-[26%] right-[3%] sm:right-[6%] md:right-[10%] lg:right-[13%]',
    float: { y: 14, rotate: -5, duration: 6.2, delay: 0.5 },
  },
];

const SECTION_CHANNELS: ChannelConfig[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    deliveryLabel: '8h00',
    Icon: WhatsAppIcon,
    accent: 'aurora',
    className: '-left-2 sm:-left-5 top-8',
    float: { y: 8, rotate: 3, duration: 4.6, delay: 0.15 },
  },
  {
    id: 'instagram',
    label: 'Instagram',
    deliveryLabel: '8h00',
    Icon: InstagramIcon,
    accent: 'magenta',
    className: '-right-2 sm:-right-5 top-[5.5rem]',
    float: { y: 10, rotate: -4, duration: 5.1, delay: 0.45 },
  },
];

const accentStyles = {
  aurora: {
    gradient: 'from-aurora-400/55 via-aurora-300/20 to-transparent',
    shell: 'border-aurora-400/40 bg-aurora-500/[0.1]',
    glow: 'shadow-[0_0_40px_-8px_rgba(56,189,248,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]',
    glowSoft: 'bg-aurora-400/25',
    icon: 'text-aurora-200',
    ring: 'border-aurora-400/30',
    badge: 'bg-aurora-400 text-night-950',
    pulse: 'rgba(56,189,248,0.45)',
  },
  magenta: {
    gradient: 'from-magenta-500/50 via-magenta-400/15 to-transparent',
    shell: 'border-magenta-500/40 bg-magenta-500/[0.1]',
    glow: 'shadow-[0_0_40px_-8px_rgba(201,97,155,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]',
    glowSoft: 'bg-magenta-500/25',
    icon: 'text-magenta-300',
    ring: 'border-magenta-500/30',
    badge: 'bg-magenta-500 text-ivory-50',
    pulse: 'rgba(201,97,155,0.4)',
  },
} as const;

interface FloatingSocialChannelsProps {
  variant?: Variant;
  className?: string;
  /** Canal mis en avant (sync démo). Si absent en hero, alternance auto. */
  activeChannel?: DeliveryChannel;
  autoCycle?: boolean;
}

function HeroSignalPath({ reduceMotion }: { reduceMotion: boolean | null }) {
  if (reduceMotion) return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-40"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="signal-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(56,189,248,0.5)" />
          <stop offset="50%" stopColor="rgba(56,189,248,0.08)" />
          <stop offset="100%" stopColor="rgba(201,97,155,0.35)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 12 22 Q 50 38 88 30"
        fill="none"
        stroke="url(#signal-aurora)"
        strokeWidth="0.15"
        strokeDasharray="1.2 1.8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1, strokeDashoffset: [0, -6] }}
        transition={{
          pathLength: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 1.2 },
          strokeDashoffset: { duration: 8, repeat: Infinity, ease: 'linear' },
        }}
      />
    </svg>
  );
}

interface OrbProps {
  config: ChannelConfig;
  variant: Variant;
  active: boolean;
  reduceMotion: boolean | null;
}

function SocialOrb({ config, variant, active, reduceMotion }: OrbProps) {
  const styles = accentStyles[config.accent];
  const size =
    variant === 'hero'
      ? active
        ? 'h-[3.25rem] w-[3.25rem] md:h-14 md:w-14'
        : 'h-11 w-11 md:h-12 md:w-12'
      : active
        ? 'h-11 w-11 md:h-12 md:w-12'
        : 'h-10 w-10 md:h-11 md:w-11';
  const iconSize = variant === 'hero' ? 'h-5 w-5 md:h-[22px] md:w-[22px]' : 'h-[18px] w-[18px] md:h-5 md:w-5';

  return (
    <motion.div
      className={cn('absolute', config.className)}
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(6px)' }}
      animate={{
        opacity: active ? 1 : 0.42,
        scale: active ? 1 : 0.92,
        filter: 'blur(0px)',
      }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -config.float.y, 0],
                rotate: [0, config.float.rotate, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: config.float.duration,
                delay: config.float.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        className="relative flex flex-col items-center"
      >
        {/* Orbite active */}
        {active && !reduceMotion && (
          <motion.span
            className={cn(
              'absolute -inset-3 rounded-full border border-dashed',
              styles.ring,
            )}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
        )}

        {/* Halo respirant */}
        {!reduceMotion && (
          <motion.span
            className={cn('absolute inset-0 rounded-full blur-xl scale-150', styles.glowSoft)}
            animate={
              active
                ? { opacity: [0.35, 0.75, 0.35], scale: [1.4, 1.65, 1.4] }
                : { opacity: 0.12, scale: 1.2 }
            }
            transition={{ duration: active ? 3.2 : 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
        )}

        {/* Coque verre */}
        <div
          className={cn(
            'relative rounded-full p-px bg-gradient-to-br transition-all duration-500',
            styles.gradient,
            active && styles.glow,
          )}
        >
          <div
            className={cn(
              'relative flex items-center justify-center rounded-full border backdrop-blur-xl bg-night-900/85 transition-all duration-500',
              size,
              styles.shell,
            )}
          >
            <config.Icon className={cn(iconSize, styles.icon, 'drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]')} />

            {active && (
              <motion.span
                className={cn(
                  'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-night-900',
                  styles.badge.split(' ')[0],
                )}
                animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            )}
          </div>
        </div>

        {/* Labels */}
        <div className="mt-3 flex flex-col items-center gap-0.5">
          <span
            className={cn(
              'protocol-caption transition-colors duration-500',
              active ? 'text-ivory-300' : 'text-ivory-500/80',
            )}
          >
            {config.label}
          </span>
          {active && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'font-mono text-[9px] uppercase tracking-[0.2em]',
                config.accent === 'aurora' ? 'text-aurora-300/90' : 'text-magenta-300/90',
              )}
            >
              {config.deliveryLabel}
            </motion.span>
          )}
        </div>

        {/* Particule « message » (canal actif) */}
        {active && !reduceMotion && variant === 'hero' && (
          <motion.span
            className="absolute top-1/2 left-1/2 h-1 w-1 rounded-full bg-ivory-50/90"
            animate={{
              x: [0, config.id === 'whatsapp' ? 48 : -48, 0],
              y: [0, 28, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: config.float.delay }}
            aria-hidden
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Orbes flottants WhatsApp + Instagram — livraison matinale, teintés charte Zodiak.
 */
export default function FloatingSocialChannels({
  variant = 'hero',
  className,
  activeChannel: activeChannelProp,
  autoCycle = true,
}: FloatingSocialChannelsProps) {
  const reduceMotion = useReducedMotion();
  const channels = variant === 'hero' ? HERO_CHANNELS : SECTION_CHANNELS;
  const [internalActive, setInternalActive] = useState<DeliveryChannel>('whatsapp');

  const activeChannel = activeChannelProp ?? internalActive;

  useEffect(() => {
    if (activeChannelProp || !autoCycle || variant !== 'hero' || reduceMotion) return;
    const id = window.setInterval(() => {
      setInternalActive((c) => (c === 'whatsapp' ? 'instagram' : 'whatsapp'));
    }, 4200);
    return () => window.clearInterval(id);
  }, [activeChannelProp, autoCycle, variant, reduceMotion]);

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-visible', className)}
      aria-hidden
    >
      {variant === 'hero' && <HeroSignalPath reduceMotion={reduceMotion} />}

      {channels.map((config) => (
        <SocialOrb
          key={config.id}
          config={config}
          variant={variant}
          active={activeChannel === config.id}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
