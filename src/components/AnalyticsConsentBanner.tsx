import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { APP_NAME, CONTACT_EMAIL } from '../lib/constants';
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '../lib/analyticsConsent';
import { initAnalytics, optOutAnalytics } from '../lib/analytics';

/**
 * Bandeau RGPD : analytics désactivés tant que l'utilisateur n'a pas choisi.
 */
export default function AnalyticsConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getAnalyticsConsent();
    if (consent === null) {
      setVisible(true);
      return;
    }
    if (consent === 'accepted') {
      void initAnalytics();
    } else {
      optOutAnalytics();
    }
  }, []);

  const choose = (value: AnalyticsConsent) => {
    setAnalyticsConsent(value);
    if (value === 'accepted') {
      void initAnalytics();
    } else {
      optOutAnalytics();
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="analytics-consent-title"
          aria-describedby="analytics-consent-desc"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[90] mx-auto max-w-lg rounded-2xl border border-aurora-400/15 bg-night-900/95 backdrop-blur-xl shadow-[0_24px_64px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(56,189,248,0.08)] p-5 md:p-6"
        >
          <p className="eyebrow-ritual text-aurora-300 mb-3">Confidentialité</p>
          <h2
            id="analytics-consent-title"
            className="font-display font-light text-body-lg text-ivory-50 mb-2 leading-snug"
          >
            Un signal discret pour{' '}
            <span className="italic-editorial text-aurora-400">mieux te servir.</span>
          </h2>
          <p id="analytics-consent-desc" className="text-caption text-ivory-300/95 leading-relaxed mb-4">
            {APP_NAME} peut mesurer l&apos;usage de l&apos;app (PostHog, hébergé en UE) pour améliorer
            ton expérience. Refuser ne change rien à ton accès.{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-aurora-300 hover:text-aurora-200 underline underline-offset-2"
            >
              Une question ?
            </a>
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="primary" size="sm" onClick={() => choose('accepted')} className="flex-1">
              J&apos;accepte
            </Button>
            <Button variant="ghost" size="sm" onClick={() => choose('rejected')} className="flex-1">
              Non merci
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
