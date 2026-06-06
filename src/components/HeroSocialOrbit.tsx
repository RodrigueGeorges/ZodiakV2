import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../lib/utils';
import { WhatsAppIcon, InstagramIcon, MessengerIcon } from './icons/SocialChannelIcons';

export type DeliveryChannel = 'whatsapp' | 'instagram' | 'messenger';

const ORBITS: Array<{
  channel: DeliveryChannel;
  radius: number;
  duration: number;
  startDeg: number;
  ring: string;
  shell: string;
  glow: string;
  icon: string;
  shadow: string;
  label: string;
  Icon: typeof WhatsAppIcon;
}> = [
  {
    channel: 'whatsapp',
    label: 'WhatsApp',
    Icon: WhatsAppIcon,
    radius: 148,
    duration: 26,
    startDeg: 0,
    ring: 'from-aurora-400/50 via-aurora-300/15 to-transparent',
    shell: 'border-aurora-400/35 bg-aurora-500/[0.12]',
    glow: 'bg-aurora-400/22',
    icon: 'text-aurora-200',
    shadow: 'shadow-[0_0_24px_-6px_rgba(56,189,248,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]',
  },
  {
    channel: 'instagram',
    label: 'Instagram',
    Icon: InstagramIcon,
    radius: 168,
    duration: 32,
    startDeg: 120,
    ring: 'from-magenta-500/45 via-magenta-400/12 to-transparent',
    shell: 'border-magenta-500/35 bg-magenta-500/[0.1]',
    glow: 'bg-magenta-500/18',
    icon: 'text-magenta-300',
    shadow: 'shadow-[0_0_24px_-6px_rgba(201,97,155,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]',
  },
  {
    channel: 'messenger',
    label: 'Messenger',
    Icon: MessengerIcon,
    radius: 132,
    duration: 22,
    startDeg: 240,
    ring: 'from-sky-400/40 via-aurora-300/12 to-transparent',
    shell: 'border-sky-400/30 bg-sky-500/[0.08]',
    glow: 'bg-sky-400/16',
    icon: 'text-sky-200',
    shadow: 'shadow-[0_0_24px_-6px_rgba(56,189,248,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]',
  },
];

function OrbitIcon({
  cfg,
  reduceMotion,
}: {
  cfg: (typeof ORBITS)[number];
  reduceMotion: boolean | null;
}) {
  const Icon = cfg.Icon;

  if (reduceMotion) {
    return (
      <div
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          transform: `translate(-50%, -50%) rotate(${cfg.startDeg}deg) translateY(-${cfg.radius}px)`,
        }}
      >
        <Orb cfg={cfg} Icon={Icon} />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ width: 0, height: 0 }}
      initial={{ rotate: cfg.startDeg }}
      animate={{ rotate: cfg.startDeg + 360 }}
      transition={{
        duration: cfg.duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <motion.div
        className="absolute left-0 top-0"
        style={{ transform: `translate(-50%, -50%) translateY(-${cfg.radius}px)` }}
        animate={{ rotate: -360 }}
        transition={{
          duration: cfg.duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 3.2 + cfg.duration * 0.05,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Orb cfg={cfg} Icon={Icon} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Orb({
  cfg,
  Icon,
}: {
  cfg: (typeof ORBITS)[number];
  Icon: typeof WhatsAppIcon;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1.5">
      <span className={cn('absolute inset-0 rounded-full blur-xl scale-[1.8]', cfg.glow)} aria-hidden />
      <div className={cn('relative rounded-full p-px bg-gradient-to-br', cfg.ring, cfg.shadow)}>
        <div
          className={cn(
            'flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full backdrop-blur-md',
            cfg.shell,
          )}
        >
          <Icon className={cn('h-[18px] w-[18px] sm:h-5 sm:w-5', cfg.icon)} />
        </div>
      </div>
      <span className="protocol-caption text-[9px] text-ivory-400/80 whitespace-nowrap hidden sm:block">
        {cfg.label}
      </span>
    </div>
  );
}

/**
 * Hero uniquement — les 3 canaux tournent autour de la tagline.
 */
export default function HeroSocialOrbit({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        'h-[min(420px,78vw)] w-[min(420px,78vw)] sm:h-[380px] sm:w-[380px] md:h-[420px] md:w-[420px]',
        'scale-[0.78] sm:scale-90 md:scale-100',
        className,
      )}
      aria-hidden
    >
      {/* Anneau guide très discret */}
      {!reduceMotion && (
        <motion.div
          className="absolute inset-[12%] rounded-full border border-white/[0.04]"
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {ORBITS.map((cfg) => (
        <OrbitIcon key={cfg.channel} cfg={cfg} reduceMotion={reduceMotion} />
      ))}
    </div>
  );
}
