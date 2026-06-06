import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/hooks/useAuth';
import { StorageService } from '../lib/storage';
import LoadingScreen from '../components/LoadingScreen';
import PageLayout from '../components/PageLayout';
import ProfileTab from '../components/ProfileTab';
import EmptyState from '../components/EmptyState';
import ReferralCard from '../components/ReferralCard';
import MoodHeatmap from '../components/MoodHeatmap';
import SoundToggle from '../components/SoundToggle';
import { useMood } from '../lib/hooks/useMood';
import type { Profile } from '../lib/types/supabase';
import { useDocumentSeo } from '../lib/documentSeo';
import { toast } from '../lib/toast';

export default function ProfilePage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { history: moodHistory } = useMood();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const userProfile = await StorageService.getProfile(user.id);
        if (!cancelled) setProfile(userProfile);
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur chargement profil:', err);
          setError('Erreur lors du chargement du profil.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (searchParams.get('subscribed') !== '1' || !profile) return;
    const firstName = profile.name?.split(' ')[0] || 'voyageur';
    setSearchParams({}, { replace: true });
    toast.success(
      `Bienvenue ${firstName} ! Connecte WhatsApp ou Instagram pour recevoir ta guidance demain matin.`,
    );
    window.setTimeout(() => {
      document.getElementById('guidance-channel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 400);
  }, [searchParams, setSearchParams, profile]);

  useDocumentSeo({
    title: error
      ? 'Erreur · Zodiak Astro'
      : !profile && user
        ? 'Profil à compléter · Zodiak Astro'
        : 'Mon profil · Zodiak Astro — compte & abonnement',
    description: error
      ? 'Une erreur a empêché le chargement de ton profil Zodiak Astro.'
      : !profile && user
        ? 'Complète ton profil et ton thème natal pour activer ta guidance personnalisée et ton chat astral.'
        : 'Réglages compte Zodiak Astro : canal WhatsApp ou Instagram, thème natal, abonnement 8,90 € / mois et résiliation en un clic.',
  });

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Erreur déconnexion:', e);
      window.location.href = '/login';
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen message="Chargement de ton profil…" />;
  }
  if (!user) return <LoadingScreen message="Connexion en cours…" />;

  if (error) {
    return (
      <PageLayout title="Erreur" subtitle="Une erreur est survenue.">
        <EmptyState
          type="general"
          title="Profil indisponible"
          message={error}
          action={{ label: 'Réessayer', onClick: () => window.location.reload() }}
        />
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout
        eyebrow="Profil"
        title="Quelques étoiles à aligner"
        subtitle="Complète ton profil pour activer ta guidance personnalisée."
      >
        <EmptyState
          type="profile"
          action={{
            label: 'Compléter mon profil',
            onClick: () => (window.location.href = '/register/complete'),
          }}
        />
      </PageLayout>
    );
  }

  const firstName = profile.name?.split(' ')[0] || 'voyageur';

  return (
    <PageLayout
      eyebrow="Profil"
      title={
        <>
          Bienvenue,{' '}
          <span className="italic-editorial text-aurora-400">{firstName}</span>
        </>
      }
      titlePlain={false}
      subtitle="Ton compte, ton canal WhatsApp ou Instagram, ton thème natal et ton abonnement — tout au même endroit."
      maxWidth="5xl"
      showLogo={false}
      dim
    >
      <div className="space-y-10 md:space-y-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProfileTab profile={profile} onLogout={handleLogout} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <ReferralCard
            userId={user.id}
            referralCode={
              (profile as Profile & { referral_code?: string | null })
                .referral_code
            }
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <MoodHeatmap history={moodHistory} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <SoundToggle />
        </motion.div>
      </div>
    </PageLayout>
  );
}
