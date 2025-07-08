import { useState, useEffect } from 'react';
import { Heart, Briefcase, Battery } from 'lucide-react';
import { DateTime } from 'luxon';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/hooks/useAuth';
import { useGuidance } from '../lib/hooks/useGuidance';
import LoadingScreen from './LoadingScreen';
import InteractiveCard from './InteractiveCard';
import FormattedGuidanceText from './FormattedGuidanceText';
import ShareModal from './ShareModal';
import { cn } from '../lib/utils';
import type { Json } from '../lib/types/supabase';
import type { JSX } from 'react';
import { motion } from 'framer-motion';
import StarryBackground from './StarryBackground';

const getGuidanceText = (field: Json): string => {
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'object' && field !== null && 'text' in field && typeof (field as { text: string }).text === 'string') {
    return (field as { text: string }).text;
  }
  return '';
};

const getGuidanceScore = (field: Json): number => {
  if (typeof field === 'object' && field !== null && 'score' in field && typeof (field as { score: number }).score === 'number') {
    return (field as { score: number }).score;
  }
  return 75; // Score par défaut
};

// Mantras/citations inspirantes (peuvent être enrichis)
const MANTRAS = [
  "Chaque jour est une nouvelle aventure cosmique.",
  "Fais confiance à l'univers, il conspire en ta faveur.",
  "Ta lumière intérieure est ta meilleure boussole.",
  "Aujourd'hui, accueille le changement avec sérénité.",
  "L'énergie du jour t'invite à rayonner !"
];
function getRandomMantra() {
  return MANTRAS[Math.floor(Math.random() * MANTRAS.length)];
}

// Ajout d'une fonction utilitaire pour transformer le score en label, couleur, emoji
function getScoreLevel(score: number) {
  if (score >= 80) return { label: 'Excellente énergie', color: 'bg-green-600/80 text-white', emoji: '🌟' };
  if (score >= 60) return { label: 'Bonne tendance', color: 'bg-yellow-500/80 text-black', emoji: '✨' };
  if (score >= 40) return { label: 'À surveiller', color: 'bg-orange-500/80 text-black', emoji: '🟠' };
  return { label: 'Attention', color: 'bg-red-600/80 text-white', emoji: '🔴' };
}

// Définir GuidanceData pour l'accès dynamique
interface GuidanceData {
  summary: string;
  love: { text: string; score: number };
  work: { text: string; score: number };
  energy: { text: string; score: number };
}

function GuidanceContent(): JSX.Element {
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  // Utiliser le nouveau hook optimisé
  const { guidance, loading, generateGuidance, refreshGuidance } = useGuidance();

  const today = DateTime.now().toISODate();

  useEffect(() => {
    if (!loading && !guidance && user?.id) {
      // Génère automatiquement la guidance du jour si elle n'existe pas
      generateGuidance();
    }
  }, [loading, guidance, user?.id, generateGuidance]);

  const handleRefreshGuidance = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour actualiser la guidance');
      return;
    }

    try {
      await refreshGuidance();
      toast.success('Guidance actualisée !');
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '✨';
    return '💫';
  };

  if (loading) {
    return <LoadingScreen message="Chargement de votre guidance..." />;
  }

  if (!guidance) {
    return <div className="text-red-400 text-center mt-8">Aucune guidance disponible pour aujourd'hui.</div>;
  }

  // Affichage automatique de la guidance du jour si elle existe
  if (guidance) {
    const guidanceData = guidance as GuidanceData;
    return (
      <div className="relative">
        {/* Fond étoilé animé */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <StarryBackground />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-cosmic-800/40 to-cosmic-900/90" />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-6 relative z-10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold font-cinzel bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Votre Guidance</h2>
              <span className="text-sm text-gray-300 bg-cosmic-800 px-2 py-1 rounded border border-white/10">
                {DateTime.fromISO(today).toFormat('dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleRefreshGuidance}
                className="px-3 py-1 text-gray-300 hover:text-primary transition-colors text-sm relative overflow-hidden"
                title="Actualiser"
                whileTap={{ scale: 0.95 }}
                animate={loading ? { boxShadow: '0 0 16px 4px #F5CBA7' } : {}}
              >
                🔄 Actualiser
              </motion.button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-black rounded-lg hover:opacity-90 transition-all duration-200 text-sm font-semibold shadow-lg"
              >
                Partager
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-400 text-right mb-2">
            Dernière guidance reçue le {DateTime.fromISO(today).toFormat('dd/MM/yyyy')} à 08:00
          </div>
          {/* Résumé général - carte centrale immersive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <InteractiveCard className="relative bg-gradient-to-br from-primary/80 to-secondary/80 border-primary/30 shadow-2xl rounded-3xl p-8 overflow-hidden animate-fade-in flex flex-col items-center">
              <div className="text-4xl mb-2">🌠</div>
              <div className="text-2xl md:text-3xl font-cinzel text-primary drop-shadow-glow text-center mb-2">
                {guidanceData.summary}
              </div>
            </InteractiveCard>
          </motion.div>
          {/* Conseils détaillés */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: 'love', label: 'Amour', icon: <Heart className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" /> },
              { key: 'work', label: 'Travail', icon: <Briefcase className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" /> },
              { key: 'energy', label: 'Énergie', icon: <Battery className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" /> },
            ].map(({ key, label, icon }, idx) => {
              const score = getGuidanceScore(guidanceData[key]);
              const { label: level, color, emoji } = getScoreLevel(score);
              return (
                <motion.div key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 + idx * 0.1 }}>
                  <InteractiveCard className="relative bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/10 shadow-xl rounded-2xl p-6 flex flex-col gap-2">
                    <div className="flex items-center gap-3 mb-2">
                      {icon}
                      <h3 className="font-semibold text-white font-cinzel text-lg">{label}</h3>
                      <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold shadow-md ${color} flex items-center gap-1`}>
                        {emoji} {level}
                      </span>
                    </div>
                    <FormattedGuidanceText text={getGuidanceText(guidanceData[key]) || `Aucun conseil ${label.toLowerCase()} disponible.`} />
                  </InteractiveCard>
                </motion.div>
              );
            })}
          </div>
          {/* Mantra du jour (pas guidance.mantra, utiliser un fallback inspirant) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
            <InteractiveCard className="bg-gradient-to-br from-yellow-400/30 to-orange-400/20 border-yellow-500/20 shadow-xl rounded-2xl p-6 flex flex-col items-center animate-glow">
              <div className="text-3xl mb-2">🧘‍♂️</div>
              <h3 className="font-semibold text-white mb-2 font-cinzel">Mantra du Jour</h3>
              <p className="text-gray-900 italic text-lg text-center font-medium">“{getRandomMantra()}”</p>
            </InteractiveCard>
          </motion.div>
          {/* Modal de partage */}
          <ShareModal open={showShareModal} onClose={() => setShowShareModal(false)} guidance={guidance} />
        </motion.div>
      </div>
    );
  }

  // Affichage si pas de guidance (première visite)
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-6xl">✨</div>
        <h2 className="text-2xl font-bold font-cinzel bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">Bienvenue dans votre Guidance</h2>
        <p className="text-gray-300 max-w-md mx-auto">
          Votre guidance personnalisée est en cours de génération...
        </p>
      </div>
      <div className="flex justify-center">
        <LoadingScreen message="Génération de votre guidance..." />
      </div>
      <div className="text-center text-sm text-gray-400">
        La guidance est générée automatiquement dès que votre profil est complet.
      </div>
    </div>
  );
}

export default GuidanceContent;