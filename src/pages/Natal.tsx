import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NatalChartTab from '../components/NatalChartTab';
import LoadingScreen from '../components/LoadingScreen';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../lib/hooks/useAuth';
import { useDocumentSeo } from '../lib/documentSeo';

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

  useDocumentSeo({
    title: 'Thème natal · carte du ciel — Zodiak Astro',
    description:
      'Ta carte astronomique personnelle calculée depuis ton thème natal — positions des planètes, maisons et aspects sur Zodiak Astro.',
  });

  if (isLoading) {
    return <LoadingScreen message="Calcul de ta carte du ciel…" />;
  }

  if (!profile) return <LoadingScreen message="Chargement de ton profil…" />;

  const firstName = profile.name?.split(' ')[0] || 'voyageur';

  return (
    <PageLayout
      eyebrow="Thème natal"
      title={`Ton horoscope gravé dans le ciel, ${firstName}`}
      subtitle="La carte calculée depuis ta naissance : positions et aspects pour retrouver tout ce qui nourrit ton horoscope personnalisé quotidien."
      maxWidth="5xl"
      showLogo={false}
      dim
    >
      <NatalChartTab profile={profile} />
    </PageLayout>
  );
}
