import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import Logo from './Logo';
import { cn } from '../lib/utils';

interface WhatsAppPreviewProps {
  className?: string;
  /** Pour Instagram, on bascule la chrome (header sombre, bulles différentes). */
  channel?: 'whatsapp' | 'instagram';
}

/**
 * Preview d'une conversation WhatsApp/Instagram avec Zodiak.
 * Sert d'élément visuel de preuve dans la landing : montre concrètement
 * à quoi ressemble la guidance livrée chaque matin.
 *
 * 100% CSS, aucun asset externe — la carte se rend partout.
 */
export default function WhatsAppPreview({
  className,
  channel = 'whatsapp',
}: WhatsAppPreviewProps) {
  const isWA = channel === 'whatsapp';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -3 }}
      transition={{ duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative w-full max-w-[320px] mx-auto',
        className,
      )}
      aria-hidden="true"
    >
      {/* Halo or alchimique très subtil */}
      <div
        className="absolute -inset-8 rounded-[48px] bg-aurora-400/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Téléphone */}
      <div className="relative rounded-[40px] overflow-hidden ring-1 ring-ivory-50/15 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] bg-black">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-20" />

        {/* Status bar */}
        <div className="bg-night-900 px-6 pt-3 pb-1 flex items-center justify-between text-[10px] text-ivory-100/80 font-medium">
          <span>9:08</span>
          <span className="flex items-center gap-1">
            <span>5G</span>
            <span>•••</span>
          </span>
        </div>

        {/* Conversation chrome */}
        {isWA ? <WhatsAppHeader /> : <InstagramHeader />}

        {/* Messages */}
        <div
          className={cn(
            'px-3 pt-3 pb-6 space-y-2 min-h-[420px]',
            isWA
              ? 'bg-[#0c1c14]'
              : 'bg-gradient-to-b from-[#1a0d2e] via-[#0d0a1f] to-[#0d0a1f]',
          )}
          style={
            isWA
              ? {
                  backgroundImage:
                    'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.025) 0px, transparent 60%), radial-gradient(circle at 70% 60%, rgba(34,197,94,0.04) 0px, transparent 60%)',
                }
              : undefined
          }
        >
          <DateChip>aujourd'hui · 8h00</DateChip>

          <BubbleIn delay={0.7}>
            <span className="block font-semibold text-aurora-300 mb-1.5 text-[11px] uppercase tracking-wider">
              Bonjour, Léa
            </span>
            <span className="block text-[13.5px] leading-relaxed">
              Le Soleil dans ton 10ᵉ maison te pousse à te montrer
              aujourd'hui. Vénus en bon angle de ta Lune natale —
              c'est le bon jour pour <em className="not-italic font-semibold text-aurora-200">demander, oser, dire</em>.
            </span>
            <span className="block mt-2 text-[12px] text-ivory-200/80 italic">
              "Ta voix porte mieux que ce que tu crois."
            </span>
            <a
              className="mt-3 inline-block px-3 py-1.5 rounded-lg bg-aurora-500/20 ring-1 ring-aurora-300/40 text-[11.5px] text-aurora-100 font-medium"
              href="#"
            >
              Lire ma guidance complète →
            </a>
          </BubbleIn>

          <Timestamp delivered>8:00</Timestamp>

          <BubbleOut delay={1.5}>
            J'ai un entretien cet après-midi — un peu sous pression.
          </BubbleOut>
          <Timestamp self>8:14</Timestamp>

          <BubbleIn delay={1.9}>
            <span className="block text-[13.5px] leading-relaxed">
              Tu pars avec Mercure rétro côté Maison VI — relis ton
              CV deux fois, prends 5 min de marche avant. Et
              n'oublie pas : le ciel ne <em className="not-italic font-semibold text-aurora-200">choisit</em> pas
              pour toi, il <em className="not-italic font-semibold text-aurora-200">éclaire</em>.
            </span>
          </BubbleIn>

          <TypingDots delay={2.9} />
        </div>
      </div>
    </motion.div>
  );
}

function WhatsAppHeader() {
  return (
    <div className="bg-[#1f2c33] px-3 py-2.5 flex items-center gap-3 border-b border-white/5">
      <div className="w-8 h-8 rounded-full bg-aurora-400 flex items-center justify-center text-night-950">
        <Logo size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ivory-50 font-medium leading-tight">
          Zodiak
        </p>
        <p className="text-[10.5px] text-ivory-300 leading-tight">
          en ligne
        </p>
      </div>
      <div className="text-ivory-300 text-xl tracking-tighter">⋮</div>
    </div>
  );
}

function InstagramHeader() {
  return (
    <div className="bg-black/80 backdrop-blur px-3 py-2.5 flex items-center gap-3 border-b border-white/5">
      <div className="w-8 h-8 rounded-full bg-aurora-400 p-[2px]">
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
          <Logo size="sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ivory-50 font-medium leading-tight">
          zodiak.app
        </p>
        <p className="text-[10.5px] text-ivory-300 leading-tight">
          actif il y a 2 min
        </p>
      </div>
    </div>
  );
}

function DateChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-[10px] uppercase tracking-wider text-ivory-300">
        {children}
      </span>
    </div>
  );
}

function BubbleIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[88%] bg-[#1f2c33] text-ivory-50 rounded-2xl rounded-tl-lg px-3.5 py-2.5 shadow-sm"
    >
      {children}
    </motion.div>
  );
}

function BubbleOut({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="ml-auto max-w-[80%] bg-[#005c4b] text-ivory-50 rounded-2xl rounded-tr-lg px-3.5 py-2 text-[13.5px] leading-relaxed"
    >
      {children}
    </motion.div>
  );
}

function Timestamp({
  children,
  delivered = false,
  self = false,
}: {
  children: React.ReactNode;
  delivered?: boolean;
  self?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-[10px] text-ivory-400 px-1',
        self ? 'justify-end' : 'justify-start',
      )}
    >
      <span>{children}</span>
      {self ? (
        <CheckCheck className="w-3 h-3 text-aurora-300" />
      ) : delivered ? (
        <Check className="w-3 h-3" />
      ) : null}
    </div>
  );
}

function TypingDots({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-1.5 bg-[#1f2c33] w-fit rounded-2xl rounded-tl-lg px-3 py-2"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-ivory-300/70"
          animate={{ y: [0, -3, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </motion.div>
  );
}
