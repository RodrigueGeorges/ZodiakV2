import { useAuth } from '../lib/hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import NatalChartTab from '../components/NatalChartTab';
import CosmicLoader from '../components/CosmicLoader';
import PageLayout from '../components/PageLayout';

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <CosmicLoader />
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <div className="text-red-400 text-center">Profil non trouvé. Redirection...</div>
      </div>
    );
  }

  return (
    <PageLayout
      title={`Thème Natal de ${profile.name?.split(' ')[0] || 'Utilisateur'}`}
      subtitle="Votre carte du ciel, votre signature astrale et votre interprétation premium."
      maxWidth="5xl"
    >
      <NatalChartTab profile={profile} />
    </PageLayout>
  );
} 