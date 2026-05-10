import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  Check,
  MessageCircle,
  Sparkles,
  Sun,
} from 'lucide-react';
import Logo from '../components/Logo';
import LiveCounter from '../components/LiveCounter';
import FAQ from '../components/FAQ';
import { ButtonLink } from '../components/ui/ButtonLink';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { moonPhaseAt } from '../lib/moonPhase';
import MoonPhaseVisual from '../components/MoonPhaseVisual';
import { cn } from '../lib/utils';

const heroReveal = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Home — landing Zodiak.
 *
 * Fond : ciel + constellations globaux (`App`). Coque transparente ; cartes en verre sombre.
 */
export default function Home() {
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [headerSolid, setHeaderSolid] = useState(false);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const haloY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 88],
  );
  const haloY2 = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 36],
  );
  const haloOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  useEffect(() => {
    if (user) {
      navigate('/guidance', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if ((isLoading && user === null) || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <CosmicLoader />
      </div>
    );
  }

  const moonNow = moonPhaseAt(new Date());

  return (
    <div className="relative bg-transparent text-ivory-50 overflow-x-hidden min-h-screen">
      <div className="relative z-[1] isolate">
      {/* Header — fixe, intensité selon le scroll */}
      <header
        className={cn(
          'fixed z-30 top-0 inset-x-0 px-6 md:px-10 lg:px-14 py-4 md:py-5 flex items-center justify-between border-b transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-brutal safe-top',
          headerSolid
            ? 'border-white/[0.14] bg-black/60 backdrop-blur-xl shadow-[0_1px_0_rgba(56,189,248,0.07)]'
            : 'border-white/[0.1] bg-black/15 backdrop-blur-lg',
        )}
      >
        <Link
          to="/"
          className="flex items-center gap-3 group"
          aria-label="Accueil Zodiak"
        >
          <Logo size="sm" composeOnLoad />
          <span className="font-display text-h3 text-ivory-50 tracking-[-0.02em] font-medium group-hover:text-aurora-400 transition-colors duration-300 ease-brutal">
            Zodiak
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/login"
            className="hidden sm:inline-block text-caption text-ivory-400 hover:text-ivory-50 transition-colors duration-300 ease-brutal underline-offset-4 hover:underline decoration-aurora-400/40"
          >
            Se connecter
          </Link>
          <ButtonLink to="/register" variant="primary" size="sm" className="shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)]">
            Essayer gratuitement
          </ButtonLink>
        </div>
      </header>

      {/* Hero — immersion : halos parallax, anneaux, display Fraunces */}
      <section
        ref={heroRef}
        className="relative min-h-[100svh] flex flex-col justify-center items-center px-6 md:px-10 pt-32 pb-24 md:pt-36 md:pb-32 overflow-hidden"
        aria-labelledby="hero-title"
      >
        <motion.div
          style={{ y: haloY, opacity: haloOpacity }}
          className="hero-parallax-layer pointer-events-none absolute inset-0 hero-aurora-bloom"
          aria-hidden
        />
        <motion.div
          style={{ y: haloY2 }}
          className="hero-parallax-layer pointer-events-none absolute inset-x-0 bottom-0 h-[45%] hero-aurora-bloom-warm"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 top-[8%] h-[50vh] max-h-[620px] bg-gradient-to-b from-aurora-500/[0.08] via-aurora-600/[0.02] to-transparent pointer-events-none"
          aria-hidden
        />

        <div className="hero-orbit" aria-hidden>
          <span className="hero-orbit-ring" />
          <span className="hero-orbit-ring" />
          <span className="hero-orbit-ring" />
        </div>

        <motion.div
          variants={heroReveal}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center text-center max-w-[40rem] mx-auto"
        >
          <motion.div variants={heroItem} className="relative mb-9 md:mb-11 flex justify-center">
            <span
              aria-hidden
              className="absolute inset-0 -m-6 rounded-full bg-aurora-400/[0.07] blur-3xl scale-110"
            />
            <Logo size="lg" composeOnLoad />
          </motion.div>

          <motion.div variants={heroItem} className="space-y-2 md:space-y-3">
            <p className="eyebrow-ritual text-ivory-500/90 text-[0.65rem] md:text-micro">
              Guidance astrale · thème natal
            </p>
            <h1
              id="hero-title"
              className="font-hero-display font-light text-[clamp(3.25rem,10.5vw,5.25rem)] leading-[0.94] text-ivory-50"
            >
              <span className="text-gradient-gold">Zodiak</span>
            </h1>
          </motion.div>

          <motion.p
            variants={heroItem}
            className="mt-8 md:mt-10 text-[clamp(1.06rem,2.5vw,1.38rem)] leading-[1.55] font-light text-ivory-200/95 max-w-[26rem] md:max-w-[34rem] mx-auto"
          >
            Une lecture{' '}
            <span className="text-ivory-50 font-normal">personnelle du ciel</span>, chaque matin — calibrée sur ta naissance, sans nouvelle appli à installer.
          </motion.p>

          <motion.p
            variants={heroItem}
            className="mt-6 font-mono text-[0.7rem] sm:text-caption uppercase tracking-[0.14em] text-aurora-300/90"
          >
            7 jours offerts · sans carte bancaire
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-11 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
          >
            <ButtonLink
              to="/register"
              variant="primary"
              size="lg"
              iconLeft={<Sparkles className="w-4 h-4" />}
              className="w-full sm:w-auto min-w-[220px] landing-primary-cta-glow transition-shadow duration-300"
            >
              Commencer
            </ButtonLink>
            <ButtonLink
              to="/login"
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto min-w-[220px]"
            >
              Se connecter
            </ButtonLink>
          </motion.div>
        </motion.div>
      </section>

      {/* Réassurance */}
      <section className="relative z-10 border-t border-white/[0.09] py-14 md:py-16 px-6 reassurance-band">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
          <span
            aria-hidden
            className="h-px w-16 bg-gradient-to-r from-transparent via-aurora-400/35 to-transparent"
          />
          <p className="text-center text-body-lg text-ivory-300/95 leading-[1.75] font-light">
            Construit sur{' '}
            <span className="text-ivory-100 font-medium">ton thème de naissance</span>
            , pas sur un texte générique. Données hébergées en{' '}
            <span className="text-aurora-200/90">Europe</span>.
          </p>
        </div>
      </section>

      {/* Ciel du jour — composition dans un seul bloc */}
      <Chapter
        eyebrow="Ce qui domine aujourd'hui"
        title={
          <div className="harmony-lunar">
            <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-7 md:gap-5 lg:gap-8">
              <div className="flex justify-center md:shrink-0">
                <MoonPhaseVisual
                  phase={moonNow}
                  size="lg"
                  variant="aurora"
                  instrumentRing
                  className="drop-shadow-[0_0_40px_rgba(56,189,248,0.2)]"
                />
              </div>
              <div
                className="hidden md:block harmony-vdivider mx-1 lg:mx-2"
                aria-hidden
              />
              <div className="min-w-0 space-y-2.5 text-center md:text-left">
                <span className="block font-mono text-[10px] uppercase tracking-[0.26em] text-ivory-500">
                  Phase observée
                </span>
                <span className="block font-display font-light text-[clamp(1.7rem,4.2vw,2.75rem)] leading-[1.06] tracking-[-0.022em] text-ivory-50">
                  <span className="italic-editorial text-aurora-300">{moonNow.label}</span>
                  <span className="text-ivory-500/65">.</span>
                </span>
              </div>
            </div>
          </div>
        }
        body={
          <span className="not-italic">
            Chaque message part de <strong className="font-medium text-ivory-200">ton thème</strong> et du ciel du jour — pas d’un même texte pour tout le monde.
          </span>
        }
      />

      {/* ─── Ce que tu utilises au quotidien — 2 blocs ───────────── */}
      <section className="relative py-28 md:py-44 px-5 md:px-8 border-t border-white/[0.09]">
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16 md:mb-20 max-w-2xl mx-auto space-y-6">
            <p className="protocol-caption text-ivory-400">L’expérience</p>
            <h2 className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]">
              Deux usages,{' '}
              <span className="italic-editorial font-light text-aurora-400">un même ciel.</span>
            </h2>
            <p className="text-body-lg text-ivory-400/90 leading-[1.75]">
              Tout repose sur <span className="text-ivory-200 font-medium">ton thème de naissance</span>{' '}
              (calculé une fois au compte). Ensuite tu reçois la guidance là où tu discutes déjà —
              plus un chat pensé pour toi quand tu as besoin d’éclairage.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <RitualCard
              spotlight
              index={1}
              icon={<Sun className="w-6 h-6 lg:w-7 lg:h-7 text-aurora-200" />}
              title="Guidance du jour"
              kicker="Rituel du matin"
              text="Chaque jour, une lecture courte : transits du moment croisés avec ton ascendant,
              ta lune et les maisons qui comptent pour toi. Pas de copier-coller générique : le ton
              et les angles suivent ta carte."
              bullets={[
                'Envoi sur WhatsApp ou Instagram, à l’heure que tu choisis',
                'Un seul message clair pour cadrer la journée (énergie, vigilance, opportunités)',
                'Réglages dans ton espace après inscription — rien à installer',
              ]}
            />
            <RitualCard
              spotlight
              index={2}
              icon={<MessageCircle className="w-6 h-6 lg:w-7 lg:h-7 text-aurora-200" />}
              title="Chat avec ton guide astral"
              kicker="Quand tu veux, à ton rythme"
              text="Pose une question précise (« travail », « relation », timing »…) ou déroule une
              réflexion. Le guide s’appuie sur ton thème pour rester dans le même langage symbolique que
              la guidance quotidienne — avec une continuité de conversation."
              bullets={[
                'Réponses contextualisées (pas un horoscope passe-partout)',
                'Mémoire de tes échanges : plus tu précises ta vie, mieux ça cadre avec ton ciel',
                'Idéal entre deux guidances ou quand tu as besoin d’un éclairage ciblé',
              ]}
            />
          </div>

          <div className="mt-12 md:mt-16 flex justify-center">
            <ButtonLink
              to="/register"
              variant="primary"
              size="lg"
              iconLeft={<Sparkles className="w-4 h-4" />}
              iconRight={<ArrowRight className="w-4 h-4" />}
              className="landing-primary-cta-glow shadow-none"
            >
              Essayer 7 jours offerts
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ─── OFFRE ────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative py-24 md:py-40 px-6 border-t border-white/[0.09]"
      >
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12 md:mb-14">
            <p className="protocol-caption text-ivory-400 mb-8 md:mb-10">
              Offre simple
            </p>
            <div className="mb-10 flex justify-center">
              <LiveCounter />
            </div>
            <h2 className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]">
              Une formule pour{' '}
              <span className="italic-editorial font-light text-aurora-400">tout suivre.</span>
            </h2>
            <p className="mt-7 text-body-lg text-ivory-400/90 max-w-xl mx-auto leading-[1.7]">
              Pas de grille de prix à décrypter : <span className="text-ivory-200 font-medium">8,99 € par mois</span>, tout compris —
              guidance du jour et chat illimités, calibrés sur ton thème. Pas de publicité ni de revente de données.
            </p>
          </div>

          <PriceOfferCard />

          <p className="text-center mt-10 eyebrow-ritual text-ivory-400/80 leading-relaxed">
            7 premiers jours offerts pour tester · sans carte bancaire au départ · résiliation depuis ton espace personnel
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 px-6 border-t border-white/[0.09]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="protocol-caption text-ivory-400 mb-8">
              Questions
            </p>
            <h2 className="font-sans font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]">
              Tu te demandes <span className="italic-editorial text-aurora-400">peut-être…</span>
            </h2>
          </div>
          <FAQ
            items={[
              {
                q: 'Comment ça marche concrètement ?',
                a: (
                  <>
                    Tu crées ton compte avec ta date, ton heure et ton lieu de naissance : on en déduit ton
                    thème natal une fois pour toutes. Chaque matin, tu reçois la{' '}
                    <strong className="font-medium text-ivory-200">guidance du jour</strong> — une lecture courte,
                    envoyée là où tu discutes déjà (WhatsApp ou Instagram). À côté, tu ouvres le{' '}
                    <strong className="font-medium text-ivory-200">chat</strong> avec ton guide astral quand tu as
                    besoin d’un éclairage : questions ciblées, réponses qui restent dans le langage symbolique de ton
                    ciel — avec mémoire de ce que vous vous dites au fil du temps.
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
      <section className="relative py-24 md:py-40 px-6 text-center border-t border-white/[0.09]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="protocol-caption text-ivory-400 mb-10">
            Prochain pas
          </p>
          <h2 className="font-display font-extralight text-display-xl text-ivory-50 leading-[1.02] mb-10 md:mb-12 tracking-[-0.03em]">
            Le ciel travaille en silence.
            <br />
            <span className="italic-editorial font-light text-aurora-400">
              Toi aussi, tu peux t’y mettre.
            </span>
          </h2>
          <ButtonLink
            to="/register"
            variant="primary"
            size="lg"
            iconLeft={<Sparkles className="w-4 h-4" />}
            className="landing-primary-cta-glow transition-shadow duration-300"
          >
            Démarrer gratuitement
          </ButtonLink>
          <p className="mt-5 eyebrow-ritual text-ivory-400/80">
            7 jours offerts · sans CB
          </p>
        </motion.div>

        <footer className="mt-24 md:mt-32 text-center font-mono text-[11px] tracking-[0.12em] text-ivory-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <Logo size="sm" />
          <span className="text-ivory-400/80 normal-case tracking-normal font-sans text-micro">
            Zodiak · Le ciel t&apos;écrit.
          </span>
        </footer>
      </section>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Sous-composants éditoriaux                                          */
/* ──────────────────────────────────────────────────────────────────── */

interface ChapterProps {
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
}
function Chapter({ eyebrow, title, body }: ChapterProps) {
  return (
    <section className="relative z-[1] py-24 md:py-36 px-5 sm:px-6 border-t border-white/[0.09] overflow-hidden">
      <div className="chapter-halo" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-3xl mx-auto text-center space-y-8 md:space-y-10"
      >
        <p className="protocol-caption text-ivory-400 max-w-xl mx-auto">{eyebrow}</p>
        <h2 className="font-normal text-ivory-50 leading-none mb-0 tracking-[-0.03em]">
          {title}
        </h2>
        <p className="text-body-lg text-ivory-400/90 leading-[1.7] max-w-xl mx-auto font-light">
          {body}
        </p>
      </motion.div>
    </section>
  );
}

interface RitualCardProps {
  icon: ReactNode;
  title: string;
  kicker: string;
  text: string;
  /** Carte principale du bento (plus grande, halo). @deprecated préférer spotlight */
  featured?: boolean;
  /** Déux cartes mises au même niveau visuel avec halo aurora */
  spotlight?: boolean;
  /** Puces lisibles sous le paragraphe */
  bullets?: string[];
  /** Numéro décoratif (01, 02…). */
  index?: number;
  className?: string;
}
function RitualCard({
  icon,
  title,
  kicker,
  text,
  featured = false,
  spotlight = false,
  bullets,
  index,
  className,
}: RitualCardProps) {
  const accent = spotlight || featured;
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: accent ? -2 : -1 }}
      className={cn(
        'relative backdrop-blur-md border group flex flex-col overflow-hidden',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,background-color,transform] duration-300 ease-brutal',
        accent
          ? 'border-aurora-400/35 bg-gradient-to-br from-aurora-500/[0.08] via-white/[0.04] to-white/[0.02] hover:border-aurora-400/48 shadow-[inset_0_1px_0_rgba(56,189,248,0.12),0_40px_100px_-56px_rgba(0,0,0,0.75)] p-8 md:p-11 lg:p-12 lg:min-h-[min(58vh,480px)]'
          : 'border-white/12 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/22 p-8 md:p-10',
        className,
      )}
    >
      {index != null && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none select-none absolute font-display font-extralight leading-none text-white/[0.05]',
            accent
              ? 'top-5 right-5 md:top-7 md:right-8 text-[clamp(3rem,12vw,6.5rem)]'
              : 'top-4 right-5 text-[clamp(2.25rem,6vw,3.25rem)] opacity-90',
          )}
        >
          {String(index).padStart(2, '0')}
        </span>
      )}

      <div
        className={cn(
          'mb-6 inline-flex items-center justify-center rounded-full border text-aurora-200 transition-colors duration-300',
          accent
            ? 'h-14 w-14 border-aurora-400/40 bg-aurora-500/[0.12] shadow-[0_0_44px_-14px_rgba(56,189,248,0.55)]'
            : 'h-11 w-11 border-white/15 bg-white/[0.04]',
        )}
      >
        {icon}
      </div>

      <span className="protocol-caption text-aurora-200/85 mb-3 normal-case tracking-[0.14em] relative z-[1]">
        {kicker}
      </span>
      <h3
        className={cn(
          'font-display font-light text-ivory-50 mb-5 leading-[1.08] tracking-[-0.02em] relative z-[1]',
          accent ? 'text-[clamp(1.65rem,3.8vw,2.35rem)]' : 'text-h1',
        )}
      >
        {title}
      </h3>
      <p className="text-body text-ivory-300/95 leading-[1.75] flex-1 relative z-[1]">
        {text}
      </p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-8 space-y-3 text-caption text-ivory-400/95 relative z-[1] leading-relaxed">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-left">
              <Check className="w-4 h-4 text-aurora-400 shrink-0 mt-0.5 opacity-95" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {!bullets?.length && (
        <div className="mt-10 lg:mt-12 flex items-center gap-3 text-aurora-400 relative z-[1]">
          <span className="block h-px w-10 bg-aurora-400/55 group-hover:w-16 transition-all duration-500 ease-brutal" />
          <span className="text-micro font-mono uppercase tracking-[0.2em] text-ivory-500 group-hover:text-aurora-300/90 transition-colors">
            Détail
          </span>
        </div>
      )}
    </motion.article>
  );
}

function PriceOfferCard() {
  const includes = [
    'Guidance du jour sur le canal que tu choisis (WhatsApp ou Instagram), horaire au choix',
    'Chat avec ton guide astral, autant que tu veux, avec mémoire de la conversation',
    'Profil basé sur ton thème natal — tout le contenu tourne autour de ta carte',
    'Pas de carte bancaire pour commencer : tu actives ton essai puis tu décides à froid',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-xl overflow-hidden backdrop-blur-md',
        'border border-aurora-400/40 bg-gradient-to-b from-aurora-500/[0.12] via-white/[0.045] to-white/[0.02]',
        'shadow-[inset_0_1px_0_rgba(56,189,248,0.18),0_32px_80px_-44px_rgba(0,0,0,0.9)]',
        'p-8 md:p-10 lg:p-12',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
      />

      <div className="text-center pb-8 border-b border-white/[0.1] mb-8">
        <span className="inline-flex items-center rounded-full border border-aurora-400/35 bg-aurora-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-aurora-100">
          Formule unique
        </span>
        <div className="mt-8 flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
          <span className="font-display font-extralight text-[clamp(3.25rem,8vw,4.25rem)] text-ivory-50 leading-none tracking-[-0.03em]">
            8,99&nbsp;€
          </span>
          <span className="pb-1 text-body text-aurora-200/90 font-medium">
            par mois
          </span>
        </div>
        <p className="mt-5 text-body text-ivory-400/95 leading-relaxed max-w-md mx-auto">
          Après <span className="text-ivory-200 font-medium">7 jours gratuits sans engagement</span>, ce tarif mensuel ouvre tout l’outil : même expérience que dans l’article ci-dessus, sans surprises sur la facture.
        </p>
      </div>

      <p className="text-micro uppercase tracking-[0.2em] text-aurora-200/85 mb-4">
        Ce que tu débloques
      </p>
      <ul className="space-y-3.5 text-body text-ivory-200/95 mb-10 md:mb-11">
        {includes.map((line) => (
          <li key={line} className="flex gap-3 leading-snug">
            <Check className="w-[18px] h-[18px] text-aurora-400 shrink-0 mt-0.5" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <ButtonLink
        to="/register"
        variant="primary"
        size="lg"
        fullWidth
        iconLeft={<Sparkles className="w-4 h-4" />}
        iconRight={<ArrowRight className="w-4 h-4" />}
        className="landing-primary-cta-glow shadow-none text-night-950"
      >
        Commencer gratuitement pendant 7 jours
      </ButtonLink>

      <p className="text-center mt-4 text-caption text-ivory-500/95">
        Puis facturation à <span className="text-aurora-200/95 font-medium">8,99&nbsp;€</span>{' '}
        / mois si tu poursuis — résilie gratuitement depuis ton espace avant la fin des 7 jours pour éviter tout
        prélèvement.
      </p>
    </motion.div>
  );
}
