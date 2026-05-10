import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
 * AuthLayout — pages auth sur le ciel global, alignées sur la landing :
 * `font-display`, filets discrets, accents aurora, pas de carte glass.
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-transparent safe-top safe-bottom overflow-hidden">
      <div className="relative z-[1] isolate flex min-h-screen flex-col">
        <header className="px-6 md:px-10 lg:px-12 py-8 border-b border-white/[0.09] md:border-b-0 md:pb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-3 group"
            aria-label="Retour à l'accueil"
          >
            <Logo size="sm" />
            <span className="font-display text-h3 text-ivory-50 tracking-[-0.02em] font-medium group-hover:text-aurora-400 transition-colors duration-300 ease-brutal">
              Zodiak
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 md:px-8 pb-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Header éditorial */}
            <div className="text-center mb-11 md:mb-12">
              {eyebrow && (
                <p className="protocol-caption text-ivory-400/95 mb-7 max-w-xs mx-auto">{eyebrow}</p>
              )}
              <h1 className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.02em] mb-4">
                {title}
              </h1>
              {subtitle && (
                <p className="text-body-lg text-ivory-400/90 italic-editorial mx-auto max-w-sm font-light leading-[1.72]">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Formulaire (sans carte) */}
            <div className="space-y-5">{children}</div>

            {footer && (
              <p className="mt-11 text-center text-caption text-ivory-400/85 leading-relaxed">{footer}</p>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
