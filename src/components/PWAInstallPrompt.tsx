import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';
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

function isIos(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  // iPhone / iPad / iPod (et iPad récent qui se déclare en MacIntel + touch)
  const iphoneish = /iPad|iPhone|iPod/.test(ua);
  const iPadOnDesktop =
    ua.includes('Macintosh') && 'ontouchend' in document.documentElement;
  return iphoneish || iPadOnDesktop;
}

function isSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome|Chromium/.test(ua);
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
  const [iosFallback, setIosFallback] = useState(false);

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

    // iOS Safari ne déclenche jamais `beforeinstallprompt`. On affiche
    // un overlay didactique custom, retardé pour ne pas casser l'arrivée.
    let iosTimeout: number | undefined;
    if (isIos() && isSafari()) {
      iosTimeout = window.setTimeout(() => {
        setIosFallback(true);
        setVisible(true);
        track('pwa_install_prompted', { variant: 'ios_safari' });
      }, delayMs);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      if (iosTimeout !== undefined) window.clearTimeout(iosTimeout);
    };
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
      {visible && (evt || iosFallback) && (
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
          <div className="relative rounded-md border border-aurora-400/30 bg-night-900/90 backdrop-blur-xl p-6 overflow-hidden">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer"
              className="absolute top-3 right-3 p-1.5 rounded-full text-ivory-400 hover:text-ivory-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-aurora-300"
            >
              <X className="w-4 h-4" />
            </button>

            {iosFallback ? (
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-full border border-aurora-400/30 flex items-center justify-center">
                    <Download className="w-5 h-5 text-aurora-400" aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      id="pwa-install-title"
                      className="font-display font-light text-body-lg text-ivory-50 leading-tight"
                    >
                      Installe Zodiak sur iPhone
                    </p>
                    <p className="text-caption text-ivory-300/80 italic-editorial mt-1">
                      Plus rapide, hors connexion, comme une vraie app.
                    </p>
                  </div>
                </div>
                <ol className="space-y-3 mt-4 text-caption text-ivory-200">
                  <li className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-aurora-400/40 text-aurora-400 font-sans font-medium text-caption tabular-nums">
                      1
                    </span>
                    <span>
                      Touche{' '}
                      <Share className="inline w-3.5 h-3.5 text-aurora-400" aria-hidden="true" />{' '}
                      <span className="font-medium">Partager</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-aurora-400/40 text-aurora-400 font-sans font-medium text-caption tabular-nums">
                      2
                    </span>
                    <span>
                      Choisis{' '}
                      <Plus className="inline w-3.5 h-3.5 text-aurora-400" aria-hidden="true" />{' '}
                      <span className="font-medium">Sur l'écran d'accueil</span>
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="relative flex items-center gap-4">
                <div className="w-11 h-11 rounded-full border border-aurora-400/30 flex items-center justify-center">
                  <Download className="w-5 h-5 text-aurora-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p
                    id="pwa-install-title"
                    className="font-display font-light text-body-lg text-ivory-50 leading-tight"
                  >
                    Installe Zodiak
                  </p>
                  <p className="text-caption text-ivory-300/80 italic-editorial mt-1">
                    Sur ton écran d'accueil. Plus rapide, hors connexion.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={install}>
                  Installer
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
