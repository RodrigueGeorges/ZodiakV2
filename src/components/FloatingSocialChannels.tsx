import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon, MessengerIcon } from './icons/SocialChannelIcons';

export type DeliveryChannel = 'whatsapp' | 'instagram' | 'messenger';

export type LandingPlacement =
  | 'hero'
  | 'pourquoi'
  | 'etapes'
  | 'apercu'
  | 'experience'
  | 'offre'
  | 'faq'
  | 'closing';

const CHANNELS = {
  whatsapp: {
    Icon: WhatsAppIcon,
    label: 'WhatsApp',
    ring: 'from-aurora-400/50 via-aurora-300/15 to-transparent',
    shell: 'border-aurora-400/35 bg-aurora-500/[0.12]',
    glow: 'bg-aurora-400/20',
    icon: 'text-aurora-200',
    shadow: 'shadow-[0_0_28px_-6px_rgba(56,189,248,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
  },
  instagram: {
    Icon: InstagramIcon,
    label: 'Instagram',
    ring: 'from-magenta-500/45 via-magenta-400/12 to-transparent',
    shell: 'border-magenta-500/35 bg-magenta-500/[0.1]',
    glow: 'bg-magenta-500/18',
    icon: 'text-magenta-300',
    shadow: 'shadow-[0_0_28px_-6px_rgba(201,97,155,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
  },
  messenger: {
    Icon: MessengerIcon,
    label: 'Messenger',
    ring: 'from-sky-400/40 via-aurora-300/12 to-transparent',
    shell: 'border-sky-400/30 bg-sky-500/[0.08]',
    glow: 'bg-sky-400/15',
    icon: 'text-sky-200',
    shadow: 'shadow-[0_0_28px_-6px_rgba(56,189,248,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]',
  },
} as const;

/** Les 3 canaux sur chaque section — positions décalées pour un effet « constellation ». */
const PLACEMENTS: Record<
  LandingPlacement,
  Array<{ channel: DeliveryChannel; className: string; delay: number; drift: number }>
> = {
  hero: [
    { channel: 'whatsapp', className: 'top-[18%] left-[4%] sm:left-[7%] md:left-[9%]', delay: 0, drift: 1 },
    { channel: 'instagram', className: 'top-[12%] right-[4%] sm:right-[6%] md:right-[8%]', delay: 0.7, drift: -1 },
    { channel: 'messenger', className: 'bottom-[28%] left-[8%] sm:left-[12%]', delay: 1.3, drift: 1 },
  ],
  pourquoi: [
    { channel: 'instagram', className: 'top-10 right-4 md:right-14', delay: 0.2, drift: -1 },
    { channel: 'messenger', className: 'bottom-10 left-4 md:left-12', delay: 0.9, drift: 1 },
    { channel: 'whatsapp', className: 'top-1/2 -translate-y-1/2 right-[3%]', delay: 1.5, drift: -1 },
  ],
  etapes: [
    { channel: 'whatsapp', className: 'top-8 left-2 md:left-6', delay: 0, drift: 1 },
    { channel: 'instagram', className: 'top-16 right-2 md:right-6', delay: 0.6, drift: -1 },
    { channel: 'messenger', className: 'bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-12 md:right-10', delay: 1.2, drift: 1 },
  ],
  apercu: [
    { channel: 'whatsapp', className: 'top-12 left-0 md:left-2', delay: 0.15, drift: 1 },
    { channel: 'instagram', className: 'top-20 right-0 md:right-2', delay: 0.75, drift: -1 },
    { channel: 'messenger', className: 'bottom-16 left-4 md:bottom-20', delay: 1.35, drift: 1 },
  ],
  experience: [
    { channel: 'messenger', className: 'top-6 left-3 md:left-8', delay: 0.3, drift: 1 },
    { channel: 'whatsapp', className: 'bottom-8 right-3 md:right-10', delay: 0.85, drift: -1 },
    { channel: 'instagram', className: 'top-1/3 right-2 md:right-12', delay: 1.4, drift: 1 },
  ],
  offre: [
    { channel: 'instagram', className: 'top-6 right-3 md:right-10', delay: 0.1, drift: -1 },
    { channel: 'whatsapp', className: 'bottom-10 left-3 md:left-10', delay: 0.7, drift: 1 },
    { channel: 'messenger', className: 'top-1/2 -translate-y-1/2 left-[2%] md:left-[6%]', delay: 1.3, drift: -1 },
  ],
  faq: [
    { channel: 'whatsapp', className: 'top-8 left-3 md:left-8', delay: 0.4, drift: 1 },
    { channel: 'instagram', className: 'top-14 right-3 md:right-8', delay: 1, drift: -1 },
    { channel: 'messenger', className: 'bottom-10 right-6 md:bottom-14 md:right-14', delay: 1.6, drift: 1 },
  ],
  closing: [
    { channel: 'whatsapp', className: 'top-12 left-[5%] md:left-[10%]', delay: 0, drift: 1 },
    { channel: 'instagram', className: 'top-20 right-[5%] md:right-[10%]', delay: 0.65, drift: -1 },
    { channel: 'messenger', className: 'bottom-[20%] left-[12%] md:left-[16%]', delay: 1.25, drift: 1 },
  ],
};

interface FloatingSocialChannelsProps {
  placement: LandingPlacement;
  className?: string;
}

function FloatingOrb({
  channel,
  className,
  delay,
  drift,
  reduceMotion,
}: {
  channel: DeliveryChannel;
  className: string;
  delay: number;
  drift: number;
  reduceMotion: boolean | null;
}) {
  const cfg = CHANNELS[channel];
  const Icon = cfg.Icon;

  return (
    <motion.div
      className={cn('absolute z-0', className)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.2 + delay * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -10, 0],
                x: [0, drift * 4, 0],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 5.5 + delay * 0.4,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        className="relative flex flex-col items-center gap-2"
      >
        <span
          className={cn('absolute inset-0 rounded-full blur-xl scale-[1.6]', cfg.glow)}
          aria-hidden
        />
        <div
          className={cn(
            'relative rounded-full p-px bg-gradient-to-br',
            cfg.ring,
            cfg.shadow,
          )}
        >
          <div
            className={cn(
              'flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full backdrop-blur-md',
              cfg.shell,
            )}
          >
            <Icon className={cn('h-[18px] w-[18px] sm:h-5 sm:w-5', cfg.icon)} />
          </div>
        </div>
        <span className="protocol-caption text-[9px] text-ivory-400/75 hidden md:block">
          {cfg.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

/**
 * Orbes flottants WA · IG · Messenger — landing uniquement, visibles et stylés.
 */
export default function FloatingSocialChannels({ placement, className }: FloatingSocialChannelsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden
    >
      {PLACEMENTS[placement].map(({ channel, className: pos, delay, drift }) => (
        <FloatingOrb
          key={`${placement}-${channel}`}
          channel={channel}
          className={pos}
          delay={delay}
          drift={drift}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  );
}
