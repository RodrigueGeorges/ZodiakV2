import { useEffect, type ReactNode } from 'react';
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
  ShieldCheck,
  Lock,
  Zap,
  Ban,
} from 'lucide-react';
import Logo from '../components/Logo';
import StarField from '../components/StarField';
import LiveSky from '../components/LiveSky';
import ZodiacStrip from '../components/ZodiacStrip';
import SectionDivider from '../components/SectionDivider';
import { RevealLine } from '../components/RevealHeading';
import CosmicWheel from '../components/CosmicWheel';
import LiveCounter from '../components/LiveCounter';
import FAQ from '../components/FAQ';
import { Button } from '../components/ui/Button';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';

/**
 * Home v3 — landing "Cosmic Editorial Ritual" (mai 2026).
 *
 * Direction artistique :
 *   - Champ d'étoiles vivant (StarField canvas) sur toute la page
 *   - Typographie Fraunces sculptée XXL, italiques éditoriales
 *   - UN SEUL accent or alchimique (#D4A656) qui ponctue
 *   - Filets décoratifs (eyebrows encadrés) façon manuscrit enluminé
 *   - Spacing radicalement augmenté (py-32 md:py-48)
 *   - Suppression des SpotlightCards, gradients multicolores, glow violents
 *   - Cards éditoriales : juste un fin trait or, du noir profond, du papier crème
 *
 * Structure :
 *  1. Hero asymétrique (titre masqué à gauche / LiveSky lunaire à droite)
 *  2. Trust strip (4 indicateurs en filet)
 *  3. Bandeau zodiac (marquee infini, glyphes)
 *  4. Le ciel ce soir (instantané live phase lunaire)
 *  5. Trois rituels (cards éditoriales unifiées)
 *  6. Carte natale (CosmicWheel + texte asymétrique)
 *  7. Pricing (3 plans, plan central marqué d'un filet or)
 *  8. FAQ
 *  9. CTA final + footer signé
 */
export default function Home() {
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const navigate = useNavigate();

  const { scrollY } = useScroll();
  const heroTitleY = useTransform(scrollY, [0, 600], [0, -40]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  useEffect(() => {
    if (user) {
      navigate('/guidance', { replace: true });
    }
  }, [user, navigate]);

  if ((isLoading && user === null) || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-950">
        <CosmicLoader />
      </div>
    );
  }

  const moonNow = moonPhaseAt(new Date());

  return (
    <div className="relative bg-night-950 text-ivory-50 overflow-x-hidden">
      {/* Champ d'étoiles vivant — couvre toute la page */}
      <StarField
        density={1}
        nebula
        milkyWay
        constellations
        shootingStars
      />

      {/* Header transparent ultra-léger */}
      <header className="absolute z-30 top-0 inset-x-0 px-6 md:px-12 py-6 md:py-7 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          aria-label="Accueil Zodiak"
        >
          <Logo size="sm" />
          <span className="font-serif text-h3 text-ivory-50 tracking-tight group-hover:text-aurora-300 transition-colors">
            Zodiak
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/login"
            className="hidden sm:inline-block text-caption text-ivory-200 hover:text-aurora-300 transition-colors"
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
      <section className="relative min-h-[100svh] flex items-center px-6 md:px-12 pt-32 md:pt-40 pb-20 md:pb-32 overflow-hidden">
        {/* Voile dégradé bas pour fixer la lecture */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-night-950 pointer-events-none z-[1]"
        />

        <motion.div
          style={{ y: heroTitleY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto grid lg:grid-cols-[1.3fr_1fr] items-center gap-14 lg:gap-20"
        >
          {/* Colonne gauche : signature éditoriale */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/55 mb-3 md:mb-4 text-center lg:text-left"
            >
              I
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="eyebrow-ritual flex items-center gap-3 justify-center lg:justify-start mb-7 md:mb-9"
            >
              <span
                aria-hidden="true"
                className="block h-px w-10 bg-aurora-400/50"
              />
              <span>Lecture sur ta carte du ciel</span>
            </motion.p>

            <h1 className="font-serif leading-[0.92] tracking-[-0.025em] text-[clamp(3rem,8vw,7rem)]">
              <RevealLine delay={0.28} className="text-ivory-50">
                Le ciel t&apos;écrit.
              </RevealLine>
              <RevealLine
                delay={0.52}
                className="italic-editorial text-aurora-400 mt-1 md:mt-2"
              >
                À ton rythme.
              </RevealLine>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.0 }}
              className="drop-cap-edit mt-9 md:mt-11 text-body-lg text-ivory-200/90 max-w-xl mx-auto lg:mx-0 leading-[1.7]"
            >
              Chaque matin, une guidance calibrée sur ton thème natal — les
              transits du jour croisés à ton ascendant, ta Lune, tes maisons.
              Reçue sur{' '}
              <span className="inline-flex items-center gap-1.5 text-ivory-50 font-medium">
                <MessageSquare className="w-4 h-4 text-aurora-400" />
                WhatsApp
              </span>{' '}
              ou{' '}
              <span className="inline-flex items-center gap-1.5 text-ivory-50 font-medium">
                <Instagram className="w-4 h-4 text-aurora-400" />
                Instagram
              </span>
              , à l&apos;heure qui te convient. Précise, personnelle, jamais
              générique.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.2 }}
              className="mt-10 md:mt-12 flex flex-col items-center lg:items-start gap-5"
            >
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/register')}
                  iconLeft={<Sparkles className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Découvrir ma carte
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  J'ai déjà un compte
                </Button>
              </div>
              <p className="eyebrow-ritual text-ivory-400/80">
                7 jours offerts · sans carte · annulable en 1 clic
              </p>
            </motion.div>
          </div>

          {/* Colonne droite : Lune & légende live (remplace le mockup téléphone) */}
          <div className="order-1 lg:order-2 flex justify-center items-center">
            <LiveSky className="max-w-[min(100%,380px)] lg:max-w-[440px]" />
          </div>
        </motion.div>

        <SectionDivider className="relative z-10 max-w-3xl mx-auto opacity-90" />

        {/* Indicateur scroll discret */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.6, 0.2, 0.6] }}
          transition={{ duration: 4, delay: 2, repeat: Infinity }}
          className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 z-10"
          aria-hidden="true"
        >
          <span className="eyebrow-ritual text-ivory-400/70">Continuer</span>
          <div className="w-px h-12 bg-gradient-to-b from-aurora-400/50 to-transparent" />
        </motion.div>
      </section>

      {/* ─── TRUST STRIP ────────────────────────────────────────── */}
      <section className="relative border-y border-ivory-50/[0.06] py-8 md:py-10 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
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

      <SectionDivider className="max-w-3xl mx-auto opacity-70" />

      {/* ─── BANDEAU ZODIAC ─────────────────────────────────────── */}
      <section className="relative py-16 md:py-20 px-0 border-b border-ivory-50/[0.06]">
        <p className="eyebrow-ritual text-center mb-8">Pour les douze signes</p>
        <ZodiacStrip variant="marquee" duration={68} />
      </section>

      {/* Illustration cosmique (domaine public) — frise très discrète */}
      <section
        aria-label="Illustration cosmique"
        className="relative border-b border-ivory-50/[0.06] overflow-hidden"
      >
        <div className="relative h-32 md:h-44 w-full">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Andromeda_Galaxy_%28with_h-alpha%29.jpg/1280px-Andromeda_Galaxy_%28with_h-alpha%29.jpg"
            alt="Galaxie d’Andromède (image grand public, domaine public)"
            width={1200}
            height={400}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.2] mix-blend-screen"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-night-950 via-night-950/75 to-night-950"
          />
        </div>
      </section>

      {/* ─── CHAPITRE 2 : LE CIEL CE SOIR ───────────────────────── */}
      <Chapter
        roman="II"
        eyebrow="Le ciel · en direct"
        title={
          <>
            <span className="inline-block mr-3 align-middle text-[0.85em] text-aurora-300">
              {moonNow.glyph}
            </span>
            <span className="italic-editorial text-aurora-400">{moonNow.label}</span>
            .
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
            , la Lune est à <span className="text-aurora-300 font-medium">
              {Math.round(moonNow.illumination * 100)} %
            </span>{' '}
            de luminosité. Chaque guidance que tu lis part de ce ciel —
            croisé au degré près avec ton thème natal. Précis, vivant,
            <em className="italic-editorial text-ivory-50"> jamais générique.</em>
          </>
        }
      />

      {/* ─── CHAPITRE 3 : TROIS RITUELS ─────────────────────────── */}
      <section className="relative py-24 md:py-40 px-6 border-t border-ivory-50/[0.06]">
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-3">
              III
            </p>
            <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-6">
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              <span>Trois rituels</span>
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.95]">
              Tout ce dont tu as besoin <br className="hidden md:inline" />
              pour <span className="italic-editorial text-aurora-400">te lire.</span>
            </h2>
            <p className="mt-7 text-body-lg text-ivory-300/80 max-w-2xl mx-auto leading-[1.7]">
              Pas trois apps, pas trois abonnements. Une seule expérience qui
              t'accompagne du matin au soir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-ivory-50/[0.06]">
            <RitualCard
              icon={<Sun className="w-5 h-5" />}
              title="Guidance du jour"
              kicker="Chaque matin · 1 message"
              text="Une lecture courte du ciel, calibrée sur ton thème natal. Livrée sur WhatsApp ou Instagram à l'heure que tu choisis."
            />
            <RitualCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="Guide astral IA"
              kicker="À toute heure · sans limite"
              text="Pose tes questions, reçois des réponses adaptées à ton thème. La voix se souvient de toi — plus tu échanges, mieux elle te lit."
            />
            <RitualCard
              icon={<Heart className="w-5 h-5" />}
              title="Liens & synastrie"
              kicker="En quelques secondes"
              text="Compare ton ciel à celui d'un proche. Compatibilité, tensions, points forts — illustré, expliqué, partageable."
            />
          </div>
        </div>
      </section>

      {/* ─── CHAPITRE 4 : ŒUVRE QUI TE RESSEMBLE ────────────────── */}
      <section className="relative py-24 md:py-40 px-6 border-t border-ivory-50/[0.06] overflow-hidden">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-14 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.9 }}
            className="order-2 md:order-1"
          >
            <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-3 md:mb-4">
              IV
            </p>
            <p className="eyebrow-ritual flex items-center gap-3 mb-5">
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              <span>Ton thème natal · vivant</span>
            </p>
            <h2 className="font-serif text-display text-ivory-50 mb-7 leading-[0.95]">
              Ta carte du ciel,
              <br />
              <span className="italic-editorial text-aurora-400">en mouvement.</span>
            </h2>
            <p className="drop-cap-edit text-body-lg text-ivory-200/90 leading-[1.7] mb-8">
              On calcule ton thème natal au degré près à partir de ta date,
              ton heure et ton lieu de naissance. Tu vois tes douze signes,
              tes maisons, tes sept planètes — et les aspects qu'elles forment
              entre elles. Vivant, animé, partageable.
            </p>
            <ul className="space-y-3 mb-10 text-body text-ivory-200">
              <FeatureLi>Calcul précis (Swiss Ephemeris-grade)</FeatureLi>
              <FeatureLi>Ascendant, planètes, maisons, aspects</FeatureLi>
              <FeatureLi>Œuvre générative à imprimer ou partager</FeatureLi>
            </ul>
            <Button
              variant="primary"
              onClick={() => navigate('/register')}
              iconLeft={<Compass className="w-4 h-4" />}
            >
              Voir ma carte
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-1 md:order-2 max-w-md mx-auto w-full"
          >
            <CosmicWheel className="w-full" />
          </motion.div>
        </div>
      </section>

      {/* ─── CHAPITRE 5 : PRICING ───────────────────────────────── */}
      <section
        id="pricing"
        className="relative py-24 md:py-40 px-6 border-t border-ivory-50/[0.06]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-4">
              V
            </p>
            <div className="mb-7 flex justify-center">
              <LiveCounter />
            </div>
            <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-6">
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              <span>Tarif transparent</span>
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.95]">
              Choisis ce qui te <span className="italic-editorial text-aurora-400">ressemble.</span>
            </h2>
            <p className="mt-7 text-body-lg text-ivory-300/80 max-w-xl mx-auto leading-[1.7]">
              Pas de pub, pas de revente de données, pas de paliers cachés.
              Tu paies une fois, tu profites de tout.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-ivory-50/[0.06] items-stretch">
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

          <p className="text-center mt-12 eyebrow-ritual text-ivory-400/80">
            7 jours offerts sur tous les plans · sans carte bancaire
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 px-6 border-t border-ivory-50/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-3">
              VI
            </p>
            <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-6">
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
              <span>FAQ</span>
              <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.95]">
              Tu te demandes <span className="italic-editorial text-aurora-400">peut-être…</span>
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
                    ouvrir, pas une notification de plus à ignorer. Les
                    messages WhatsApp ont un taux d'ouverture de 95 %
                    en moins d'une heure — c'est là que la guidance
                    prend du sens, dans ton flux quotidien.
                  </>
                ),
              },
              {
                q: 'Est-ce que mes données sont protégées ?',
                a: (
                  <>
                    Oui. Tes infos de naissance et tes échanges sont
                    chiffrés et hébergés en Europe (conforme RGPD). On
                    ne les revend jamais à des tiers, on ne fait pas de
                    pub ciblée. Tu peux supprimer ton compte et toutes
                    tes données en 1 clic depuis ton profil.
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
                q: "L'astrologie, c'est sérieux ?",
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

      {/* ─── CHAPITRE 6 : CTA FINAL ─────────────────────────────── */}
      <section className="relative py-24 md:py-40 px-6 text-center border-t border-ivory-50/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-3">
            VII
          </p>
          <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-7">
            <span aria-hidden="true" className="block h-px w-12 bg-aurora-400/50" />
            <span>Le ciel t'écoute</span>
            <span aria-hidden="true" className="block h-px w-12 bg-aurora-400/50" />
          </p>
          <h2 className="font-serif text-display-xl text-ivory-50 leading-[0.92] mb-10 md:mb-12">
            Le ciel sait.
            <br />
            <span className="italic-editorial text-aurora-400">
              Tu peux savoir aussi.
            </span>
          </h2>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            iconLeft={<Sparkles className="w-4 h-4" />}
          >
            Commencer maintenant
          </Button>
          <p className="mt-5 eyebrow-ritual text-ivory-400/80">
            7 jours offerts · sans CB
          </p>
        </motion.div>

        <footer className="mt-24 md:mt-32 eyebrow-ritual text-ivory-400/60 flex items-center justify-center gap-3">
          <Logo size="sm" />
          <span>Zodiak · Ton ciel, chaque matin.</span>
        </footer>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Sous-composants éditoriaux                                          */
/* ──────────────────────────────────────────────────────────────────── */

interface ChapterProps {
  roman: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
}
function Chapter({ roman, eyebrow, title, body }: ChapterProps) {
  return (
    <section className="relative py-24 md:py-40 px-6 border-t border-ivory-50/[0.06]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-3xl mx-auto text-center"
      >
        <p className="font-cinzel text-[10px] md:text-[11px] tracking-[0.52em] text-aurora-400/45 mb-3 md:mb-4">
          {roman}
        </p>
        <p className="eyebrow-ritual flex items-center justify-center gap-3 mb-6">
          <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
          <span>{eyebrow}</span>
          <span aria-hidden="true" className="block h-px w-8 bg-aurora-400/50" />
        </p>
        <h2 className="font-serif text-display text-ivory-50 leading-[0.95] mb-8">
          {title}
        </h2>
        <p className="drop-cap-edit text-body-lg text-ivory-200/90 leading-[1.7]">{body}</p>
      </motion.div>
    </section>
  );
}

interface RitualCardProps {
  icon: ReactNode;
  title: string;
  kicker: string;
  text: string;
}
function RitualCard({ icon, title, kicker, text }: RitualCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8 }}
      className="relative bg-night-950 hover:bg-night-900/60 transition-colors duration-500 group p-8 md:p-12 flex flex-col shadow-[inset_0_1px_0_rgba(244,236,219,0.04)]"
    >
      <span className="eyebrow-ritual text-ivory-400/70 mb-3">{kicker}</span>
      <h3 className="font-serif text-h1 text-ivory-50 mb-5 leading-tight">
        {title}
      </h3>
      <p className="text-body text-ivory-200/85 leading-[1.7] flex-1">{text}</p>
      <div className="mt-10 flex items-center gap-3 text-aurora-400">
        <span className="block h-px w-10 bg-aurora-400/60 group-hover:w-16 transition-all duration-500" />
        <span className="opacity-80 group-hover:opacity-100 transition-opacity">
          {icon}
        </span>
      </div>
    </motion.article>
  );
}

function FeatureLi({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex-shrink-0 mt-2.5 block h-px w-4 bg-aurora-400/60"
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8 }}
      className={cn(
        'relative h-full flex flex-col bg-night-950 hover:bg-night-900/60 transition-colors duration-500 p-8 md:p-10',
        highlighted && 'bg-night-900/40',
      )}
    >
      {highlighted && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px bg-aurora-400"
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <span className="eyebrow-ritual text-aurora-400">{eyebrow}</span>
        {badge && (
          <span className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border border-aurora-400/40 text-aurora-300">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-serif text-[clamp(3rem,5vw,4rem)] text-ivory-50 leading-none">
          {price}
        </span>
        <span className="text-caption text-ivory-300/80">{priceSuffix}</span>
      </div>
      {perMonth && (
        <p className="text-caption text-aurora-300 mb-1">{perMonth}</p>
      )}
      {hint && (
        <p className="text-caption text-ivory-300/70 italic-editorial mb-7">
          {hint}
        </p>
      )}

      <ul className="space-y-3 text-body text-ivory-200/90 mb-10">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex-shrink-0 mt-2.5 block h-px w-4 bg-aurora-400/60"
            />
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
    </motion.div>
  );
}

interface TrustBadgeProps {
  icon: ReactNode;
  title: string;
  text: string;
}
function TrustBadge({ icon, title, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-4 justify-center md:justify-start text-left">
      <span
        aria-hidden="true"
        className="flex-shrink-0 w-10 h-10 rounded-full border border-aurora-400/30 flex items-center justify-center text-aurora-400"
      >
        {icon}
      </span>
      <div>
        <p className="text-caption text-ivory-50 font-medium leading-tight">
          {title}
        </p>
        <p className="text-micro text-ivory-300/70 leading-tight mt-1">
          {text}
        </p>
      </div>
    </div>
  );
}
