import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { StorageService } from '../lib/storage';
import LoadingScreen from '../components/LoadingScreen';
import PageLayout from '../components/PageLayout';
import ProfileTab from '../components/ProfileTab';
import EmptyState from '../components/EmptyState';
import type { Profile } from '../lib/types/supabase';

export default function ProfilePage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      title={`Bienvenue, ${firstName}`}
      subtitle="Tes informations, ton canal de guidance et ton abonnement."
      maxWidth="5xl"
      showLogo={false}
      dim
    >
      <ProfileTab profile={profile} onLogout={handleLogout} />
    </PageLayout>
  );
}
