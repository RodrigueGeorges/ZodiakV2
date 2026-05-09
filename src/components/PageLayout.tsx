import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AuroraBackground from './ui/AuroraBackground';
import SectionHeader from './ui/SectionHeader';
import Logo from './Logo';
import { cn } from '../lib/utils';

/**
 * PageLayout v2 — squelette éditorial unique pour toutes les pages
 * post-login. Compose : AuroraBackground, header (logo + titre éditorial),
 * contenu animé. Réserve l'espace bottom-nav sur mobile.
 *
 *   - `title` / `subtitle` : header éditorial (centré).
 *   - `eyebrow` : caps au-dessus du titre (ex : "PROFIL", "GUIDANCE").
 *   - `headerSlot` : remplace complètement le header par du custom (ex :
 *     bandeau spécial Guidance avec date du jour).
 *   - `maxWidth` : largeur max du conteneur.
 *   - `dim` : assombrit les halos pour les pages denses.
 */
interface PageLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: string;
  showLogo?: boolean;
  headerSlot?: ReactNode;
  children: ReactNode;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
  className?: string;
  contentClassName?: string;
  /** Réduit l'opacité des halos pour densités élevées de contenu. */
  dim?: boolean;
  /** Désactive le padding-bottom mobile (utile pour pleines hauteurs : chat). */
  fullHeight?: boolean;
  /**
   * Si vrai, le titre est rendu en ivoire au lieu du gradient aurora.
   * Permet de mettre en valeur certains mots avec un span gradient
   * (effet "Home" : ivoire + gradient sur la même ligne).
   */
  titlePlain?: boolean;
}

const maxWidthClasses: Record<NonNullable<PageLayoutProps['maxWidth']>, string> =
  {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

export default function PageLayout({
  title,
  subtitle,
  eyebrow,
  showLogo = true,
  headerSlot,
  children,
  maxWidth = '5xl',
  className,
  contentClassName,
  dim = false,
  fullHeight = false,
  titlePlain = false,
}: PageLayoutProps) {
  return (
    <div className={cn('page-container safe-top', className)}>
      <AuroraBackground variant={dim ? 'dim' : 'default'} />

      <div
        className={cn(
          'relative z-10 mx-auto px-4 md:px-8 pt-6 md:pt-12',
          fullHeight ? 'pb-6' : 'pb-28 md:pb-16',
          maxWidthClasses[maxWidth],
          contentClassName
        )}
      >
        {/* Header */}
        {title ? (
          <div className="mb-10 md:mb-14 relative">
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center mb-6"
              >
                <Logo size="md" />
              </motion.div>
            )}
            <SectionHeader
              eyebrow={eyebrow}
              title={title}
              subtitle={subtitle}
              align="center"
              size="md"
              titlePlain={titlePlain}
            />
            {/* Slot complémentaire (ex: streak flame, bouton retour, compteur) */}
            {headerSlot && (
              <div className="mt-5 flex justify-center">
                {headerSlot}
              </div>
            )}
          </div>
        ) : headerSlot ? (
          <div className="mb-10 md:mb-14">{headerSlot}</div>
        ) : null}

        {/* Contenu animé */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
