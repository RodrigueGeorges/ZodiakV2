import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import GuidanceDisplay from '../components/GuidanceDisplay';
import LoadingScreen from '../components/LoadingScreen';
import { motion } from 'framer-motion';

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
      <motion.div 
        className="max-w-lg w-full p-8 bg-cosmic-800 rounded-xl shadow-xl border border-primary/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold font-cinzel mb-4 text-primary">Lien Invalide</h2>
          <p className="text-gray-300 text-lg mb-6">{error}</p>
          <div className="text-gray-400 text-sm">
            <p>Ce lien peut avoir expiré ou être incorrect.</p>
            <p className="mt-2">Contactez-nous si vous pensez qu'il s'agit d'une erreur.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
  
  if (!guidance) return null;

  return (
    <div className="min-h-screen bg-cosmic-900">
      {/* Header avec design cosmique */}
      <div className="relative overflow-hidden">
        {/* Background avec étoiles */}
        <div className="absolute inset-0 bg-gradient-to-b from-cosmic-900 via-cosmic-800 to-cosmic-900">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-1 h-1 bg-secondary rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-40 left-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-500"></div>
            <div className="absolute top-60 right-1/3 w-1 h-1 bg-secondary rounded-full animate-pulse delay-1500"></div>
          </div>
        </div>
        
        {/* Contenu principal */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-primary mb-4">
              🌟 Guidance Astrale
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Message des étoiles pour aujourd'hui
            </p>
            {userName && (
              <p className="text-lg text-secondary font-semibold">
                Pour {userName}
              </p>
            )}
          </motion.div>

          {/* Contenu de la guidance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <GuidanceDisplay guidance={guidance} />
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12 pt-8 border-t border-primary/20"
          >
            <p className="text-gray-400 text-sm">
              ✨ Lien sécurisé • Valable 24h • Généré par l'intelligence des astres
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 