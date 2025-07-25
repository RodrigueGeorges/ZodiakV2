import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { StorageService } from '../lib/storage';
import { ButtonZodiak } from '../components/ButtonZodiak';
import { ProfileTab } from '../components/ProfileTab';
import LoadingScreen from '../components/LoadingScreen';
import { PageLayout } from '../components/PageLayout';
import { motion } from 'framer-motion';

interface ProfileData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { redirectTo } = useAuthRedirect();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userProfile = await StorageService.getProfile(user.id);
        setProfile(userProfile);
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleProfileUpdate = async (updatedProfile: ProfileData) => {
    try {
      await StorageService.saveProfile(updatedProfile);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError('Erreur lors de la mise à jour du profil');
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    redirectTo('/login');
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <PageLayout title="Erreur" subtitle="Une erreur est survenue">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <ButtonZodiak
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90"
          >
            Réessayer
          </ButtonZodiak>
        </div>
      </PageLayout>
    );
  }

  if (!profile) {
    return (
      <PageLayout title="Profil non trouvé" subtitle="Votre profil n'a pas été trouvé">
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">
            Votre profil n'a pas été trouvé. Veuillez compléter votre inscription.
          </p>
          <ButtonZodiak
            onClick={() => redirectTo('/register/complete')}
            className="bg-primary hover:bg-primary/90"
          >
            Compléter mon profil
          </ButtonZodiak>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Mon Profil" subtitle="Gérez vos informations personnelles">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ProfileTab
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      </motion.div>
    </PageLayout>
  );
}