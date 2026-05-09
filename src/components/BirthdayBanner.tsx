import { motion } from 'framer-motion';
import { Sun, Sparkles } from 'lucide-react';
import { Card } from './ui/Card';

interface BirthdayBannerProps {
  firstName: string;
  age: number | null;
  className?: string;
}

/**
 * Bannière "révolution solaire" affichée le jour de l'anniversaire.
 * Le ciel rejoue exactement la position solaire de la naissance →
 * c'est un moment astrologique majeur, on le célèbre dans l'app.
 */
export default function BirthdayBanner({
  firstName,
  age,
  className,
}: BirthdayBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className={className}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        {/* Fond doré + aurora pour un sentiment "fête solaire" */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/22 via-magenta-500/15 to-aurora-500/22"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-magenta-500/30 blur-3xl"
        />

        <div className="relative px-6 md:px-10 py-8 md:py-10">
          <div className="flex items-center gap-2 mb-3">
            <Sun
              className="w-4 h-4 text-amber-300 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-micro uppercase tracking-[0.32em] text-amber-200">
              Révolution solaire
            </span>
          </div>

          <h2 className="font-cinzel text-h1 md:text-display leading-tight">
            <span className="text-ivory-50">{firstName}, </span>
            <span className="text-gradient-aurora">aujourd'hui le ciel rejoue ta naissance.</span>
          </h2>

          <p className="mt-4 text-body md:text-body-lg text-ivory-200 leading-relaxed max-w-2xl">
            Le Soleil revient exactement à la position qu'il occupait le jour
            où tu es né·e — un seuil, une bascule, une promesse.
            {age != null && age > 0 && (
              <>
                {' '}
                Bienvenue dans ta{' '}
                <span className="text-amber-200 font-medium">
                  {age}
                  <sup>{age === 1 ? 'ère' : 'ème'}</sup> année
                </span>{' '}
                solaire.
              </>
            )}{' '}
            La guidance du jour est habillée pour l'occasion.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 text-caption text-amber-200">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Joyeux retour solaire ✦</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
