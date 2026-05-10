import { motion } from 'framer-motion';
import { Sun, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';

interface BirthdayBannerProps {
  firstName: string;
  age: number | null;
  className?: string;
}

/**
 * BirthdayBanner v3 — révolution solaire éditoriale.
 * Plus de blob halos amber/magenta. Juste un accent or, du texte sculpté.
 */
export default function BirthdayBanner({
  firstName,
  age,
  className,
}: BirthdayBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <div className="relative px-7 md:px-14 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-5">
            <Sun
              className="w-4 h-4 text-aurora-400 animate-pulse"
              aria-hidden="true"
            />
            <span className="eyebrow-ritual text-aurora-400">
              Révolution solaire
            </span>
          </div>

          <h2 className="font-display text-h1 md:text-display leading-[1.0]">
            <span className="text-ivory-50">{firstName}, </span>
            <span className="italic-editorial text-aurora-400">
              aujourd'hui le ciel rejoue ta naissance.
            </span>
          </h2>

          <p className="mt-7 text-body-lg text-ivory-200/90 leading-[1.7] max-w-2xl">
            Le Soleil revient exactement à la position qu'il occupait le jour
            où tu es né·e — un seuil, une bascule, une promesse.
            {age != null && age > 0 && (
              <>
                {' '}
                Bienvenue dans ta{' '}
                <span className="text-aurora-300 font-medium italic-editorial">
                  {age}
                  <sup>{age === 1 ? 'ère' : 'ème'}</sup> année
                </span>{' '}
                solaire.
              </>
            )}{' '}
            La guidance du jour est habillée pour l'occasion.
          </p>

          <div className="mt-7 inline-flex items-center gap-2 eyebrow-ritual text-aurora-400">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Joyeux retour solaire</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
