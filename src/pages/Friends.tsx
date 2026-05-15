import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/ui/EmptyState';
import FriendCard from '../components/FriendCard';
import AddFriendForm from '../components/AddFriendForm';
import PremiumGate from '../components/PremiumGate';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/hooks/useAuth';
import { useFriends } from '../lib/hooks/useFriends';
import { usePremium } from '../lib/hooks/usePremium';
import { track } from '../lib/analytics';
import { useDocumentSeo } from '../lib/documentSeo';

/**
 * Page "Mes liens" — annuaire des proches + accès aux synastries.
 *
 * Gating premium :
 *   - Free : 1 lien max enregistré.
 *   - Premium : illimité.
 *
 * On passe par PremiumGate uniquement pour le bouton "Ajouter" lorsque
 * la limite est atteinte ; les liens existants restent accessibles.
 */
export default function Friends() {
  const { isAuthenticated, isLoading } = useAuth();
  const { friends, loading, addFriend, removeFriend } = useFriends();
  const { quotas, isPremium } = usePremium();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  useDocumentSeo({
    title: 'Mes liens · synastries & compatibilités — Zodiak',
    description:
      'Enregistre les personnes qui comptent avec leur date de naissance et explore tes synastries à partir du thème natal — inclus dans Zodiak Premium à 8,99 € / mois, essai sans carte bancaire.',
  });

  if (isLoading) return <LoadingScreen message="Chargement…" />;
  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  const limitReached = !isPremium && friends.length >= quotas.maxFriends;

  return (
    <PageLayout
      eyebrow="Synastries"
      title="Tes liens"
      subtitle="Ajoute tes proches depuis leur thème natal — découvre comment vos deux cieux s’accordent dans Zodiak."
      maxWidth="4xl"
      showLogo={false}
      dim
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-caption text-ivory-300">
            <Users className="w-4 h-4 text-aurora-300" aria-hidden="true" />
            <span>
              {friends.length} {friends.length === 1 ? 'lien' : 'liens'}
              {!isPremium && ` · ${quotas.maxFriends} max en gratuit`}
            </span>
          </div>
          {!adding && !limitReached && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAdding(true)}
              iconLeft={<UserPlus className="w-4 h-4" />}
            >
              Ajouter
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {adding && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <AddFriendForm
                onCancel={() => setAdding(false)}
                onAdded={async (data) => {
                  await addFriend({
                    name: data.name,
                    relationship: data.relationship,
                    birth_date: data.birth_date,
                    birth_time: data.birth_time,
                    birth_place: data.birth_place,
                    avatar_emoji: data.avatar_emoji,
                    natal_chart: data.natal_chart as never,
                    natal_summary: data.natal_summary,
                  });
                  track('friend_added', {
                    relationship: data.relationship,
                    has_birth_time: Boolean(data.birth_time),
                  });
                  setAdding(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 && !adding ? (
          <EmptyState
            icon={<Users className="w-7 h-7" />}
            title="Aucun lien encore"
            description="Ajoute un proche, un crush, un partenaire — vois comment vos cartes dialoguent."
            action={
              <Button
                variant="primary"
                onClick={() => setAdding(true)}
                iconLeft={<UserPlus className="w-4 h-4" />}
              >
                Ajouter un lien
              </Button>
            }
          />
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {friends.map((f) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FriendCard
                    friend={f}
                    onClick={() => {
                      track('synastry_viewed', { friend_id: f.id });
                      navigate(`/synastry/${f.id}`);
                    }}
                    onDelete={() => removeFriend(f.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {limitReached && !adding && (
          <PremiumGate
            feature="friends_limit"
            preview={false}
            title="Plus de liens, plus de lectures"
            description="Tu as atteint la limite gratuite. Avec Premium, ajoute autant de proches que tu veux."
          >
            <div />
          </PremiumGate>
        )}
      </div>
    </PageLayout>
  );
}
