import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuidanceDisplay from '../components/GuidanceDisplay';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/ui/EmptyState';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';
import { ButtonLink } from '../components/ui/ButtonLink';
import { useDocumentSeo } from '../lib/documentSeo';

export default function GuidanceAccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuidance = async () => {
      setLoading(true);
      setError(null);
      setGuidance(null);

      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(
          errorParam === 'expired'
            ? 'Ce lien a expiré.'
            : 'Lien invalide ou expiré.'
        );
        setLoading(false);
        return;
      }

      const token = searchParams.get('token');
      if (!token) {
        setError('Lien invalide.');
        setLoading(false);
        return;
      }

      const { data: tokenRow, error: tokenError } = await supabase
        .from('guidance_token')
        .select('user_id, date, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (tokenError || !tokenRow) {
        setError('Lien invalide ou expiré.');
        setLoading(false);
        return;
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        setError('Ce lien a expiré.');
        setLoading(false);
        return;
      }

      const { data: guidanceRow } = await supabase
        .from('daily_guidance')
        .select('*')
        .eq('user_id', tokenRow.user_id)
        .eq('date', tokenRow.date)
        .maybeSingle();

      if (!guidanceRow) {
        setError('Aucune guidance trouvée pour ce lien.');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', tokenRow.user_id)
        .maybeSingle();

      setUserName(profile?.name?.split(' ')[0] || null);
      setGuidance(guidanceRow);
      setLoading(false);
    };
    fetchGuidance();
  }, [searchParams]);

  useDocumentSeo({
    title: loading
      ? 'Guidance partagée · Zodiak Astro'
      : error
        ? 'Lien de guidance invalide · Zodiak Astro'
        : 'Guidance du jour · lien sécurisé — Zodiak Astro',
    description: loading
      ? 'Ouverture sécurisée d’une guidance astrale quotidienne partagée sur Zodiak Astro.'
      : error
        ? 'Ce lien de guidance a expiré ou n’est plus valide — demande un nouvel envoi à la personne abonnée à Zodiak Astro.'
        : 'Horoscope et lecture du jour partagés sous lien sécurisé. Découvre Zodiak Astro : guidance quotidienne sur WhatsApp ou Instagram à partir du thème natal — essai 7 jours avec carte, puis 8,90 € / mois.',
  });

  if (loading) return <LoadingScreen message="Chargement de la guidance…" />;

  if (error) {
    return (
      <PageLayout
        eyebrow="Lien partagé"
        title="Lien invalide"
        subtitle="Ce lien était valable peu de temps uniquement — la guidance personnelle quotidienne, elle, arrive chaque matin sur WhatsApp ou Instagram avec Zodiak Astro."
        maxWidth="lg"
        showLogo
        dim
      >
        <Card variant="surface">
          <EmptyState
            icon={<AlertTriangle className="w-7 h-7" />}
            title="Impossible d'ouvrir la guidance"
            description={error}
          />
        </Card>
      </PageLayout>
    );
  }

  if (!guidance) return null;

  return (
    <PageLayout
      eyebrow="Guidance partagée · valable 24 h"
      titlePlain
      title={
        userName ? (
          <>
            <span className="block text-ivory-50">Le ciel</span>
            <span className="block text-gradient-aurora">pour {userName}.</span>
          </>
        ) : (
          <span className="text-gradient-aurora">Une lecture du ciel</span>
        )
      }
      subtitle="Lecture du jour partagée depuis le thème natal — même expérience que ta guidance WhatsApp ou Instagram, ici sous lien sécurisé pour 24 h."
      maxWidth="5xl"
      showLogo
    >
      <GuidanceDisplay guidance={guidance} />

      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-body text-ivory-300 max-w-md">
          Reçois ta propre guidance chaque matin sur WhatsApp ou Instagram — calibrée sur ton thème natal.
        </p>
        <ButtonLink
          to="/register"
          variant="primary"
          size="lg"
          iconLeft={<Sparkles className="w-4 h-4" />}
        >
          Essayer Zodiak Astro — 7 jours
        </ButtonLink>
        <p className="text-caption text-ivory-500">Carte bancaire requise · aucun débit pendant l&apos;essai</p>
      </div>

      <p className="mt-16 eyebrow-ritual text-ivory-400/80 text-center">
        Zodiak Astro — guide astral premium
      </p>
    </PageLayout>
  );
}
