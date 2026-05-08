import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from './ui/Button';
import { track } from '../lib/analytics';
import { cn } from '../lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'zodiak.pwa.install.dismissedAt';
const SUPPRESS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function shouldSuppressByMemory(): boolean {
  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt) return false;
    const ms = Date.now() - new Date(dismissedAt).getTime();
    return ms < SUPPRESS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

interface PWAInstallPromptProps {
  /** Délai (ms) avant d'afficher la bannière au premier déclenchement. */
  delayMs?: number;
}

/**
 * Bannière d'installation PWA :
 *  - Non-bloquante (en bas, dismissible).
 *  - Stockage local : on ne re-spam pas avant SUPPRESS_DAYS jours.
 *  - Trace les events PostHog (prompt vu, accepté, dismissed).
 */
export default function PWAInstallPrompt({ delayMs = 12000 }: PWAInstallPromptProps) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || shouldSuppressByMemory()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      const t = window.setTimeout(() => {
        setVisible(true);
        track('pwa_install_prompted');
      }, delayMs);
      return () => window.clearTimeout(t);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, [delayMs]);

  useEffect(() => {
    const onInstalled = () => {
      track('pwa_installed');
      setVisible(false);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    track('pwa_install_dismissed');
    setVisible(false);
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === 'accepted') {
      track('pwa_installed');
    } else {
      track('pwa_install_dismissed');
      try {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      } catch {
        /* ignore */
      }
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && evt && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'fixed z-50 left-1/2 -translate-x-1/2',
            'bottom-24 md:bottom-8',
            'w-[92vw] max-w-md'
          )}
          role="dialog"
          aria-labelledby="pwa-install-title"
        >
          <div className="relative rounded-3xl border border-aurora-500/30 bg-night-900/90 backdrop-blur-xl p-5 shadow-glow-aurora overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/15 via-transparent to-magenta-500/15"
            />
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer"
              className="absolute top-3 right-3 p-1.5 rounded-full text-ivory-400 hover:text-ivory-50 hover:bg-night-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-aurora-500/30 to-magenta-500/30 ring-1 ring-aurora-400/40 flex items-center justify-center">
                <Download className="w-5 h-5 text-aurora-200" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p
                  id="pwa-install-title"
                  className="font-cinzel text-body text-ivory-50"
                >
                  Installe Zodiak
                </p>
                <p className="text-caption text-ivory-300">
                  Sur ton écran d'accueil. Plus rapide, hors connexion.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={install}>
                Installer
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
