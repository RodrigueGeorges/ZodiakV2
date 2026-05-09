import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppBackdrop from './AppBackdrop';
import Logo from './Logo';

interface AuthLayoutProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Lien bas de page (ex: "Pas encore de compte ? Inscris-toi"). */
  footer?: ReactNode;
}

/**
 * AuthLayout v3 — wrapper éditorial pour les pages auth.
 *
 * Refonte (mai 2026) :
 *   - Champ d'étoiles vivant en fond (StarField, pas AuroraBackground)
 *   - Suppression de la "carte glass" : on respire, le formulaire est
 *     directement sur le ciel étoilé (façon CHANI / AskNova)
 *   - Eyebrow Cinzel small caps en or, encadré de filets décoratifs
 *   - Titre Fraunces sculpté ivoire (plus de gradient violet)
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-night-950 safe-top safe-bottom overflow-hidden">
      <AppBackdrop density={0.36} />

      <div className="relative z-[1] isolate flex min-h-screen flex-col">
        <header className="px-6 md:px-12 py-8 border-b border-signal-600/15 md:border-b-0">
          <Link
            to="/"
            className="inline-flex items-center gap-3 group"
            aria-label="Retour à l'accueil"
          >
            <Logo size="sm" />
            <span className="font-serif text-h3 text-ivory-50 tracking-tight group-hover:text-signal-300 transition-colors duration-200 ease-brutal">
              Zodiak
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            {/* Header éditorial */}
            <div className="text-center mb-12">
              {eyebrow && (
                <p className="protocol-caption text-signal-400/85 mb-6 max-w-xs mx-auto">
                  {eyebrow}
                </p>
              )}
              <h1 className="font-serif text-display text-ivory-50 leading-[0.95] mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-body-lg text-ivory-300/90 italic-editorial mx-auto max-w-sm">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Formulaire (sans carte) */}
            <div>{children}</div>

            {footer && (
              <p className="mt-10 text-center text-caption text-ivory-300/80">
                {footer}
              </p>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
