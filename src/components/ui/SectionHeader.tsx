import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

/**
 * SectionHeader — en-tête éditorial pour les sections de pages.
 *
 *   eyebrow → micro caps (ex: "GUIDANCE DU JOUR")
 *   title   → titre Cinzel display
 *   subtitle → corps de texte ivoire
 *
 * Variants :
 *   - center : aligné centre (hero)
 *   - left   : aligné gauche (sections internes)
 */
interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: 'center' | 'left';
  size?: 'lg' | 'md' | 'sm';
  className?: string;
  children?: ReactNode;
  /**
   * Désactive le gradient automatique sur le titre. Utile quand on veut
   * styler manuellement les sous-spans (mélange ivoire + gradient
   * comme sur la Home).
   */
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
  titlePlain = false,
}: SectionHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        align === 'center' ? 'text-center mx-auto max-w-3xl' : 'text-left',
        'space-y-3',
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'text-micro uppercase tracking-[0.18em] text-aurora-300',
            align === 'center' && 'flex items-center justify-center gap-3'
          )}
        >
          {align === 'center' && (
            <span aria-hidden="true" className="block h-px w-6 bg-aurora-300/40" />
          )}
          {eyebrow}
          {align === 'center' && (
            <span aria-hidden="true" className="block h-px w-6 bg-aurora-300/40" />
          )}
        </p>
      )}

      <h1
        className={cn(
          'font-cinzel leading-tight',
          titlePlain ? 'text-ivory-50' : 'text-gradient-aurora',
          sizeStyles[size]
        )}
      >
        {title}
      </h1>

      {subtitle && (
        <p
          className={cn(
            'text-body-lg text-ivory-200',
            align === 'center' ? 'mx-auto max-w-2xl' : ''
          )}
        >
          {subtitle}
        </p>
      )}

      {children && <div className="pt-2">{children}</div>}
    </motion.header>
  );
}
