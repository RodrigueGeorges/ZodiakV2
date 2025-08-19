import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import GuidanceContent from '../components/GuidanceContent';
import LoadingScreen from '../components/LoadingScreen';

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
      
      // Vérifier s'il y a une erreur dans l'URL
      const errorParam = searchParams.get('error');
      if (errorParam) {
        switch (errorParam) {
          case 'notfound':
            setError('Lien invalide ou expiré.');
            break;
          case 'expired':
            setError('Ce lien a expiré.');
            break;
          default:
            setError('Une erreur est survenue.');
        }
        setLoading(false);
        return;
      }
      
      const token = searchParams.get('token');
      if (!token) {
        setError('Lien invalide.');
        setLoading(false);
        return;
      }
      // Vérifier le token
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
      // Récupérer la guidance du jour
      const { data: guidanceRow, error: guidanceError } = await supabase
        .from('daily_guidance')
        .select('*')
        .eq('user_id', tokenRow.user_id)
        .eq('date', tokenRow.date)
        .maybeSingle();
      if (guidanceError || !guidanceRow) {
        setError('Aucune guidance trouvée pour ce lien.');
        setLoading(false);
        return;
      }
      // Récupérer le nom de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', tokenRow.user_id)
        .maybeSingle();
      setUserName(profile?.name || null);
      setGuidance(guidanceRow);
      setLoading(false);
    };
    fetchGuidance();
  }, [searchParams]);

  if (loading) return <LoadingScreen message="Chargement de la guidance..." />;
  if (error) return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full p-6 bg-cosmic-800 rounded-xl shadow-lg border border-primary/20">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold font-cinzel mb-4 text-primary">Lien Invalide</h2>
          <p className="text-gray-300 text-lg mb-6">{error}</p>
          <div className="text-gray-400 text-sm">
            <p>Ce lien peut avoir expiré ou être incorrect.</p>
            <p className="mt-2">Contactez-nous si vous pensez qu'il s'agit d'une erreur.</p>
          </div>
        </div>
      </div>
    </div>
  );
  if (!guidance) return null;

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-cosmic-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold font-cinzel mb-4 text-primary">Guidance du jour</h2>
      {userName && <div className="mb-2 text-gray-300">Pour : <span className="font-semibold">{userName}</span></div>}
      <GuidanceContent guidance={guidance} />
      <div className="mt-6 text-center text-gray-400 text-sm">Lien sécurisé, valable 24h</div>
    </div>
  );
} 