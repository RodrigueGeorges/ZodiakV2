import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Compass } from 'lucide-react';
import { toast } from '../lib/toast';
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
          <p className="text-magenta-400 text-h3 font-display font-medium mb-2">⚠ Signature incomplète</p>
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
      eyebrow: 'Identité',
      tone: 'text-aurora-400',
    },
    {
      label: 'Lune',
      sign: moonSign,
      icon: Moon,
      eyebrow: 'Intérieur',
      tone: 'text-ivory-100',
    },
    {
      label: 'Ascendant',
      sign: ascendantSign,
      icon: Compass,
      eyebrow: 'Posture',
      tone: 'text-aurora-400',
    },
  ];

  const onSignClick = (label: string, sign: string) => {
    const desc = SIGN_DESC[sign] || 'Une signature unique.';
    toast.info(`${label} : ${ZODIAC_GLYPH[sign] || '✦'} ${sign} — ${desc}`);
  };

  return (
    <Card variant="elevated" className={className}>
      <div className="px-7 py-9 md:px-10 md:py-12">
        <p className="protocol-caption text-ivory-400 text-center mb-4">
          Ta signature astrale
        </p>
        <h3 className="font-display font-extralight text-h1 text-ivory-50 text-center mb-9 leading-tight tracking-[-0.02em]">
          Soleil · Lune ·{' '}
          <span className="italic-editorial text-aurora-400">Ascendant</span>
        </h3>
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {items.map(({ label, sign, icon: Icon, eyebrow, tone }, i) => (
            <motion.button
              key={label}
              type="button"
              onClick={() => onSignClick(label, sign)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -3 }}
              className="group flex flex-col items-center gap-2 bg-night-900/40 border border-white/[0.1] p-5 text-center rounded-xl hover:border-aurora-400/35 transition-colors duration-300 ease-brutal focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-400"
              aria-label={`${label} en ${sign} — voir la description`}
            >
              <p className="eyebrow-ritual text-ivory-400/80">{eyebrow}</p>
              <Icon className={`w-4 h-4 ${tone}`} aria-hidden="true" />
              <span className="text-3xl text-ivory-50 leading-none my-1">
                {ZODIAC_GLYPH[sign] || '✦'}
              </span>
              <span className="text-caption text-ivory-200 font-display font-normal">
                {sign}
              </span>
              <span className="eyebrow-ritual text-ivory-400/70 mt-1">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default React.memo(NatalSignature);
