import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import AppBackdrop from './AppBackdrop';
import SectionHeader from './ui/SectionHeader';
import Logo from './Logo';
import { cn } from '../lib/utils';

/**
 * PageLayout v4 — cohérent avec la landing (AppBackdrop : étoiles + grain + vignette).
 *   - Spacing radicalement augmenté (top 12-20, mb-16-24).
 *   - Suppression du gradient automatique sur le titre (titlePlain = true par défaut).
 *
 *   - `title` / `subtitle` : header éditorial (centré).
 *   - `eyebrow` : protocol-caption (mono signal), via SectionHeader.
 *   - `headerSlot` : remplace complètement le header.
 *   - `maxWidth` : largeur max du conteneur.
 *   - `dim` : réduit la densité d'étoiles pour les pages denses.
 *   - `nebula` : active la nébuleuse de fond (true par défaut).
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
  /** Réduit la densité du champ d'étoiles. */
  dim?: boolean;
  /** Désactive la nébuleuse (utile pour pages très denses). */
  noNebula?: boolean;
  /** Désactive le padding-bottom mobile. */
  fullHeight?: boolean;
  /**
   * Si true (défaut), le titre est ivoire pur. Si false, le composant
   * SectionHeader respecte les spans internes pour mixer ivoire + or.
   */
  titlePlain?: boolean;
}

const maxWidthClasses: Record<NonNullable<PageLayoutProps['maxWidth']>, string> =
  {
    sm:  'max-w-sm',
    md:  'max-w-md',
    lg:  'max-w-lg',
    xl:  'max-w-xl',
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
  noNebula = false,
  fullHeight = false,
  titlePlain = true,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        'relative min-h-screen bg-night-950 safe-top overflow-hidden',
        className,
      )}
    >
      {/* Champ d'étoiles vivant (canvas, parallaxe scroll) */}
      <AppBackdrop
        dim={dim}
        nebula={!noNebula}
        parallax
      />

      <div
        className={cn(
          'relative z-[1] isolate mx-auto px-5 md:px-10 pt-10 md:pt-20',
          fullHeight ? 'pb-6' : 'pb-32 md:pb-24',
          maxWidthClasses[maxWidth],
          contentClassName,
        )}
      >
        {/* Header éditorial */}
        {title ? (
          <div className="mb-16 md:mb-24 relative">
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center mb-10"
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
            {headerSlot && (
              <div className="mt-8 flex justify-center">{headerSlot}</div>
            )}
          </div>
        ) : headerSlot ? (
          <div className="mb-12 md:mb-16">{headerSlot}</div>
        ) : null}

        {/* Contenu animé */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
