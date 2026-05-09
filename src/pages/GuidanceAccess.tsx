import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuidanceDisplay from '../components/GuidanceDisplay';
import LoadingScreen from '../components/LoadingScreen';
import EmptyState from '../components/ui/EmptyState';
import PageLayout from '../components/PageLayout';
import { Card } from '../components/ui/Card';

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

  if (loading) return <LoadingScreen message="Chargement de la guidance…" />;

  if (error) {
    return (
      <PageLayout
        eyebrow="Lien partagé"
        title="Lien invalide"
        subtitle="Ce lien n'est plus accessible — il a peut-être expiré."
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
      subtitle="Lien sécurisé · partagé pour cette journée uniquement."
      maxWidth="5xl"
      showLogo
    >
      <GuidanceDisplay guidance={guidance} />

      <p className="mt-12 text-center text-micro uppercase tracking-[0.22em] text-ivory-400">
        ✦ Zodiak — Ton guide astral premium ✦
      </p>
    </PageLayout>
  );
}
