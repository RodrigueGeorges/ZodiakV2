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
import FAQ from '../components/FAQ';
import HeroSocialOrbit from '../components/HeroSocialOrbit';
import SocialDeliveryShowcase from '../components/SocialDeliveryShowcase';
import { ButtonLink } from '../components/ui/ButtonLink';
import { APP_NAME } from '../lib/constants';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { cn } from '../lib/utils';
import {
  DEFAULT_DOC_TITLE as DOC_TITLE,
  DEFAULT_META_DESCRIPTION as META_DESCRIPTION,
} from '../lib/documentSeo';

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Qu'est-ce qu'un thème natal ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Le thème natal est une carte du ciel calculée à partir de ta date, ton heure et ton lieu de naissance. Il révèle la position exacte de toutes les planètes au moment où tu es né(e), et constitue ta signature astrologique unique.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment fonctionne la guidance personnalisée Zodiak Astro ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Chaque matin, Zodiak Astro croise les transits du jour avec ton thème natal pour générer une guidance écrite spécifiquement pour toi. Aucun texte recyclé, aucun horoscope générique.',
      },
    },
    {
      '@type': 'Question',
      name: "Pourquoi les réseaux sociaux plutôt qu'une appli ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          "Parce que tu ouvres déjà tes réseaux sociaux chaque jour. Pas besoin de télécharger une app de plus que tu vas oublier. Ta guidance arrive là où tu es déjà.",
      },
    },
    {
      '@type': 'Question',
      name: "L'heure de naissance exacte est-elle obligatoire ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Idéalement oui — elle permet de calculer ton ascendant et tes maisons astrologiques. Mais on peut commencer sans, et affiner ensuite.',
      },
    },
    {
      '@type': 'Question',
      name: 'Comment annuler mon abonnement ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Depuis ton espace personnel, en 1 clic. Aucune justification demandée, aucune relance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Mes données sont-elles protégées ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Oui. Hébergement en Europe, conforme RGPD, aucune revente à des tiers.',
      },
    },
  ],
};

const PRODUCT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Zodiak Astro',
  description:
    "Guidance astrologique personnalisée basée sur ton thème natal, livrée chaque matin sur tes réseaux sociaux.",
  offers: {
    '@type': 'Offer',
    price: '8.90',
    priceCurrency: 'EUR',
    availability: 'https://schema.org/InStock',
  },
};

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
 * Home — landing Zodiak Astro (SEO : un H1, sections en H2, sous-points en H3).
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

  /** SEO landing : titre, méta-description, FAQ + Product schema.org — uniquement quand la landing s’affiche */
  useEffect(() => {
    const blocked =
      (isLoading && user === null) || shouldRedirect || user != null;
    if (blocked) return undefined;

    const prevTitle = document.title;
    document.title = DOC_TITLE;
    let metaDesc = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const prevDesc = metaDesc?.getAttribute('content') ?? '';
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', META_DESCRIPTION);

    const mountScript = (
      marker: string,
      data: object,
    ): HTMLScriptElement => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-zodiak-landing', marker);
      el.textContent = JSON.stringify(data);
      document.head.appendChild(el);
      return el;
    };

    const sFaq = mountScript('faq', FAQ_JSON_LD);
    const sProd = mountScript('product', PRODUCT_JSON_LD);

    return () => {
      document.title = prevTitle;
      metaDesc?.setAttribute('content', prevDesc);
      sFaq.remove();
      sProd.remove();
    };
  }, [isLoading, user, shouldRedirect]);

  if (shouldRedirect || (isLoading && user === null) || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <CosmicLoader />
      </div>
    );
  }

  return (
    <div className="relative bg-transparent text-ivory-50 overflow-x-hidden min-h-screen">
      <div className="relative z-[1] isolate">
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
            aria-label={`Accueil ${APP_NAME}`}
          >
            <Logo size="sm" composeOnLoad />
            <span className="font-display text-h3 tracking-[-0.02em] font-medium whitespace-nowrap group-hover:opacity-90 transition-opacity duration-300 ease-brutal">
              <span className="text-shimmer-cosmic">Zodiak</span>
              <span className="ml-[0.28em] font-light text-aurora-200/90">Astro</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/login"
              className="hidden sm:inline-block text-caption text-ivory-400 hover:text-ivory-50 transition-colors duration-300 ease-brutal underline-offset-4 hover:underline decoration-aurora-400/40"
            >
              Se connecter
            </Link>
            <ButtonLink
              to="/register"
              variant="cosmic"
              size="sm"
            >
              Essayer 7 jours
            </ButtonLink>
          </div>
        </header>

        {/* Hero — seul H1 de la page */}
        <section
          ref={heroRef}
          className="relative min-h-[100svh] flex flex-col justify-center items-center px-6 md:px-10 pt-32 pb-16 md:pt-36 md:pb-24 overflow-hidden"
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
            className="relative z-10 flex flex-col items-center text-center max-w-[42rem] mx-auto"
          >
            <motion.div variants={heroItem} className="relative mb-8 md:mb-10 flex justify-center">
              <span
                aria-hidden
                className="absolute inset-0 -m-6 rounded-full bg-aurora-400/[0.07] blur-3xl scale-110"
              />
              <Logo size="lg" withWordmark composeOnLoad />
            </motion.div>

            <motion.div
              variants={heroItem}
              className="relative w-full max-w-[40rem] mx-auto min-h-[11.5rem] sm:min-h-[13rem] md:min-h-[14.5rem] flex items-center justify-center px-4 sm:px-6"
            >
              <HeroSocialOrbit className="z-0 -inset-x-10 sm:-inset-x-16 md:-inset-x-20 -inset-y-8 sm:-inset-y-10 md:-inset-y-12" />
              <h1
                id="hero-title"
                className="relative z-[1] font-display font-extralight text-[clamp(2.1rem,6.2vw,3.4rem)] leading-[1.22] tracking-[-0.03em] text-ivory-50 max-w-[38rem] mx-auto text-center"
              >
                Ton horoscope personnalisé en fonction de ton thème natal,
                <br className="hidden sm:block" />
                dans la messagerie de tes réseaux sociaux favoris.
              </h1>
            </motion.div>

            <motion.p
              variants={heroItem}
              className="mt-7 md:mt-9 text-[clamp(1.08rem,2.4vw,1.35rem)] leading-[1.58] font-light text-ivory-300/95 max-w-[34rem] mx-auto"
            >
              Pas un texte générique. Une guidance écrite pour{' '}
              <strong className="font-medium text-ivory-100">toi seul·e</strong>, à partir de ton ciel de naissance —
              livrée directement sur tes réseaux sociaux.
            </motion.p>

            <motion.ul
              variants={heroItem}
              className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-3 text-caption text-ivory-400/95"
              aria-label="Garanties"
            >
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aurora-400 shrink-0" aria-hidden />
                Essai 7 jours avec CB
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aurora-400 shrink-0" aria-hidden />
                Résiliable en 1 clic
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-aurora-400 shrink-0" aria-hidden />
                Données en Europe
              </li>
            </motion.ul>

            <motion.div
              variants={heroItem}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
            >
              <ButtonLink
                to="/register"
                variant="cosmic"
                size="lg"
                iconLeft={<Sparkles className="w-4 h-4" />}
                className="w-full sm:w-auto min-w-[240px] text-base"
              >
                Démarrer mon essai
              </ButtonLink>
              <ButtonLink
                to="/login"
                variant="cosmic"
                size="lg"
                className="w-full sm:w-auto min-w-[240px] text-base"
              >
                Se connecter
              </ButtonLink>
            </motion.div>
            <p className="mt-4 text-center text-caption text-ivory-400/90">
              Carte bancaire requise · aucun débit pendant 7 jours
            </p>
          </motion.div>
        </section>

        {/* Pourquoi Zodiak Astro */}
        <section
          className="relative z-10 border-t border-white/[0.09] py-20 md:py-28 px-6 reassurance-band"
          aria-labelledby="section-pourquoi"
        >
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <span
              aria-hidden
              className="mx-auto block h-px w-16 bg-gradient-to-r from-transparent via-aurora-400/35 to-transparent"
            />
            <h2
              id="section-pourquoi"
              className="font-display font-extralight text-display text-ivory-50 leading-[1.05] tracking-[-0.03em]"
            >
              Pourquoi les horoscopes classiques ne marchent pas.
            </h2>
            <p className="text-body-lg text-ivory-300/95 leading-[1.78] font-light">
              Un horoscope qui parle à <strong className="font-medium text-ivory-100">un douzième</strong> de la
              population, ça ne peut pas vraiment te parler à toi. Zodiak Astro calcule ton{' '}
              <strong className="font-medium text-ivory-100">thème natal complet</strong> — soleil, lune, ascendant,
              planètes, maisons — et croise chaque jour les <strong className="font-medium text-ivory-100">transits du ciel</strong> avec ta carte unique.{' '}
              <span className="text-ivory-50">Résultat&nbsp;: une guidance qui te concerne vraiment.</span>
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section
          className="relative py-24 md:py-36 px-6 border-t border-white/[0.09]"
          aria-labelledby="section-etapes"
        >
          <div className="max-w-4xl mx-auto">
            <h2
              id="section-etapes"
              className="font-display font-extralight text-display text-ivory-50 text-center leading-[1.05] tracking-[-0.03em] mb-14 md:mb-20"
            >
              3 étapes. C&apos;est tout.
            </h2>
            <ol className="space-y-12 md:space-y-16 md:grid md:grid-cols-3 md:gap-10 md:space-y-0 list-none">
              <li className="relative rounded-2xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-md p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span
                  aria-hidden
                  className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-aurora-400/30 bg-aurora-500/10 font-mono text-micro text-aurora-200"
                >
                  01
                </span>
                <h3 className="font-display font-light text-h1 text-ivory-50 mb-4 leading-tight tracking-[-0.02em]">
                  Tu crées ton thème natal.
                </h3>
                <p className="text-body text-ivory-400/95 leading-relaxed">
                  Date, heure et lieu de naissance. Ton thème astral — la base de tout ton{' '}
                  <span className="text-ivory-200 font-medium">horoscope personnalisé</span> — est calculé une fois pour
                  toutes en quelques secondes.
                </p>
              </li>
              <li className="relative rounded-2xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-md p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span
                  aria-hidden
                  className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-aurora-400/30 bg-aurora-500/10 font-mono text-micro text-aurora-200"
                >
                  02
                </span>
                <h3 className="font-display font-light text-h1 text-ivory-50 mb-4 leading-tight tracking-[-0.02em]">
                  Tu reçois ta guidance chaque matin.
                </h3>
                <p className="text-body text-ivory-400/95 leading-relaxed">
                  Sur tes réseaux sociaux, à l&apos;heure que tu choisis. Un message court, clair, qui parle de{' '}
                  <strong className="font-medium text-ivory-200">ta journée</strong>.
                </p>
              </li>
              <li className="relative rounded-2xl border border-white/[0.09] bg-white/[0.03] backdrop-blur-md p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <span
                  aria-hidden
                  className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-aurora-400/30 bg-aurora-500/10 font-mono text-micro text-aurora-200"
                >
                  03
                </span>
                <h3 className="font-display font-light text-h1 text-ivory-50 mb-4 leading-tight tracking-[-0.02em]">
                  Tu chattes quand tu veux.
                </h3>
                <p className="text-body text-ivory-400/95 leading-relaxed">
                  Une question sur le travail, une relation, un timing&nbsp;? Ton guide astral répond — et se souvient
                  de vos échanges. Même fil conducteur que tes messages du matin, ancré dans{' '}
                  <span className="text-ivory-200 font-medium">ton thème natal</span>.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Aperçu vivant d'une guidance */}
        <section
          className="relative py-24 md:py-36 px-6 border-t border-white/[0.09] overflow-hidden"
          aria-labelledby="section-apercu"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-aurora-500/[0.06] to-transparent"
          />
          <div className="relative max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left max-w-xl mx-auto lg:mx-0 space-y-6">
              <span
                aria-hidden
                className="mx-auto lg:mx-0 block h-px w-16 bg-gradient-to-r from-transparent via-aurora-400/35 to-transparent lg:from-aurora-400/40 lg:via-aurora-400/20"
              />
              <h2
                id="section-apercu"
                className="font-display font-extralight text-display text-ivory-50 leading-[1.02] tracking-[-0.03em]"
              >
                Voilà à quoi ça ressemble.
              </h2>
              <p className="text-body-lg text-ivory-300/95 leading-[1.78] font-light">
                Pas un horoscope de magazine. Une lecture sensible et structurée —{' '}
                <strong className="font-medium text-ivory-100">cœur, chantiers, vitalité</strong> — qui change chaque
                jour avec le ciel et reste calée sur <span className="text-ivory-50">ta</span> carte de naissance.
              </p>
              <p className="text-caption text-ivory-400/85">
                Exemple illustratif — ta vraie guidance est calculée sur ton thème natal.
              </p>
            </div>
            <SocialDeliveryShowcase />
          </div>
        </section>

        {/* L&apos;expérience */}
        <section
          className="relative py-28 md:py-44 px-5 md:px-8 border-t border-white/[0.09] landing-features-ambient"
          aria-labelledby="section-experience"
        >
          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-14 md:mb-20 max-w-2xl mx-auto space-y-5">
              <h2
                id="section-experience"
                className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]"
              >
                Deux moments. Une seule carte du ciel.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <RitualCard
                spotlight
                index={1}
                icon={<Sun className="w-6 h-6 lg:w-7 lg:h-7 text-aurora-200" />}
                title="La guidance du matin"
                text="Ton horoscope personnalisé, chaque jour, en 30 secondes de lecture."
                bullets={[
                  'Basé sur ton thème natal et les transits du jour',
                  'Énergie, vigilances, opportunités — tout est dit',
                  'Reçu sur tes réseaux sociaux, à ton heure',
                ]}
              />
              <RitualCard
                spotlight
                index={2}
                icon={<MessageCircle className="w-6 h-6 lg:w-7 lg:h-7 text-aurora-200" />}
                title="Le dialogue avec ton guide astral"
                text="Une question précise ? Une réflexion ? Tu poses, il répond."
                bullets={[
                  'Réponses contextualisées sur ta carte du ciel',
                  'Mémoire complète de la conversation',
                  '100 messages inclus par mois · packs extras disponibles',
                ]}
              />
            </div>
          </div>
        </section>

        {/* Offre */}
        <section
          id="pricing"
          className="relative py-24 md:py-40 px-6 border-t border-white/[0.09]"
          aria-labelledby="section-offre"
        >
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-10 md:mb-12 space-y-4">
              <h2
                id="section-offre"
                className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]"
              >
                Une seule formule. Tout est inclus.
              </h2>
              <p className="text-body-lg text-aurora-100 font-medium tracking-tight">
                8,90&nbsp;€&thinsp;/&thinsp;mois
              </p>
              <p className="text-body text-ivory-400/95 leading-relaxed max-w-lg mx-auto">
                Pas de version premium cachée. Pas de pubs. Pas de revente de données.
              </p>
            </div>

            <PriceOfferCard />

            <p className="text-center mt-10 text-caption text-ivory-400/85 leading-relaxed max-w-md mx-auto">
              Une fois ton <span className="text-ivory-200 font-medium">thème natal</span> créé et ton canal choisi, tu retrouves le même prix sur la durée — pas de mise à niveau surprise.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="relative py-24 md:py-32 px-6 border-t border-white/[0.09]"
          aria-labelledby="section-faq"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14 md:mb-16">
              <h2
                id="section-faq"
                className="font-display font-extralight text-display text-ivory-50 leading-[0.96] tracking-[-0.03em]"
              >
                Questions fréquentes
              </h2>
            </div>
            <FAQ
              items={[
                {
                  q: "Qu'est-ce qu'un thème natal ?",
                  a: (
                    <>
                      Le thème natal est une carte du ciel calculée à partir de ta date, ton heure et ton lieu de naissance.
                      Il révèle la position exacte de toutes les planètes au moment où tu es né(e), et constitue ta signature
                      astrologique unique.
                    </>
                  ),
                },
                {
                  q: 'Comment fonctionne la guidance personnalisée Zodiak Astro ?',
                  a: (
                    <>
                      Chaque matin, Zodiak Astro croise les transits du jour avec ton thème natal pour générer une guidance
                      écrite spécifiquement pour toi. Aucun texte recyclé, aucun horoscope générique.
                    </>
                  ),
                },
                {
                  q: "Pourquoi les réseaux sociaux plutôt qu'une appli ?",
                  a: (
                    <>
                      Parce que tu ouvres déjà tes réseaux sociaux chaque jour. Pas besoin de télécharger une app de plus
                      que tu vas oublier. Ta guidance arrive là où tu es déjà.
                    </>
                  ),
                },
                {
                  q: "L'heure de naissance exacte est-elle obligatoire ?",
                  a: (
                    <>
                      Idéalement oui — elle permet de calculer ton ascendant et tes maisons astrologiques. Mais on peut
                      commencer sans, et affiner ensuite.
                    </>
                  ),
                },
                {
                  q: 'Comment annuler mon abonnement ?',
                  a: (
                    <>
                      Depuis ton espace personnel, en 1 clic. Aucune justification demandée, aucune relance.
                    </>
                  ),
                },
                {
                  q: "Puis-je annuler pendant l'essai gratuit ?",
                  a: (
                    <>
                      Oui. Tu peux résilier à tout moment pendant les 7 jours d&apos;essai — aucun débit si tu
                      annules avant la fin de la période. La carte sert uniquement à activer l&apos;essai.
                    </>
                  ),
                },
                {
                  q: 'Mes données sont-elles protégées ?',
                  a: (
                    <>
                      Oui. Hébergement en Europe, conforme RGPD, aucune revente à des tiers.
                    </>
                  ),
                },
              ]}
            />
          </div>
        </section>

        {/* Closing */}
        <section
          className="relative py-24 md:py-40 px-6 text-center border-t border-white/[0.09]"
          aria-labelledby="section-closing"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto"
          >
            <h2
              id="section-closing"
              className="font-display font-extralight text-display-xl text-ivory-50 leading-[1.06] mb-10 md:mb-12 tracking-[-0.03em]"
            >
              Demain matin, ton ciel te parle.
            </h2>
            <ButtonLink
              to="/register"
              variant="cosmic"
              size="lg"
              iconLeft={<Sparkles className="w-4 h-4" />}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Commencer mon essai 7 jours
            </ButtonLink>
            <p className="mt-5 text-caption text-ivory-400/85">
              CB requise · Résiliable en 1 clic
            </p>
          </motion.div>

          <footer className="mt-24 md:mt-32 text-center font-mono text-[11px] tracking-[0.12em] text-ivory-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <Logo size="sm" />
            <span className="text-ivory-400/80 normal-case tracking-normal font-sans text-micro">
              {APP_NAME} · Le ciel t&apos;écrit.
            </span>
          </footer>
        </section>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Cartes rituel · offre                                                     */
/* ──────────────────────────────────────────────────────────────────── */

interface RitualCardProps {
  icon: ReactNode;
  title: string;
  kicker?: string;
  text: string;
  featured?: boolean;
  spotlight?: boolean;
  bullets?: string[];
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
          ? 'rounded-2xl border-aurora-400/35 bg-gradient-to-br from-aurora-500/[0.08] via-white/[0.04] to-white/[0.02] hover:border-aurora-400/48 shadow-[inset_0_1px_0_rgba(56,189,248,0.12),0_40px_100px_-56px_rgba(0,0,0,0.75)] p-8 md:p-11 lg:p-12 lg:min-h-[min(52vh,440px)]'
          : 'rounded-xl border-white/12 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/22 p-8 md:p-10',
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

      {kicker ? (
        <span className="protocol-caption text-aurora-200/85 mb-3 normal-case tracking-[0.14em] relative z-[1]">
          {kicker}
        </span>
      ) : null}

      <h3
        className={cn(
          'font-display font-light text-ivory-50 mb-5 leading-[1.12] tracking-[-0.02em] relative z-[1]',
          accent ? 'text-[clamp(1.5rem,3.6vw,2.15rem)]' : 'text-h1',
        )}
      >
        {title}
      </h3>
      <p className="text-body text-ivory-300/95 leading-[1.75] flex-1 relative z-[1]">
        {text}
      </p>
      {bullets && bullets.length > 0 && (
        <ul className="mt-8 pt-8 ritual-spotlights-divider space-y-3.5 text-caption text-ivory-300/95 relative z-[1] leading-relaxed">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-left">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aurora-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                aria-hidden
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  );
}

function PriceOfferCard() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const isAnnual = billing === 'annual';

  const includes = [
    'Guidance quotidienne illimitée',
    '100 messages chat astral inclus par mois',
    'Packs extras disponibles si besoin',
    'Calendrier 30j · alertes transits · synastries',
    'Profil basé sur ton thème natal',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative rounded-2xl overflow-hidden backdrop-blur-md',
        'border border-aurora-400/40 bg-gradient-to-b from-aurora-500/[0.12] via-white/[0.045] to-white/[0.02]',
        'shadow-[inset_0_1px_0_rgba(56,189,248,0.18),0_32px_80px_-44px_rgba(0,0,0,0.9)]',
        'p-8 md:p-10 lg:p-12',
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/85 to-transparent"
      />

      <div className="text-center pb-8 border-b border-white/[0.08] mb-8">
        <div
          role="tablist"
          aria-label="Choix de la formule"
          className="mb-6 flex items-center gap-1 p-1 rounded-full border border-white/[0.1] bg-night-900/50 backdrop-blur-md w-full max-w-xs mx-auto"
        >
          {([
            { id: 'monthly', label: 'Mensuel' },
            { id: 'annual', label: 'Annuel' },
          ] as const).map((opt) => {
            const active = billing === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setBilling(opt.id)}
                className={cn(
                  'relative flex-1 rounded-full px-4 py-2 text-caption font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300',
                  active ? 'text-night-950' : 'text-ivory-300 hover:text-ivory-50',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="landing-billing-pill"
                    className="absolute inset-0 rounded-full bg-aurora-400"
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {opt.label}
                  {opt.id === 'annual' && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                        active ? 'bg-night-950/15 text-night-950' : 'bg-aurora-500/20 text-aurora-200',
                      )}
                    >
                      -17%
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="landing-price-well rounded-xl border border-aurora-400/20 px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-1">
            <span className="font-display font-extralight text-[clamp(3rem,8vw,4rem)] text-ivory-50 leading-none tracking-[-0.03em]">
              {isAnnual ? '89\u00a0€' : '8,90\u00a0€'}
            </span>
            <span className="pb-1 text-body text-aurora-100/90 font-medium">
              {isAnnual ? '/ an' : '/ mois'}
            </span>
          </div>
          {isAnnual && (
            <p className="mt-2 text-caption text-aurora-200/90">Soit ≈ 7,42 € / mois — 2 mois offerts.</p>
          )}
        </div>
      </div>

      <ul className="space-y-3.5 text-body text-ivory-200/95 mb-10">
        {includes.map((line) => (
          <li key={line} className="flex gap-3 leading-snug">
            <Check className="w-[18px] h-[18px] text-aurora-400 shrink-0 mt-0.5" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-aurora-400/35 bg-aurora-500/[0.12] px-5 py-6 text-center mb-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="text-body-lg text-ivory-50 font-light leading-snug">
          <span className="not-italic text-aurora-200/85 font-mono text-[11px] tracking-[0.28em] uppercase block mb-3">
            Offre bienvenue
          </span>
          <strong className="font-semibold text-aurora-100">7 jours d'essai · carte bancaire requise.</strong>
        </p>
        <p className="mt-3 text-caption text-ivory-300/95 leading-relaxed">
          Aucun débit pendant l&apos;essai. Si tu continues, c&apos;est{' '}
          {isAnnual ? '89 €/an' : '8,90 €/mois'} — résiliable en 1 clic.
        </p>
      </div>

      <ButtonLink
        to="/register"
        variant="primary"
        size="lg"
        fullWidth
        iconLeft={<Sparkles className="w-4 h-4" />}
        iconRight={<ArrowRight className="w-4 h-4" />}
        className="landing-primary-cta-glow shadow-none text-night-950"
      >
        Commencer mon essai 7 jours
      </ButtonLink>
    </motion.div>
  );
}
