import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  Heart,
  MessageCircle,
  Moon,
  Sparkles,
  Sun,
  Stars,
} from 'lucide-react';
import Logo from '../components/Logo';
import AuroraShader from '../components/AuroraShader';
import KineticTitle from '../components/KineticTitle';
import AuroraBackground from '../components/ui/AuroraBackground';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import CosmicLoader from '../components/CosmicLoader';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { moonPhaseAt } from '../lib/moonPhase';
import { cn } from '../lib/utils';

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
      {/* Header très léger, transparent */}
      <header className="absolute z-30 top-0 inset-x-0 px-6 md:px-10 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" aria-label="Accueil Zodiak">
          <Logo size="sm" />
          <span className="font-cinzel text-h3 text-ivory-50 tracking-wide group-hover:text-aurora-300 transition-colors">
            Zodiak
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-caption text-ivory-200 hover:text-aurora-300 transition-colors"
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
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12 overflow-hidden"
      >
        <AuroraShader />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-night-950 pointer-events-none"
        />

        <motion.div
          style={{ y: heroTitleY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-6"
          >
            Ton guide astral · Cosmic Editorial
          </motion.p>

          <KineticTitle
            className="text-display-xl md:text-[112px] xl:text-[140px] tracking-tight text-gradient-aurora"
            lines={[
              { text: 'Lis-toi.' },
              { text: 'Lis-le.' },
              { text: 'Lis le ciel.' },
            ]}
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0 }}
            className="mt-8 text-body-lg md:text-h3 text-ivory-200 max-w-2xl mx-auto leading-relaxed font-cinzel"
          >
            Chaque matin, une lecture précise du ciel sur ton thème natal.
            Une voix qui se souvient. Des liens qui prennent du sens.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              iconLeft={<Sparkles className="w-4 h-4" />}
            >
              Découvrir ma carte
            </Button>
            <span className="text-micro uppercase tracking-[0.22em] text-ivory-400">
              7 jours d'essai · sans engagement
            </span>
          </motion.div>
        </motion.div>

        {/* Indicateur scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0.4, 1] }}
          transition={{ duration: 3.6, delay: 1.6, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
          aria-hidden="true"
        >
          <span className="text-micro uppercase tracking-[0.22em] text-ivory-400">
            Descends
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-aurora-300 to-transparent" />
        </motion.div>
      </section>

      {/* ─── CHAPITRE 2 : LE CIEL CE SOIR ───────────────────────── */}
      <Chapter
        eyebrow="Le ciel — maintenant"
        title={
          <>
            {moonNow.glyph} {moonNow.label}.
          </>
        }
        body={
          <>
            On est le {' '}
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            . La lune est à {Math.round(moonNow.illumination * 100)}% de
            luminosité. Chaque guidance que tu liras part de ce ciel,
            recoupé avec ton thème natal. Précis, vivant, jamais générique.
          </>
        }
        align="center"
      />

      {/* ─── CHAPITRE 3 : TROIS RITUELS ─────────────────────────── */}
      <section className="relative py-24 md:py-36 px-6">
        <AuroraBackground variant="dim" withStars={false} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Trois rituels
            </p>
            <h2 className="font-cinzel text-display md:text-[88px] text-ivory-50 leading-tight">
              Ce que tu vis chaque jour.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <RitualCard
              icon={<Sun className="w-5 h-5" />}
              title="Le matin"
              kicker="Guidance"
              text="Une lecture du ciel calibrée sur ton thème natal. WhatsApp ou Instagram, à l'heure que tu choisis."
              tone="amber"
            />
            <RitualCard
              icon={<MessageCircle className="w-5 h-5" />}
              title="L'après-midi"
              kicker="Guide astral"
              text="Une voix qui se souvient de toi, de tes humeurs, de tes questions. Plus tu lui parles, plus elle te connaît."
              tone="aurora"
            />
            <RitualCard
              icon={<Heart className="w-5 h-5" />}
              title="Le soir"
              kicker="Liens"
              text="Vois comment ton ciel dialogue avec celui d'un proche. Synastrie en quelques secondes."
              tone="magenta"
            />
          </div>
        </div>
      </section>

      {/* ─── CHAPITRE 4 : ŒUVRE QUI TE RESSEMBLE ────────────────── */}
      <section className="relative py-24 md:py-36 px-6 bg-night-950 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-transparent via-aurora-500/5 to-transparent"
        />
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Œuvre cosmique
            </p>
            <h2 className="font-cinzel text-display text-ivory-50 mb-6 leading-tight">
              Une carte
              <br />
              qui te ressemble.
            </h2>
            <p className="text-body-lg text-ivory-200 leading-relaxed mb-6">
              Ton thème natal devient une œuvre générative unique : aucune
              autre n'a la même composition que la tienne. À garder en
              écran d'accueil, à imprimer en poster, à partager en story.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => navigate('/register')}
                iconLeft={<Compass className="w-4 h-4" />}
              >
                Voir la mienne
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-square"
          >
            {/* Aperçu démo : un pseudo natal art statique pour la landing */}
            <div className="absolute inset-0 rounded-[36px] overflow-hidden ring-1 ring-aurora-400/30 shadow-glow-aurora">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-night-950"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(142,85,255,0.45),transparent_60%),radial-gradient(circle_at_70%_60%,rgba(232,74,147,0.4),transparent_55%),radial-gradient(circle_at_50%_85%,rgba(245,182,56,0.25),transparent_60%)]"
              />
              <svg
                viewBox="0 0 400 400"
                className="absolute inset-0 w-full h-full"
                aria-hidden="true"
              >
                <g
                  fill="none"
                  stroke="rgba(201,166,255,0.6)"
                  strokeWidth="0.6"
                >
                  {Array.from({ length: 12 }).map((_, i) => {
                    const a = (i / 12) * Math.PI * 2;
                    return (
                      <line
                        key={i}
                        x1={200 + Math.cos(a) * 60}
                        y1={200 + Math.sin(a) * 60}
                        x2={200 + Math.cos(a) * 175}
                        y2={200 + Math.sin(a) * 175}
                      />
                    );
                  })}
                </g>
                <circle
                  cx="200"
                  cy="200"
                  r="160"
                  fill="none"
                  stroke="rgba(232,74,147,0.5)"
                  strokeWidth="0.8"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="100"
                  fill="none"
                  stroke="rgba(142,85,255,0.5)"
                  strokeWidth="0.6"
                />
                <circle cx="200" cy="200" r="6" fill="rgba(250,247,242,0.95)" />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CHAPITRE 5 : PRICING ──────────────────────────────── */}
      <section className="relative py-24 md:py-36 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-micro uppercase tracking-[0.32em] text-aurora-300 mb-3">
              Tarif honnête
            </p>
            <h2 className="font-cinzel text-display text-ivory-50 leading-tight">
              4,99€ par mois.
              <br />
              Ou rien.
            </h2>
          </div>

          <Card variant="elevated" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/15 via-transparent to-magenta-500/12"
            />
            <div className="relative p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-3">
                  Premium
                </p>
                <p className="font-cinzel text-display-xl text-ivory-50 leading-none">
                  4,99€
                </p>
                <p className="text-caption text-ivory-300 mt-1">par mois</p>

                <ul className="mt-6 space-y-2.5 text-body text-ivory-200">
                  <PriceLi>Guidance quotidienne illimitée</PriceLi>
                  <PriceLi>Synastries illimitées</PriceLi>
                  <PriceLi>Chat astral sans limite</PriceLi>
                  <PriceLi>Calendrier 30 jours</PriceLi>
                  <PriceLi>Stories haute résolution</PriceLi>
                </ul>

                <Button
                  className="mt-7"
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/register')}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Essai 7 jours gratuit
                </Button>
                <p className="mt-2 text-micro text-ivory-400">
                  Annulable en 1 clic. Aucune carte demandée pour commencer.
                </p>
              </div>

              <div className="space-y-3 text-caption text-ivory-300">
                <Guarantee
                  icon={<Stars className="w-4 h-4 text-aurora-300" />}
                  title="Données protégées"
                  text="Tes infos de naissance restent chez nous, jamais revendues."
                />
                <Guarantee
                  icon={<Moon className="w-4 h-4 text-magenta-300" />}
                  title="Pas de bruit"
                  text="Maximum 1 message WhatsApp/Instagram par jour. Toujours utile."
                />
                <Guarantee
                  icon={<Heart className="w-4 h-4 text-amber-300" />}
                  title="Sans engagement"
                  text="Tu pars quand tu veux, on garde rien."
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ─── CHAPITRE 6 : CTA FINAL + FOOTER ────────────────────── */}
      <section className="relative pt-12 pb-20 px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="font-cinzel text-display md:text-[88px] text-gradient-aurora leading-tight mb-6"
        >
          Le ciel sait.
          <br />
          Tu peux savoir aussi.
        </motion.h2>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/register')}
          iconLeft={<Sparkles className="w-4 h-4" />}
        >
          Commencer maintenant
        </Button>

        <footer className="mt-20 text-micro uppercase tracking-[0.32em] text-ivory-400 flex items-center justify-center gap-2">
          <Logo size="sm" />
          <span>Zodiak — Lis-toi.</span>
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
    <section className="relative py-24 md:py-32 px-6 bg-night-950">
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
        <h2 className="font-cinzel text-display md:text-[80px] text-ivory-50 leading-tight mb-5">
          {title}
        </h2>
        <p className="text-body-lg md:text-h3 text-ivory-200 leading-relaxed font-cinzel">
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
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7 }}
      whileHover={{ y: -4 }}
    >
      <Card variant="elevated" className="relative overflow-hidden h-full">
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br ring-1',
            toneMap[tone]
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
    </motion.article>
  );
}

function PriceLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Sparkles className="w-3.5 h-3.5 text-aurora-300 mt-1 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

interface GuaranteeProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}
function Guarantee({ icon, title, text }: GuaranteeProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-night-900/50 ring-1 ring-night-700/60">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-cinzel text-body text-ivory-50">{title}</p>
        <p className="text-caption text-ivory-300">{text}</p>
      </div>
    </div>
  );
}
