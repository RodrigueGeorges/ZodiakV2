import { useEffect, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  Heart,
  MessageCircle,
  Sparkles,
  Sun,
} from 'lucide-react';
import Logo from '../components/Logo';
import AppBackdrop from '../components/AppBackdrop';
import RitualIngress from '../components/RitualIngress';
import CosmicWheel from '../components/CosmicWheel';
import LiveCounter from '../components/LiveCounter';
import FAQ from '../components/FAQ';
import { ButtonLink } from '../components/ui/ButtonLink';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';

/**
 * Home — landing v5 (DA « Oracle machine »).
 *
 * - Fond froid, chrome `signal`, accents or sur l’éditorial.
 * - Protocole monospace (eyebrows, méta) + serif pour le sens.
 * - Grain + vignette statiques, étoiles dé-saturées dans StarField.
 */
export default function Home() {
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const navigate = useNavigate();

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
      {/* Fond commun (étoiles, vignette, grain) */}
      <AppBackdrop density={0.32} />

      <div className="relative z-[1] isolate">
      {/* Header */}
      <header className="absolute z-30 top-0 inset-x-0 px-6 md:px-10 lg:px-14 py-5 md:py-6 flex items-center justify-between border-b border-signal-600/20 bg-night-950/50 backdrop-blur-[8px]">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          aria-label="Accueil Zodiak"
        >
          <Logo size="sm" composeOnLoad />
          <span className="font-serif text-h3 text-ivory-50 tracking-tight group-hover:text-signal-300 transition-colors duration-200 ease-brutal">
            Zodiak
          </span>
        </Link>
        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/login"
            className="hidden sm:inline-block text-caption text-ivory-200 hover:text-signal-300 transition-colors duration-200 ease-brutal underline-offset-4"
          >
            Se connecter
          </Link>
          <ButtonLink to="/register" variant="primary" size="sm">
            Commencer
          </ButtonLink>
        </div>
      </header>

      {/* Hero — typo d’abord, une seule carte d’aperçu */}
      <section
        className="relative min-h-[100svh] flex flex-col justify-center px-6 md:px-10 lg:px-14 pt-28 pb-24 md:pt-32 md:pb-28"
        aria-labelledby="hero-title"
      >
        <div className="absolute inset-x-0 top-1/4 h-[38vh] max-h-[400px] bg-gradient-to-b from-signal-400/[0.035] via-transparent to-transparent pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-[1100px]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-14 lg:gap-20 items-start">
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <p className="protocol-caption mb-8 text-signal-400/80">
                Thème natal · guidance quotidienne
              </p>
              <h1
                id="hero-title"
                className="font-serif text-[clamp(2.35rem,6.2vw,4.25rem)] leading-[1.05] tracking-[-0.03em] text-ivory-50"
              >
                Une lecture
                <br />
                <span className="italic-editorial text-aurora-400">
                  où tu ouvres les yeux.
                </span>
              </h1>
              <p className="mt-8 text-body-lg text-ivory-200/75 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Un message par jour — calibré sur ton ciel réel — sur{' '}
                <span className="text-ivory-50/95">WhatsApp</span>
                {' ou '}
                <span className="text-ivory-50/95">Instagram</span>, à l’heure que tu fixes.
                Sans appli ni fil d’actus à désosser.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-4">
                <ButtonLink
                  to="/register"
                  variant="primary"
                  size="lg"
                  iconLeft={<Sparkles className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Commencer l’essai
                </ButtonLink>
                <ButtonLink
                  to="/login"
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Connexion
                </ButtonLink>
              </div>
              <p className="mt-6 font-mono text-[10px] tracking-[0.2em] uppercase text-signal-500/70">
                7 jours offerts · sans carte bancaire
              </p>
            </div>

            <div className="flex justify-center lg:justify-end lg:sticky lg:top-28">
              <RitualIngress />
            </div>
          </div>
        </div>
      </section>

      {/* Réassurance — une seule ligne, pas d’anneaux décoratifs */}
      <section className="relative z-10 border-y border-signal-600/15 py-12 px-6">
        <p className="max-w-3xl mx-auto text-center font-mono text-caption text-signal-300/75 leading-relaxed">
          Ouvertures qui comptent · Données en Europe · Jamais revendues · Sans
          engagement · Annulation en un clic.
        </p>
      </section>

      {/* Ciel du jour — typographie + glyphe */}
      <Chapter
        eyebrow="Ce qui domine aujourd'hui"
        title={
          <>
            <span className="inline-block mr-3 align-middle text-[0.85em] text-aurora-300">
              {moonNow.glyph}
            </span>
            <span className="italic-editorial text-aurora-400">{moonNow.label}</span>
            <span className="text-ivory-400/80">.</span>
          </>
        }
        body={
          <span className="not-italic">
            Ce que tu lis sur ton fil chaque matin part de ce ciel&nbsp;: mêmes transits,
            mêmes degrés rattachés à ta carte. Pas de formule toute faite — une grille
            tissée sur ton thème.
          </span>
        }
      />

      {/* ─── CHAPITRE 3 : TROIS RITUELS ─────────────────────────── */}
      <section className="relative py-24 md:py-40 px-6 border-t border-signal-600/12">
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <p className="protocol-caption text-signal-400/80 mb-8">
              Rituels
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.98] tracking-tight">
              Trois façons{' '}
              <span className="italic-editorial text-aurora-400">d’être guidé.</span>
            </h2>
            <p className="mt-7 text-body-lg text-ivory-300/80 max-w-2xl mx-auto leading-[1.7]">
              Pas trois apps, pas trois abonnements. Une seule expérience qui
              t'accompagne du matin au soir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-signal-600/25">
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
      <section className="relative py-24 md:py-40 px-6 border-t border-signal-600/12 overflow-hidden">
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-14 md:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.9 }}
            className="order-2 md:order-1"
          >
            <p className="protocol-caption text-signal-400/80 mb-6 md:mb-8">
              Carte natale
            </p>
            <h2 className="font-serif text-display text-ivory-50 mb-8 leading-[0.98] tracking-tight">
              Ton ciel
              <br />
              <span className="italic-editorial text-aurora-400">figé puis animé.</span>
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
            <ButtonLink
              to="/register"
              variant="primary"
              iconLeft={<Compass className="w-4 h-4" />}
            >
              Voir ma carte
            </ButtonLink>
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
        className="relative py-24 md:py-40 px-6 border-t border-signal-600/12"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <p className="protocol-caption text-signal-400/80 mb-8 md:mb-10">
              Tarifs
            </p>
            <div className="mb-10 flex justify-center">
              <LiveCounter />
            </div>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.98] tracking-tight">
              Choisis ce qui te <span className="italic-editorial text-aurora-400">ressemble.</span>
            </h2>
            <p className="mt-7 text-body-lg text-ivory-300/80 max-w-xl mx-auto leading-[1.7]">
              Pas de pub, pas de revente de données, pas de paliers cachés.
              Tu paies une fois, tu profites de tout.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-signal-600/25 items-stretch">
            <PriceCard
              eyebrow="Mensuel"
              price="8,99 €"
              priceSuffix="/ mois"
              hint="Idéal pour essayer"
              ctaLabel="Commencer mon essai"
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
      <section className="relative py-24 md:py-32 px-6 border-t border-signal-600/12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="protocol-caption text-signal-400/80 mb-8">
              Questions
            </p>
            <h2 className="font-serif text-display text-ivory-50 leading-[0.98] tracking-tight">
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
      <section className="relative py-24 md:py-40 px-6 text-center border-t border-signal-600/12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="protocol-caption text-signal-400/85 mb-10">
            Prochain pas
          </p>
          <h2 className="font-serif text-display-xl text-ivory-50 leading-[1.02] mb-10 md:mb-12 tracking-tight">
            Le ciel travaille en silence.
            <br />
            <span className="italic-editorial text-aurora-400">
              Toi aussi, tu peux t’y mettre.
            </span>
          </h2>
          <ButtonLink
            to="/register"
            variant="primary"
            size="lg"
            iconLeft={<Sparkles className="w-4 h-4" />}
          >
            Commencer maintenant
          </ButtonLink>
          <p className="mt-5 eyebrow-ritual text-ivory-400/80">
            7 jours offerts · sans CB
          </p>
        </motion.div>

        <footer className="mt-24 md:mt-32 text-center font-mono text-[11px] tracking-[0.12em] text-signal-500/65 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
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
    <section className="relative z-[1] py-20 md:py-28 px-6 border-t border-signal-600/12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <p className="protocol-caption text-signal-400/85 mb-8 md:mb-10 max-w-xl mx-auto">
          {eyebrow}
        </p>
        <h2 className="font-serif text-display text-ivory-50 leading-[0.98] mb-10 tracking-tight">
          {title}
        </h2>
        <p className="text-body-lg text-ivory-200/82 leading-relaxed">{body}</p>
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
      className="relative bg-night-950 hover:bg-night-900/55 transition-colors duration-200 ease-brutal group p-8 md:p-12 flex flex-col shadow-[inset_0_1px_0_rgba(127,160,144,0.06)]"
    >
      <span className="protocol-caption text-signal-500/80 mb-3 normal-case tracking-[0.14em]">{kicker}</span>
      <h3 className="font-serif text-h1 text-ivory-50 mb-5 leading-tight">
        {title}
      </h3>
      <p className="text-body text-ivory-200/85 leading-[1.7] flex-1">{text}</p>
      <div className="mt-10 flex items-center gap-3 text-signal-400">
        <span className="block h-px w-10 bg-signal-400/55 group-hover:w-16 transition-all duration-300 ease-brutal" />
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
        className="flex-shrink-0 mt-2.5 block h-px w-4 bg-signal-400/55"
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
  /** Route d’inscription (lien réel plutôt que history.push). */
  ctaTo?: string;
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
  ctaTo = '/register',
  features,
}: PriceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8 }}
      className={cn(
        'relative h-full flex flex-col rounded-sm bg-night-950 border border-signal-600/18',
        'hover:bg-night-900/50 transition-colors duration-200 ease-brutal p-8 md:p-10',
        highlighted && 'bg-night-900/30 border-signal-400/35 shadow-[inset_0_1px_0_rgba(212,166,86,0.12)]',
      )}
    >
      {highlighted && (
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-aurora-400/80 to-transparent"
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <span className="protocol-caption text-signal-400/90">{eyebrow}</span>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] px-2 py-1 rounded-sm border border-signal-500/40 text-signal-300">
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
        <p className="text-caption text-signal-300/90 mb-1">{perMonth}</p>
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
              className="flex-shrink-0 mt-2.5 block h-px w-4 bg-signal-400/55"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <ButtonLink
        to={ctaTo}
        variant={highlighted ? 'primary' : 'ghost'}
        size="lg"
        fullWidth
        iconRight={<ArrowRight className="w-4 h-4" />}
        className="mt-auto"
      >
        {ctaLabel}
      </ButtonLink>
    </motion.div>
  );
}
