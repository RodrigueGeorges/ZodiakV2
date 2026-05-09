import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  Heart,
  MessageCircle,
  Sparkles,
  Sun,
  MessageSquare,
  Instagram,
} from 'lucide-react';
import Logo from '../components/Logo';
import AuroraShader from '../components/AuroraShader';
import AuroraBackground from '../components/ui/AuroraBackground';
import WhatsAppPreview from '../components/WhatsAppPreview';
import ZodiacStrip from '../components/ZodiacStrip';
import CosmicWheel from '../components/CosmicWheel';
import ParallaxStars from '../components/ParallaxStars';
import SpotlightCard from '../components/SpotlightCard';
import MagneticButton from '../components/MagneticButton';
import LiveCounter from '../components/LiveCounter';
import FAQ from '../components/FAQ';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';
import { ShieldCheck, Lock, Zap, Ban } from 'lucide-react';

/**
 * Home — landing v3 "Cosmic Editorial Cinematic".
 *
 * Structure scroll-driven en 6 chapitres :
 *  1. Hero shader WebGL + kinetic typography + CTA
 *  2. "Le ciel ce soir" — un instantané live (phase lunaire actuelle)
 *  3. "Trois rituels par jour" — guidance / mémoire / lien
 *  4. "La carte qui te ressemble" — œuvre signature
 *  5. Pricing transparent
 *  6. CTA final + footer signé
 *
 * Tous les chapitres ont des transitions parallax, mais l'ensemble reste
 * léger côté perf (pas de Three.js, juste CSS + 1 fragment shader).
 */
export default function Home() {
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const navigate = useNavigate();

  const heroRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  // Parallax léger : le titre se déplace de ~24px sur les premiers 600px de scroll.
  const heroTitleY = useTransform(scrollY, [0, 600], [0, -32]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.45]);

  useEffect(() => {
    if (user) {
      navigate('/guidance', { replace: true });
    }
  }, [user, navigate]);

  if (isLoading && user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-950">
        <CosmicLoader />
      </div>
    );
  }
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-950">
        <CosmicLoader />
      </div>
    );
  }

  const moonNow = moonPhaseAt(new Date());

  return (
    <div className="relative bg-night-950 text-ivory-50 overflow-x-hidden">
      {/* Étoiles parallax couvrent toute la page (3 couches de profondeur) */}
      <ParallaxStars className="z-0" density={0.85} />

      {/* Header très léger, transparent. En mobile on cache "Se connecter" pour
          ne pas surcharger ; il reste accessible via le CTA secondaire du hero. */}
      <header className="absolute z-30 top-0 inset-x-0 px-5 md:px-10 py-4 md:py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="Accueil Zodiak">
          <Logo size="sm" />
          <span className="font-cinzel text-h3 text-ivory-50 tracking-wide group-hover:text-aurora-300 transition-colors">
            Zodiak
          </span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            to="/login"
            className="hidden sm:inline-block text-caption text-ivory-200 hover:text-aurora-300 transition-colors px-2 py-1"
          >
            Se connecter
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/register')}
          >
            Commencer
          </Button>
        </div>
      </header>

      {/* ─── CHAPITRE 1 : HERO ──────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-28 pb-24 md:pb-32 overflow-hidden"
      >
        <AuroraShader />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-night-950/50 via-transparent to-night-950 pointer-events-none"
        />

        <motion.div
          style={{ y: heroTitleY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl grid lg:grid-cols-[1.15fr_1fr] items-center gap-10 lg:gap-16"
        >
          {/* Colonne gauche : titre + sub + CTA */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-5 md:mb-7"
            >
              Personnalisé sur ton thème natal
            </motion.p>

            <h1 className="font-cinzel leading-[1.05] tracking-tight text-[clamp(2.5rem,7vw,5.5rem)]">
              <motion.span
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.85, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="block text-ivory-50"
              >
                Ton ciel,
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.85, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="block text-gradient-aurora"
              >
                chaque matin.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.0 }}
              className="mt-6 md:mt-8 text-body md:text-body-lg text-ivory-200 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Une lecture précise du ciel basée sur ton thème natal,
              livrée chaque matin sur{' '}
              <span className="inline-flex items-center gap-1 text-ivory-50 font-medium">
                <MessageSquare className="w-4 h-4 text-emerald-300" />
                WhatsApp
              </span>{' '}
              ou{' '}
              <span className="inline-flex items-center gap-1 text-ivory-50 font-medium">
                <Instagram className="w-4 h-4 text-magenta-300" />
                Instagram
              </span>
              {' '}— à l'heure que tu choisis.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.2 }}
              className="mt-9 md:mt-11 flex flex-col items-center lg:items-start gap-4"
            >
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <MagneticButton className="w-full sm:w-auto" strength={0.3} range={18}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/register')}
                    iconLeft={<Sparkles className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    Découvrir ma carte
                  </Button>
                </MagneticButton>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  J'ai déjà un compte
                </Button>
              </div>
              <p className="text-micro uppercase tracking-[0.22em] text-ivory-400">
                7 jours offerts · sans carte bancaire · annulable en 1 clic
              </p>
            </motion.div>
          </div>

          {/* Colonne droite : preview WhatsApp */}
          <div className="order-1 lg:order-2 flex justify-center">
            <WhatsAppPreview />
          </div>
        </motion.div>

        {/* Indicateur scroll — ≥ md uniquement, ancré bas, ne chevauche jamais le CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.7, 0.3, 0.7] }}
          transition={{ duration: 3.6, delay: 1.8, repeat: Infinity }}
          className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 z-10"
          aria-hidden="true"
        >
          <span className="text-micro uppercase tracking-[0.22em] text-ivory-400">
            Continuer
          </span>
          <div className="w-px h-10 bg-gradient-to-b from-aurora-300 to-transparent" />
        </motion.div>
      </section>

      {/* ─── TRUST STRIP : juste après le hero ──────────────────── */}
      <section className="relative bg-night-950 border-y border-night-700/40 py-6 md:py-7 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
          <TrustBadge
            icon={<Zap className="w-4 h-4" />}
            title="95 % d'ouverture"
            text="vs 20 % par e-mail"
          />
          <TrustBadge
            icon={<Lock className="w-4 h-4" />}
            title="Données chiffrées"
            text="hébergées en UE · RGPD"
          />
          <TrustBadge
            icon={<ShieldCheck className="w-4 h-4" />}
            title="Jamais revendues"
            text="ni à des tiers, ni en pub"
          />
          <TrustBadge
            icon={<Ban className="w-4 h-4" />}
            title="Sans engagement"
            text="annulable en 1 clic"
          />
        </div>
      </section>

      {/* ─── BANDEAU ZODIAC : marquee infini, glyphes premium ────── */}
      <section className="relative py-12 md:py-16 px-0 bg-night-950 border-t border-night-700/30">
        <p className="text-center text-micro uppercase tracking-[0.32em] text-ivory-400 mb-6">
          Pour les douze signes
        </p>
        <ZodiacStrip variant="marquee" duration={50} />
      </section>

      {/* ─── CHAPITRE 2 : LE CIEL CE SOIR ───────────────────────── */}
      <Chapter
        eyebrow="Le ciel · en direct"
        title={
          <>
            <span className="inline-block mr-3 align-middle text-[0.85em]">
              {moonNow.glyph}
            </span>
            {moonNow.label}.
          </>
        }
        body={
          <>
            Aujourd'hui {' '}
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            , la Lune est à <span className="text-aurora-200">
              {Math.round(moonNow.illumination * 100)} %
            </span>{' '}
            de luminosité. Chaque guidance que tu lis part de ce ciel —
            croisé au degré près avec ton thème natal. Précis, vivant,
            <em className="not-italic text-ivory-50"> jamais générique.</em>
          </>
        }
        align="center"
      />

      {/* ─── CHAPITRE 3 : TROIS PILIERS ─────────────────────────── */}
      <section className="relative py-20 md:py-32 px-6">
        <AuroraBackground variant="dim" withStars={false} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Trois piliers
            </p>
            <h2 className="font-cinzel text-display md:text-[64px] text-ivory-50 leading-tight">
              Tout ce dont tu as besoin
              <br className="hidden md:inline" />
              pour <span className="text-gradient-aurora">te lire.</span>
            </h2>
            <p className="mt-4 text-body text-ivory-300 max-w-2xl mx-auto">
              Pas trois apps, pas trois abonnements. Une seule expérience
              qui t'accompagne du matin au soir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            <RitualCard
              icon={<Sun className="w-5 h-5" />}
              title="Guidance du jour"
              kicker="Chaque matin · 1 message"
              text="Une lecture courte du ciel, calibrée sur ton thème natal. Livrée sur WhatsApp ou Instagram à l'heure que tu choisis."
              tone="amber"
            />
            <RitualCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="Guide astral IA"
              kicker="À toute heure · sans limite"
              text="Pose tes questions, reçois des réponses adaptées à ton thème. La voix se souvient de toi — plus tu échanges, mieux elle te lit."
              tone="aurora"
            />
            <RitualCard
              icon={<Heart className="w-5 h-5" />}
              title="Liens & synastrie"
              kicker="En quelques secondes"
              text="Compare ton ciel à celui d'un proche. Compatibilité, tensions, points forts — illustré, expliqué, partageable."
              tone="magenta"
            />
          </div>
        </div>
      </section>

      {/* ─── CHAPITRE 4 : ŒUVRE QUI TE RESSEMBLE ────────────────── */}
      <section className="relative py-20 md:py-32 px-6 bg-night-950 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-aurora-500/5 to-transparent"
        />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="order-2 md:order-1"
          >
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Ton thème natal · vivant
            </p>
            <h2 className="font-cinzel text-display md:text-[64px] text-ivory-50 mb-5 leading-tight">
              Ta carte du ciel,
              <br />
              <span className="text-gradient-aurora">en mouvement.</span>
            </h2>
            <p className="text-body md:text-body-lg text-ivory-200 leading-relaxed mb-6">
              On calcule ton thème natal au degré près à partir de ta
              date, ton heure et ton lieu de naissance. Tu vois tes douze
              signes, tes maisons, tes sept planètes — et les aspects
              qu'elles forment entre elles. Vivant, animé, partageable.
            </p>
            <ul className="space-y-2 mb-7 text-body text-ivory-200">
              <FeatureLi>Calcul précis (Swiss Ephemeris-grade)</FeatureLi>
              <FeatureLi>Ascendant, planètes, maisons, aspects</FeatureLi>
              <FeatureLi>Œuvre générative à imprimer ou partager</FeatureLi>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/register')}
                iconLeft={<Compass className="w-4 h-4" />}
              >
                Voir ma carte
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-1 md:order-2 max-w-md mx-auto w-full"
          >
            <CosmicWheel className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* ─── CHAPITRE 5 : PRICING — 3 plans ─────────────────────── */}
      <section id="pricing" className="relative py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <div className="mb-5 flex justify-center">
              <LiveCounter />
            </div>
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Tarif transparent
            </p>
            <h2 className="font-cinzel text-display md:text-[56px] text-ivory-50 leading-tight">
              Choisis ce qui te ressemble.
            </h2>
            <p className="mt-4 text-body text-ivory-300 max-w-xl mx-auto">
              Pas de pub, pas de revente de données, pas de paliers cachés.
              Tu paies une fois, tu profites de tout.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            <PriceCard
              eyebrow="Mensuel"
              price="8,99 €"
              priceSuffix="/ mois"
              hint="Idéal pour essayer"
              ctaLabel="Commencer mon essai"
              onCta={() => navigate('/register')}
              features={[
                'Guidance quotidienne illimitée',
                'Chat astral IA (mémoire long-terme)',
                'Synastries illimitées',
                'Calendrier lunaire 30 jours',
                'Œuvre cosmique partageable',
              ]}
            />

            <PriceCard
              eyebrow="Annuel"
              price="69 €"
              priceSuffix="/ an"
              perMonth="≈ 5,75 € / mois"
              badge="Recommandé · −36 %"
              highlighted
              hint="Tu économises 38 € sur l'année"
              ctaLabel="Choisir l'annuel"
              onCta={() => navigate('/register')}
              features={[
                'Tout du plan mensuel',
                '2 mois offerts',
                'Stories HD imprimables',
                'Accès anticipé aux nouveautés',
                'Support prioritaire',
              ]}
            />

            <PriceCard
              eyebrow="À vie"
              price="129 €"
              priceSuffix="une fois"
              hint="Offre fondateur · 100 places"
              badge="Édition limitée"
              ctaLabel="Devenir fondateur"
              onCta={() => navigate('/register')}
              features={[
                'Tout, pour toujours',
                'Aucun renouvellement',
                'Place fondateur · profil orné',
                'Vote sur la roadmap',
                'Accès aux betas privées',
              ]}
            />
          </div>

          <p className="text-center mt-8 text-micro uppercase tracking-[0.22em] text-ivory-400">
            7 jours offerts sur tous les plans · sans carte bancaire pour commencer
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="relative py-16 md:py-24 px-6 bg-night-950">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              FAQ
            </p>
            <h2 className="font-cinzel text-display md:text-[56px] text-ivory-50 leading-tight">
              Tu te demandes peut-être…
            </h2>
          </div>
          <FAQ
            items={[
              {
                q: 'Comment ça marche concrètement ?',
                a: (
                  <>
                    Tu crées ton compte avec ta date, heure et lieu de
                    naissance. On calcule ton thème natal en quelques
                    secondes. Tu choisis WhatsApp ou Instagram, l'heure
                    qui te va, et chaque matin tu reçois une lecture
                    courte du ciel adaptée à ton thème. Tu peux aussi
                    converser avec ton guide astral à toute heure.
                  </>
                ),
              },
              {
                q: 'Faut-il connaître son heure de naissance exacte ?',
                a: (
                  <>
                    Idéalement oui : c'est elle qui détermine ton
                    ascendant et tes maisons astrologiques. Sans heure
                    précise, on calcule un thème "solaire" un peu plus
                    général, mais toujours personnalisé sur ton signe,
                    ta lune et les transits du jour.
                  </>
                ),
              },
              {
                q: 'Pourquoi WhatsApp ou Instagram et pas une app ?',
                a: (
                  <>
                    Parce que tu y es déjà. Pas une appli de plus à
                    ouvrir, pas une notification de plus à ignorer.
                    Les messages WhatsApp ont un taux d'ouverture de
                    95 % en moins d'une heure — c'est là que la
                    guidance prend du sens, dans ton flux quotidien.
                  </>
                ),
              },
              {
                q: 'Est-ce que mes données sont protégées ?',
                a: (
                  <>
                    Oui. Tes infos de naissance et tes échanges sont
                    chiffrés et hébergés en Europe (conforme RGPD).
                    On ne les revend jamais à des tiers, on ne fait
                    pas de pub ciblée. Tu peux supprimer ton compte et
                    toutes tes données en 1 clic depuis ton profil.
                  </>
                ),
              },
              {
                q: 'Et si je veux annuler ?',
                a: (
                  <>
                    Tu vas dans ton profil, tu cliques sur "Annuler
                    l'abonnement", c'est fait. Aucun mail à envoyer,
                    aucune justification à donner. Si tu pars pendant
                    l'essai, tu n'as rien payé.
                  </>
                ),
              },
              {
                q: 'L'astrologie, c'est sérieux ?',
                a: (
                  <>
                    On ne prétend pas prédire ton avenir. Zodiak est un
                    outil d'introspection : il croise des positions
                    planétaires réelles (calculées au degré près) avec
                    ton thème natal pour te proposer une lecture
                    symbolique du jour. À toi d'en faire ce que tu
                    veux — un miroir, un guide, ou juste un moment
                    pour toi.
                  </>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* ─── CHAPITRE 6 : CTA FINAL + FOOTER ────────────────────── */}
      <section className="relative pt-10 md:pt-16 pb-16 md:pb-24 px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="font-cinzel text-display md:text-[72px] text-gradient-aurora leading-tight mb-6 md:mb-8"
        >
          Le ciel sait.
          <br />
          Tu peux savoir aussi.
        </motion.h2>
        <MagneticButton strength={0.4} range={26}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            iconLeft={<Sparkles className="w-4 h-4" />}
          >
            Commencer maintenant
          </Button>
        </MagneticButton>
        <p className="mt-3 text-micro uppercase tracking-[0.22em] text-ivory-400">
          7 jours offerts · sans CB
        </p>

        <footer className="mt-16 md:mt-20 text-micro uppercase tracking-[0.32em] text-ivory-400 flex items-center justify-center gap-2">
          <Logo size="sm" />
          <span>Zodiak · Ton ciel, chaque matin.</span>
        </footer>
      </section>
    </div>
  );
}

interface ChapterProps {
  eyebrow: string;
  title: React.ReactNode;
  body: React.ReactNode;
  align?: 'center' | 'left';
}
function Chapter({ eyebrow, title, body, align = 'center' }: ChapterProps) {
  return (
    <section className="relative py-20 md:py-32 px-6 bg-night-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(142,85,255,0.12),transparent_60%)] pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'relative max-w-3xl mx-auto',
          align === 'center' ? 'text-center' : ''
        )}
      >
        <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
          {eyebrow}
        </p>
        <h2 className="font-cinzel text-display md:text-[64px] text-ivory-50 leading-tight mb-5">
          {title}
        </h2>
        <p className="text-body md:text-body-lg text-ivory-200 leading-relaxed">
          {body}
        </p>
      </motion.div>
    </section>
  );
}

interface RitualCardProps {
  icon: React.ReactNode;
  title: string;
  kicker: string;
  text: string;
  tone: 'aurora' | 'magenta' | 'amber';
}
function RitualCard({ icon, title, kicker, text, tone }: RitualCardProps) {
  const toneMap = {
    aurora: 'from-aurora-500/30 to-aurora-700/20 ring-aurora-400/35',
    magenta: 'from-magenta-500/30 to-aurora-500/20 ring-magenta-400/35',
    amber: 'from-amber-500/30 to-magenta-500/20 ring-amber-300/40',
  };
  const spotlightMap = {
    aurora: 'rgba(142,85,255,0.22)',
    magenta: 'rgba(232,74,147,0.22)',
    amber: 'rgba(245,182,56,0.18)',
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <SpotlightCard
        className="h-full rounded-3xl"
        spotlightColor={spotlightMap[tone]}
      >
        <Card variant="elevated" className="relative overflow-hidden h-full">
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-br ring-1',
              toneMap[tone],
            )}
          />
          <div className="relative p-7 md:p-8 flex flex-col h-full">
            <span className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
              {kicker}
            </span>
            <h3 className="font-cinzel text-h2 text-ivory-50 mb-3">{title}</h3>
            <p className="text-body text-ivory-200 leading-relaxed flex-1">{text}</p>
            <div className="mt-6 w-10 h-10 rounded-2xl bg-night-900/60 ring-1 ring-aurora-400/30 flex items-center justify-center text-aurora-200">
              {icon}
            </div>
          </div>
        </Card>
      </SpotlightCard>
    </motion.article>
  );
}

function FeatureLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        aria-hidden="true"
        className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-aurora-300 to-magenta-400"
      />
      <span>{children}</span>
    </li>
  );
}

interface PriceCardProps {
  eyebrow: string;
  price: string;
  priceSuffix: string;
  perMonth?: string;
  badge?: string;
  hint?: string;
  highlighted?: boolean;
  ctaLabel: string;
  onCta: () => void;
  features: string[];
}
function PriceCard({
  eyebrow,
  price,
  priceSuffix,
  perMonth,
  badge,
  hint,
  highlighted = false,
  ctaLabel,
  onCta,
  features,
}: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <SpotlightCard
        className="h-full rounded-3xl"
        spotlightColor={
          highlighted ? 'rgba(232,74,147,0.22)' : 'rgba(201,166,255,0.18)'
        }
      >
      <Card
        variant={highlighted ? 'elevated' : 'surface'}
        className={cn(
          'relative h-full flex flex-col overflow-hidden',
          highlighted && 'ring-2 ring-aurora-400/60 shadow-glow-aurora',
        )}
      >
        {highlighted && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/15 via-transparent to-magenta-500/12"
          />
        )}
        <div className="relative p-7 md:p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-micro uppercase tracking-[0.22em] text-aurora-300">
              {eyebrow}
            </span>
            {badge && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-aurora-500/20 ring-1 ring-aurora-300/40 text-aurora-100 font-medium">
                {badge}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-cinzel text-display-xl text-ivory-50 leading-none">
              {price}
            </span>
            <span className="text-caption text-ivory-300">{priceSuffix}</span>
          </div>
          {perMonth && (
            <p className="text-caption text-aurora-200 mb-1">{perMonth}</p>
          )}
          {hint && (
            <p className="text-caption text-ivory-300 mb-5">{hint}</p>
          )}

          <ul className="space-y-2.5 text-body text-ivory-200 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-aurora-300 mt-1 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Button
            variant={highlighted ? 'primary' : 'ghost'}
            size="lg"
            fullWidth
            onClick={onCta}
            iconRight={<ArrowRight className="w-4 h-4" />}
            className="mt-auto"
          >
            {ctaLabel}
          </Button>
        </div>
      </Card>
      </SpotlightCard>
    </motion.div>
  );
}

interface TrustBadgeProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}
function TrustBadge({ icon, title, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-3 justify-center md:justify-start text-left">
      <span
        aria-hidden="true"
        className="flex-shrink-0 w-9 h-9 rounded-full bg-aurora-500/15 ring-1 ring-aurora-400/30 flex items-center justify-center text-aurora-200"
      >
        {icon}
      </span>
      <div>
        <p className="text-caption text-ivory-50 font-medium leading-tight">
          {title}
        </p>
        <p className="text-micro text-ivory-300 leading-tight mt-0.5">
          {text}
        </p>
      </div>
    </div>
  );
}
