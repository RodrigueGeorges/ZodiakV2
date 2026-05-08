import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NatalChartTab from '../components/NatalChartTab';
import LoadingScreen from '../components/LoadingScreen';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../lib/hooks/useAuth';

export default function Natal() {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
    if (!isLoading && isAuthenticated && !profile) {
      navigate('/profile', { replace: true });
    }
  }, [isLoading, isAuthenticated, profile, navigate]);

  if (isLoading) {
    return <LoadingScreen message="Calcul de ta carte du ciel…" />;
  }

  if (!profile) return <LoadingScreen message="Chargement de ton profil…" />;

  const firstName = profile.name?.split(' ')[0] || 'voyageur';

  return (
    <PageLayout
      eyebrow="Thème natal"
      title={`Ta carte, ${firstName}`}
      subtitle="Le ciel exact de ta naissance, lu à travers l'aurora cosmique."
      maxWidth="5xl"
      showLogo={false}
      dim
    >
      <NatalChartTab profile={profile} />
    </PageLayout>
  );
}
