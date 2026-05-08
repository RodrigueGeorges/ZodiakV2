import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AuroraBackground from './ui/AuroraBackground';
import { Card } from './ui/Card';
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
 * AuthLayout — wrapper pour les pages auth (Login, Register, RegisterComplete).
 * Aurora background + carte centrale glass + header logo. Polish max.
 */
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="page-container safe-top safe-bottom relative">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 md:px-10 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 group"
            aria-label="Retour à l'accueil"
          >
            <Logo size="sm" />
            <span className="font-cinzel text-h3 text-ivory-50 tracking-wide group-hover:text-aurora-300 transition-colors">
              Zodiak
            </span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-12 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <Card variant="elevated" className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/10 via-transparent to-magenta-500/10"
              />
              <div className="relative p-8 md:p-10">
                {eyebrow && (
                  <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 text-center mb-3">
                    {eyebrow}
                  </p>
                )}
                <h1 className="font-cinzel text-h1 md:text-display text-gradient-aurora text-center mb-2">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-body text-ivory-200 text-center mb-8">
                    {subtitle}
                  </p>
                )}
                <div className={subtitle ? '' : 'mt-6'}>{children}</div>
              </div>
            </Card>

            {footer && (
              <p className="mt-6 text-center text-caption text-ivory-300">
                {footer}
              </p>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
