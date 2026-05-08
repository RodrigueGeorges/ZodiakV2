import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface KineticTitleProps {
  /** Tableau de "lignes" — chaque ligne sera animée et possiblement stylée. */
  lines: Array<{
    text: string;
    /** Tailwind classes additionnelles pour cette ligne. */
    className?: string;
  }>;
  className?: string;
  delay?: number;
}

/**
 * Titre kinetic typography.
 *
 * Chaque mot rentre indépendamment avec un blur + slide subtil, puis un shimmer
 * passe une fois sur l'ensemble. C'est le détail qu'on retient en première
 * visite. Inspiration Apple / Linear / Vercel.
 *
 * 100% CSS/SVG — aucun coût bundle au-delà de framer-motion (déjà chargé).
 */
export default function KineticTitle({
  lines,
  className,
  delay = 0,
}: KineticTitleProps) {
  let wordIndex = 0;
  return (
    <h1 className={cn('font-cinzel leading-[1.05]', className)}>
      {lines.map((line, lineIdx) => (
        <span
          key={lineIdx}
          className={cn('block', line.className)}
        >
          {line.text.split(/\s+/).map((word, wIdx) => {
            const i = wordIndex++;
            return (
              <motion.span
                key={`${lineIdx}-${wIdx}`}
                initial={{
                  opacity: 0,
                  y: 18,
                  filter: 'blur(8px)',
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                }}
                transition={{
                  duration: 0.85,
                  delay: delay + i * 0.085,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block mr-[0.18em] last:mr-0"
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
