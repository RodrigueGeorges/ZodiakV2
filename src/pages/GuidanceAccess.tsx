import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import GuidanceDisplay from '../components/GuidanceDisplay';
import LoadingScreen from '../components/LoadingScreen';
import AuroraBackground from '../components/ui/AuroraBackground';
import EmptyState from '../components/ui/EmptyState';
import SectionHeader from '../components/ui/SectionHeader';
import Logo from '../components/Logo';

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
      <div className="page-container relative">
        <AuroraBackground variant="dim" />
        <div className="relative z-10 mx-auto max-w-lg px-4 py-20 md:py-32">
          <Logo size="md" className="mx-auto" />
          <div className="mt-10">
            <EmptyState
              icon={<AlertTriangle className="w-7 h-7" />}
              title="Lien invalide"
              description={error}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!guidance) return null;

  return (
    <div className="page-container relative">
      <AuroraBackground />
      <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-8 pt-10 md:pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center mb-10"
        >
          <Logo size="md" />
        </motion.div>

        <SectionHeader
          eyebrow="Guidance partagée"
          title={
            userName
              ? `Le ciel pour ${userName}`
              : 'Une lecture du ciel'
          }
          subtitle="Lien sécurisé · Valable 24h"
          align="center"
          size="md"
          className="mb-12"
        />

        <GuidanceDisplay guidance={guidance} />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-micro uppercase tracking-[0.22em] text-ivory-400"
        >
          ✦ Zodiak — Ton guide astral premium ✦
        </motion.p>
      </div>
    </div>
  );
}
