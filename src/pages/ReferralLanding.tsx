import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Gift, ArrowRight, AlertCircle } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import LoadingScreen from '../components/LoadingScreen';
import { rememberReferralCode } from '../lib/referral';
import { track } from '../lib/analytics';
import { useDocumentSeo } from '../lib/documentSeo';

/**
 * /r/:code — landing du parrainage.
 *
 * Vérifie le code, le mémorise en localStorage, puis propose à
 * l'utilisateur de s'inscrire (et bénéficier du bonus).
 */
export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>(
    'loading',
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setStatus('invalid');
        return;
      }
      const ok = await rememberReferralCode(code);
      if (cancelled) return;
      setStatus(ok ? 'valid' : 'invalid');
      if (ok) track('referral_landing_valid', { code });
      else track('referral_landing_invalid', { code });
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useDocumentSeo({
    title:
      status === 'loading'
        ? 'Invitation parrainage · Zodiak Astro'
        : status === 'invalid'
          ? 'Invitation invalide · Zodiak Astro'
          : 'Invitation parrainage — bonus Premium · Zodiak Astro',
    description:
      status === 'loading'
        ? 'Vérification de ton code d’invitation Zodiak Astro : horoscope personnalisé, thème natal, guidance sur WhatsApp ou Instagram.'
        : status === 'invalid'
          ? 'Rejoins Zodiak Astro pour ton horoscope personnalisé et ton thème natal — guidance chaque matin sur WhatsApp ou Instagram, essai 7 jours avec carte, puis 8,90 € / mois.'
          : 'Accepte ton invitation : 14 jours de Premium offerts (horoscope personnalisé, chat astral, synastries) — puis 8,90 € / mois, résiliable en un clic.',
  });

  if (status === 'loading') {
    return <LoadingScreen message="Vérification de l'invitation…" />;
  }

  if (status === 'invalid') {
    return (
      <PageLayout
        eyebrow="Invitation"
        title="Lien d'invitation invalide"
        subtitle="Ton horoscope personnalisé et ton thème natal t’attendent — rejoins Zodiak Astro même sans ce lien, l’expérience reste la même."
        maxWidth="lg"
        showLogo
        dim
      >
        <Card variant="surface">
          <div className="p-7 md:p-8 flex flex-col items-center text-center gap-5">
            <div className="w-14 h-14 rounded-full bg-magenta-500/10 border border-magenta-400/30 flex items-center justify-center text-magenta-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-body text-ivory-200 max-w-md">
              Le code d'invitation n'a pas été reconnu. Pas grave, tu peux
              t'inscrire normalement et bénéficier de 7 jours offerts.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Créer mon compte
            </Button>
          </div>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      eyebrow="Tu as été invité·e"
      titlePlain
      title={
        <>
          <span className="block text-ivory-50">Bienvenue dans</span>
          <span className="block text-gradient-aurora">Zodiak Astro.</span>
        </>
      }
      subtitle="Horoscope quotidien sur WhatsApp ou Instagram, chat astral calé sur ton thème natal — 8,90 € / mois après l’essai, sans engagement."
      maxWidth="lg"
      showLogo
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative p-8 md:p-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-aurora-500/10 border border-aurora-400/30 mb-5 text-aurora-200">
            <Gift className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="font-display font-light text-h2 text-ivory-50 leading-[0.95] mb-5">
            14 jours{' '}
            <span className="italic-editorial text-aurora-400">offerts</span>
          </h2>
          <p className="text-body text-ivory-200 max-w-md mx-auto mb-6">
            Grâce à l'invitation de ton ami, tu reçois{' '}
            <span className="text-aurora-200 font-medium">2 semaines de premium</span>{' '}
            au lieu de 7 jours — et il en gagne autant de son côté.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            iconLeft={<Sparkles className="w-4 h-4" />}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Activer mon bonus
          </Button>
          <p className="mt-5 eyebrow-ritual text-ivory-400/80">
            Carte requise · aucun débit si tu annules avant la fin des 14 jours · résiliable en 1 clic
          </p>
        </motion.div>
      </Card>
    </PageLayout>
  );
}
