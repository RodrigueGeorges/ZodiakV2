import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SectionHeader v3 — en-tête éditorial "Cosmic Editorial Ritual".
 *
 *   eyebrow → Cinzel small caps en or, encadré de filets décoratifs
 *   title   → Fraunces sculpté, ÉNORME, couleur ivoire crème
 *   subtitle → Fraunces italique en taupe doux
 *
 * Refonte :
 *   - Fini le text-gradient-aurora (couleur unie ivoire désormais)
 *   - Filets décoratifs encadrant l'eyebrow (signature éditoriale)
 *   - Titres beaucoup plus gros (echelle clamp + display-xl)
 *   - Sous-titre en italique éditorial doux
 */
interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  size?: 'lg' | 'md' | 'sm';
  className?: string;
  children?: ReactNode;
  /** Si true, le titre est ivoire pur. Si false, il peut accepter des spans
   *  intérieurs avec couleurs personnalisées. Default = true. */
  titlePlain?: boolean;
}

const sizeStyles = {
  lg: 'text-display-xl',
  md: 'text-display',
  sm: 'text-h1',
} as const;

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  size = 'md',
  className,
  children,
  titlePlain = true,
}: SectionHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left',
        'space-y-5',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'eyebrow-ritual',
            align === 'center'
              ? 'flex items-center justify-center gap-3'
              : 'inline-flex items-center gap-3',
          )}
        >
          <span
            aria-hidden="true"
            className="block h-px w-8 bg-aurora-400/40"
          />
          <span>{eyebrow}</span>
          <span
            aria-hidden="true"
            className="block h-px w-8 bg-aurora-400/40"
          />
        </p>
      )}

      <h1
        className={cn(
          'font-serif leading-[0.95]',
          titlePlain ? 'text-ivory-50' : '',
          sizeStyles[size],
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={cn(
            'text-body-lg text-ivory-300/90 italic-editorial',
            align === 'center' ? 'mx-auto max-w-2xl' : '',
          )}
        >
          {subtitle}
        </p>
      )}

      {children && <div className="pt-3">{children}</div>}
    </motion.header>
  );
}
