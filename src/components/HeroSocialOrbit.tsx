import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon } from './icons/SocialChannelIcons';

export type DeliveryChannel = 'whatsapp' | 'instagram';

const ORB_STYLE = {
  ring: 'from-aurora-400/45 via-aurora-300/12 to-transparent',
  shell: 'border-aurora-400/30 bg-aurora-500/[0.1]',
  glow: 'bg-aurora-400/18',
  icon: 'text-aurora-300',
  shadow:
    'shadow-[0_0_22px_-6px_rgba(56,189,248,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]',
} as const;

const CHANNELS: Array<{
  channel: DeliveryChannel;
  Icon: typeof WhatsAppIcon;
  duration: number;
  startDeg: number;
}> = [
  { channel: 'whatsapp', Icon: WhatsAppIcon, duration: 58, startDeg: 0 },
  { channel: 'instagram', Icon: InstagramIcon, duration: 72, startDeg: 180 },
];

function OrbitIcon({
  Icon,
  duration,
  startDeg,
  reduceMotion,
}: {
  Icon: typeof WhatsAppIcon;
  duration: number;
  startDeg: number;
  reduceMotion: boolean | null;
}) {
  if (reduceMotion) {
    return (
      <div
        className="absolute inset-0"
        style={{ transform: `rotate(${startDeg}deg)` }}
      >
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <Orb Icon={Icon} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ rotate: startDeg }}
      animate={{ rotate: startDeg + 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: -360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        <Orb Icon={Icon} />
      </motion.div>
    </motion.div>
  );
}

function Orb({ Icon }: { Icon: typeof WhatsAppIcon }) {
  return (
    <div className="relative">
      <span
        className={cn('absolute inset-0 rounded-full blur-lg scale-[1.7]', ORB_STYLE.glow)}
        aria-hidden
      />
      <div className={cn('relative rounded-full p-px bg-gradient-to-br', ORB_STYLE.ring, ORB_STYLE.shadow)}>
        <div
          className={cn(
            'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full backdrop-blur-md',
            ORB_STYLE.shell,
          )}
        >
          <Icon className={cn('h-4 w-4 sm:h-[18px] sm:w-[18px]', ORB_STYLE.icon)} />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero — ellipse explicite, plus large que le H1 : les icônes tournent autour, pas dedans.
 */
export default function HeroSocialOrbit({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center',
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          'relative',
          'w-[min(94vw,34rem)] h-[min(52vw,11.5rem)]',
          'sm:w-[min(92vw,38rem)] sm:h-[min(46vw,13rem)]',
          'md:w-[min(90vw,44rem)] md:h-[min(38vw,15rem)]',
        )}
      >
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-[50%] border border-aurora-400/[0.08]"
            animate={{ opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {CHANNELS.map(({ channel, Icon, duration, startDeg }) => (
          <OrbitIcon
            key={channel}
            Icon={Icon}
            duration={duration}
            startDeg={startDeg}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}
