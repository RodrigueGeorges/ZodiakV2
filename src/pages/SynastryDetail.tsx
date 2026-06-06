import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Sparkles, Zap } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { GuidanceMeter } from '../components/GuidanceMeter';
import { useFriends } from '../lib/hooks/useFriends';
import {
  computeSynastry,
  pickHighlights,
  scoreVerdict,
  aspectLabel,
  ChartLite,
  Aspect,
} from '../lib/synastry';
import { useAuth } from '../lib/hooks/useAuth';
import { track } from '../lib/analytics';
import { useDocumentSeo } from '../lib/documentSeo';
import AnimatedCounter from '../components/AnimatedCounter';
import StoryShareButton from '../components/StoryShareButton';

/**
 * Vue détaillée d'une synastrie : score animé, harmonies/frictions, citations.
 *
 * Si la `Synastry` row n'existe pas encore mais que les deux cartes sont
 * disponibles, on calcule à la volée côté front (zéro round-trip) et on
 * laisse le hook recompute en arrière-plan persister la ligne.
 */
export default function SynastryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLoading: authLoading } = useAuth();
  const { friends, recomputeSynastry, loading } = useFriends();
  const [recomputing, setRecomputing] = useState(false);

  const friend = useMemo(() => friends.find((f) => f.id === id), [friends, id]);

  const liveSynastry = useMemo(() => {
    const userChart = (profile?.natal_chart as ChartLite | null) ?? null;
    const friendChart = (friend?.natal_chart as ChartLite | null) ?? null;
    if (!userChart || !friendChart) return null;
    return computeSynastry(userChart, friendChart);
  }, [profile?.natal_chart, friend?.natal_chart]);

  useEffect(() => {
    if (friend && !friend.synastry && liveSynastry && !recomputing) {
      setRecomputing(true);
      recomputeSynastry(friend.id).finally(() => setRecomputing(false));
    }
  }, [friend, liveSynastry, recomputeSynastry, recomputing]);

  const userFirstName = profile?.name?.split(' ')[0] || 'Toi';

  useDocumentSeo({
    title:
      authLoading || loading
        ? 'Synastrie · Zodiak Astro'
        : !friend
          ? 'Synastrie introuvable · Zodiak Astro'
          : `Synastrie avec ${friend.name} · Zodiak Astro`,
    description:
      authLoading || loading
        ? 'Compatibilité astrologique calculée depuis deux thèmes natals sur Zodiak Astro.'
        : !friend
          ? 'Ce lien de synastrie n’est plus disponible — retrouve tes compatibilités dans Mes liens.'
          : `Analyse des aspects entre ${userFirstName} et ${friend.name} à partir de vos cartes du ciel — Zodiak Astro Premium, 8,90 € / mois, essai 7 jours avec carte.`,
  });

  if (authLoading || loading) return <LoadingScreen message="Lecture des aspects…" />;

  if (!friend) {
    return (
      <PageLayout title="Lien introuvable">
        <EmptyState
          title="Cette synastrie n'existe pas (ou plus)."
          description="Retourne à tes liens pour en créer un nouveau."
          action={
            <Button variant="primary" onClick={() => navigate('/friends')}>
              Voir mes liens
            </Button>
          }
        />
      </PageLayout>
    );
  }

  const score = friend.synastry?.base_score ?? liveSynastry?.score ?? null;
  const verdict =
    friend.synastry?.summary ?? (score !== null ? scoreVerdict(score) : 'En cours…');
  const highlights = liveSynastry
    ? pickHighlights(liveSynastry.aspects)
    : { harmonies: [], frictions: [] };

  const onShare = async () => {
    track('synastry_shared', { friend_id: friend.id });
    const shareText = `${userFirstName} × ${friend.name} — ${score}/100 · ${verdict}\n\nLis vos étoiles ensemble sur Zodiak Astro.`;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: 'Notre synastrie',
          text: shareText,
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
    } catch (err) {
      console.warn('share failed', err);
    }
  };

  return (
    <PageLayout
      eyebrow="Synastrie"
      title={`${userFirstName} × ${friend.name}`}
      subtitle={verdict}
      maxWidth="4xl"
      showLogo={false}
      dim
      headerSlot={
        <Button
          variant="text"
          size="sm"
          onClick={() => navigate('/friends')}
          iconLeft={<ArrowLeft className="w-4 h-4" />}
        >
          Mes liens
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Score hero */}
        {score !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card variant="elevated" className="relative overflow-hidden">
              <div className="relative p-10 md:p-16 flex flex-col items-center text-center">
                <p className="eyebrow-ritual mb-5">
                  Indice d'alchimie
                </p>
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 18,
                    delay: 0.2,
                  }}
                  className="font-display text-[88px] md:text-[120px] leading-[0.95] text-aurora-400 tabular-nums"
                  aria-label={`Score ${score} sur 100`}
                >
                  <AnimatedCounter
                    value={score}
                    delay={0.4}
                    stiffness={70}
                    damping={20}
                  />
                </motion.div>
                <p className="mt-2 font-display text-h3 italic-editorial text-ivory-50">{verdict}</p>
                <div className="mt-5 w-full max-w-md">
                  <GuidanceMeter score={score} showLegend />
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="ghost"
                    onClick={onShare}
                    iconLeft={<Share2 className="w-4 h-4" />}
                  >
                    Partager
                  </Button>
                  <StoryShareButton
                    variant="primary"
                    size="md"
                    label="En story"
                    payload={{
                      type: 'synastry',
                      who1: userFirstName,
                      who2: friend.name,
                      score,
                      verdict,
                    }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Harmonies */}
        {highlights.harmonies.length > 0 && (
          <Section
            icon={<Heart className="w-4 h-4 text-magenta-300" />}
            eyebrow="Vos harmonies"
            title="Là où ça vibre ensemble"
            tone="harmony"
            aspects={highlights.harmonies}
            who1={userFirstName}
            who2={friend.name}
          />
        )}

        {/* Frictions */}
        {highlights.frictions.length > 0 && (
          <Section
            icon={<Zap className="w-4 h-4 text-aurora-300" />}
            eyebrow="Vos frictions"
            title="Là où ça vous fait grandir"
            tone="friction"
            aspects={highlights.frictions}
            who1={userFirstName}
            who2={friend.name}
          />
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="eyebrow-ritual text-ivory-400/80 text-center"
        >
          — Une lecture symbolique, pas un verdict —
        </motion.p>
      </div>
    </PageLayout>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  tone: 'harmony' | 'friction';
  aspects: Aspect[];
  who1: string;
  who2: string;
}
function Section({ icon, eyebrow, title, tone, aspects, who1, who2 }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="surface">
        <div className="p-7 md:p-8">
          <div className="flex items-center gap-2 mb-5 text-aurora-400/90">
            {icon}
            <span className="eyebrow-ritual">{eyebrow}</span>
          </div>
          <h3 className="font-display text-h3 text-ivory-50 mb-5">{title}</h3>
          <ul className="space-y-2.5">
            {aspects.map((a, i) => (
              <li
                key={`${a.a}-${a.b}-${a.kind}-${i}`}
                className={`flex items-start gap-2.5 text-body text-ivory-200 ${
                  tone === 'friction' ? '' : ''
                }`}
              >
                <Sparkles
                  className={`w-3.5 h-3.5 mt-1 ${
                    tone === 'harmony' ? 'text-magenta-300' : 'text-aurora-300'
                  }`}
                  aria-hidden="true"
                />
                <span>{aspectLabel(a, who1, who2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </motion.div>
  );
}
