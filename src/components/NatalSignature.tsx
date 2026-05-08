import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Compass } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card } from './ui/Card';

const ZODIAC_GLYPH: Record<string, string> = {
  Bélier: '♈',
  Taureau: '♉',
  Gémeaux: '♊',
  Cancer: '♋',
  Lion: '♌',
  Vierge: '♍',
  Balance: '♎',
  Scorpion: '♏',
  Sagittaire: '♐',
  Capricorne: '♑',
  Verseau: '♒',
  Poissons: '♓',
};

const SIGN_DESC: Record<string, string> = {
  Bélier: 'Pionnier·ère, courageux·se, direct·e.',
  Taureau: 'Fiable, patient·e, sensuel·le.',
  Gémeaux: 'Adaptable, curieux·se, communicatif·ve.',
  Cancer: 'Intuitif·ve, protecteur·trice, sensible.',
  Lion: 'Créatif·ve, généreux·se, confiant·e.',
  Vierge: 'Pratique, loyal·e, analytique.',
  Balance: 'Diplomate, juste, sociable.',
  Scorpion: 'Passionné·e, tenace, perspicace.',
  Sagittaire: 'Optimiste, aventureux·se, honnête.',
  Capricorne: 'Responsable, discipliné·e, ambitieux·se.',
  Verseau: 'Indépendant·e, humanitaire, original·e.',
  Poissons: 'Compatissant·e, artistique, sage.',
};

interface NatalSignatureProps {
  sunSign: string;
  moonSign: string;
  ascendantSign: string;
  className?: string;
}

function NatalSignature({
  sunSign,
  moonSign,
  ascendantSign,
  className,
}: NatalSignatureProps) {
  const incomplete =
    !sunSign ||
    !moonSign ||
    !ascendantSign ||
    [sunSign, moonSign, ascendantSign].some((s) =>
      ['Non disponible', 'N/A', '—'].includes(s)
    );

  if (incomplete) {
    return (
      <Card variant="surface" className={className}>
        <div className="px-6 py-6 text-center">
          <p className="text-magenta-400 text-h3 font-cinzel mb-2">⚠ Signature incomplète</p>
          <p className="text-body text-ivory-300">
            Vérifie ton heure et ton lieu de naissance pour révéler ta carte.
          </p>
        </div>
      </Card>
    );
  }

  const items = [
    {
      label: 'Soleil',
      sign: sunSign,
      icon: Sun,
      eyebrow: 'IDENTITÉ',
      tone: 'text-amber-300',
    },
    {
      label: 'Lune',
      sign: moonSign,
      icon: Moon,
      eyebrow: 'INTÉRIEUR',
      tone: 'text-aurora-200',
    },
    {
      label: 'Ascendant',
      sign: ascendantSign,
      icon: Compass,
      eyebrow: 'POSTURE',
      tone: 'text-magenta-400',
    },
  ];

  const onSignClick = (label: string, sign: string) => {
    const desc = SIGN_DESC[sign] || 'Une signature unique.';
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-sm w-full bg-night-900/95 backdrop-blur-md border border-aurora-500/30 rounded-2xl px-5 py-4 shadow-card ring-1 ring-ivory-50/[0.04]`}
        >
          <p className="text-micro uppercase tracking-[0.2em] text-aurora-300 mb-1">
            {label}
          </p>
          <p className="text-h3 font-cinzel text-ivory-50 mb-1">
            {ZODIAC_GLYPH[sign] || '✦'} {sign}
          </p>
          <p className="text-caption text-ivory-300">{desc}</p>
        </div>
      ),
      { duration: 3500, position: 'bottom-center' }
    );
  };

  return (
    <Card variant="elevated" className={className}>
      <div className="px-6 py-6">
        <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 text-center mb-1">
          Ta signature astrale
        </p>
        <h3 className="font-cinzel text-h2 text-gradient-aurora text-center mb-6">
          Soleil · Lune · Ascendant
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {items.map(({ label, sign, icon: Icon, eyebrow, tone }, i) => (
            <motion.button
              key={label}
              type="button"
              onClick={() => onSignClick(label, sign)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -3 }}
              className="group flex flex-col items-center gap-1.5 rounded-2xl bg-night-900/40 border border-night-700/60 p-4 text-center hover:border-aurora-500/40 hover:bg-night-900/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300"
              aria-label={`${label} en ${sign} — voir la description`}
            >
              <p className="text-micro uppercase tracking-[0.18em] text-ivory-400">
                {eyebrow}
              </p>
              <Icon className={`w-4 h-4 ${tone}`} aria-hidden="true" />
              <span className="text-2xl text-ivory-50 leading-none">
                {ZODIAC_GLYPH[sign] || '✦'}
              </span>
              <span className="text-caption text-ivory-200 font-cinzel">
                {sign}
              </span>
              <span className="text-micro text-ivory-400 mt-0.5">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default React.memo(NatalSignature);
