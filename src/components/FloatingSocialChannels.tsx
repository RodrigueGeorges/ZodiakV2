import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon } from './icons/SocialChannelIcons';

export type DeliveryChannel = 'whatsapp' | 'instagram';

/** Positions prédéfinies — une landing, des repères discrets par section. */
export type LandingPlacement =
  | 'hero'
  | 'pourquoi'
  | 'etapes'
  | 'apercu'
  | 'experience'
  | 'offre'
  | 'faq'
  | 'closing';

const ICONS = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
} as const;

const ACCENT = {
  whatsapp: 'text-aurora-400/55',
  instagram: 'text-magenta-400/50',
} as const;

/** Une icône par repère, opacité basse, positions variées au scroll. */
const PLACEMENTS: Record<
  LandingPlacement,
  Array<{ channel: DeliveryChannel; className: string; delay: number }>
> = {
  hero: [
    { channel: 'whatsapp', className: 'top-[20%] left-[6%] md:left-[10%]', delay: 0 },
    { channel: 'instagram', className: 'top-[34%] right-[6%] md:right-[10%]', delay: 1.2 },
  ],
  pourquoi: [{ channel: 'instagram', className: 'bottom-8 right-6 md:bottom-12 md:right-16', delay: 0.4 }],
  etapes: [
    { channel: 'whatsapp', className: 'top-10 left-3 md:left-8', delay: 0 },
    { channel: 'instagram', className: 'bottom-6 right-3 md:bottom-10 md:right-8', delay: 0.8 },
  ],
  apercu: [
    { channel: 'whatsapp', className: 'top-14 left-0 lg:left-4', delay: 0.2 },
    { channel: 'instagram', className: 'bottom-24 right-0 lg:right-4', delay: 1 },
  ],
  experience: [
    { channel: 'whatsapp', className: 'top-6 left-4 md:left-10', delay: 0.3 },
    { channel: 'instagram', className: 'bottom-10 right-4 md:right-10', delay: 0.9 },
  ],
  offre: [
    { channel: 'instagram', className: 'top-8 right-4 md:right-12', delay: 0.5 },
    { channel: 'whatsapp', className: 'bottom-12 left-4 md:left-12', delay: 0 },
  ],
  faq: [{ channel: 'whatsapp', className: 'top-6 left-4 md:left-10', delay: 0.6 }],
  closing: [
    { channel: 'whatsapp', className: 'top-16 left-[7%]', delay: 0 },
    { channel: 'instagram', className: 'top-28 right-[7%]', delay: 1.1 },
  ],
};

interface FloatingSocialChannelsProps {
  placement: LandingPlacement;
  className?: string;
}

function WhisperOrb({
  channel,
  className,
  delay,
  reduceMotion,
}: {
  channel: DeliveryChannel;
  className: string;
  delay: number;
  reduceMotion: boolean | null;
}) {
  const Icon = ICONS[channel];

  return (
    <motion.div
      className={cn('absolute hidden sm:block', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 + delay * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 7 + delay, delay, repeat: Infinity, ease: 'easeInOut' }
        }
        className={cn(
          'flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full',
          'border border-white/[0.07] bg-night-900/35 backdrop-blur-sm',
          'opacity-[0.22] md:opacity-[0.28]',
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 md:h-4 md:w-4', ACCENT[channel])} />
      </motion.div>
    </motion.div>
  );
}

/**
 * Repères visuels WhatsApp / Instagram — landing uniquement, très discrets.
 */
export default function FloatingSocialChannels({ placement, className }: FloatingSocialChannelsProps) {
  const reduceMotion = useReducedMotion();
  const markers = PLACEMENTS[placement];

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {markers.map(({ channel, className: pos, delay }) => (
        <WhisperOrb
          key={`${placement}-${channel}-${pos}`}
          channel={channel}
          className={pos}
          delay={delay}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
