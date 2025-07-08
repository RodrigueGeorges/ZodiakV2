import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, RefreshCw, Heart, Briefcase, Battery } from 'lucide-react';
import { DateTime } from 'luxon';
import { useGuidance } from '../lib/hooks/useGuidance';
import LoadingScreen from './LoadingScreen';
import EmptyState from './EmptyState';
import InteractiveCard from './InteractiveCard';
import GuidanceScoreBadge from './GuidanceScoreBadge';
import ShareButton from './ShareButton';
import FormattedGuidanceText from './FormattedGuidanceText';
import StarryBackground from './StarryBackground';
import { getGuidanceText, getGuidanceScore, guidanceScoreConfig, getScoreLevel } from '../lib/utils/guidance';

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

interface GuidanceData {
  summary: string;
  love: { text: string; score: number };
  work: { text: string; score: number };
  energy: { text: string; score: number };
  mantra?: string;
}

function GuidanceContent(): JSX.Element {
  const { guidance, loading, error, refreshGuidance } = useGuidance();
  const [isRefreshingManual, setIsRefreshingManual] = useState(false);

  const today = DateTime.now().toISODate() || '';

  const handleRefreshGuidance = async () => {
    setIsRefreshingManual(true);
    try {
      await refreshGuidance();
    } finally {
      setIsRefreshingManual(false);
    }
  };

  if (loading && !guidance) {
    return <LoadingScreen message="Chargement de votre guidance..." />;
  }

  if (!guidance) {
    return (
      <EmptyState
        type="guidance"
        title="Guidance Non Disponible"
        message="Votre guidance quotidienne sera bientôt disponible. Les astres préparent quelque chose de spécial pour vous."
        action={{
          label: "Actualiser",
          onClick: handleRefreshGuidance
        }}
      />
    );
  }

  const guidanceData = guidance as GuidanceData;
  
  const dailyMantra = guidanceData.mantra || "Je m'ouvre aux belles surprises de l'univers et j'avance avec confiance.";

  return (
    <div className="min-h-screen bg-cosmic-900 relative">
      {/* Fond étoilé animé */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <StarryBackground />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-cosmic-800/40 to-cosmic-900/90" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 container mx-auto px-4 md:px-8 py-8 space-y-8"
      >
        {/* En-tête avec navigation */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold font-cinzel bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                Votre Guidance Quotidienne
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-300 bg-cosmic-800/80 px-3 py-2 rounded-full border border-white/10">
                <Calendar className="w-4 h-4" />
                <span>{DateTime.fromISO(today).toFormat('dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleRefreshGuidance}
              disabled={isRefreshingManual}
              className="flex items-center gap-2 px-4 py-2 bg-cosmic-800/80 border border-primary/30 rounded-lg hover:bg-cosmic-800 transition-all duration-200 text-gray-300 hover:text-primary disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Actualiser la guidance"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingManual ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </motion.button>
            
            <ShareButton
              title="Ma Guidance Quotidienne"
              content={`${guidanceData.summary}\n\nAmour: ${getGuidanceText(guidanceData.love)}\nTravail: ${getGuidanceText(guidanceData.work)}\nÉnergie: ${getGuidanceText(guidanceData.energy)}\n\nMantra: "${dailyMantra}"`}
              variant="default"
            />
          </div>
        </motion.div>

        {/* Informations de mise à jour */}
        <motion.div variants={itemVariants} className="flex items-center justify-between text-sm text-gray-400 bg-cosmic-800/50 px-4 py-2 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Dernière mise à jour : {DateTime.fromISO(today).toFormat('dd/MM/yyyy')} à 08:00</span>
          </div>
        </motion.div>

        {/* Résumé général - carte centrale immersive */}
        <motion.div variants={itemVariants}>
          <InteractiveCard className="relative bg-gradient-to-br from-primary/90 to-secondary/80 border-primary/40 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-6xl mb-6"
              >
                🔮
              </motion.div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-cinzel text-white drop-shadow-glow text-center mb-4 font-bold leading-tight">
                {guidanceData.summary}
              </h2>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-sm">Guidance générée par l'IA</span>
                <span className="text-xs">✨</span>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Scores de guidance avec badges modernes */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <GuidanceScoreBadge type="love" score={getGuidanceScore(guidanceData.love)} />
            <GuidanceScoreBadge type="work" score={getGuidanceScore(guidanceData.work)} />
            <GuidanceScoreBadge type="energy" score={getGuidanceScore(guidanceData.energy)} />
          </div>
        </motion.div>

        {/* Conseils détaillés */}
        <motion.div variants={itemVariants}>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { key: 'love' as keyof GuidanceData, label: 'Amour & Relations', icon: <Heart className="w-8 h-8" />, config: guidanceScoreConfig.love },
              { key: 'work' as keyof GuidanceData, label: 'Travail & Carrière', icon: <Briefcase className="w-8 h-8" />, config: guidanceScoreConfig.work },
              { key: 'energy' as keyof GuidanceData, label: 'Énergie & Vitalité', icon: <Battery className="w-8 h-8" />, config: guidanceScoreConfig.energy },
            ].map(({ key, label, icon, config }, idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <InteractiveCard className={`relative bg-gradient-to-br ${config.colors[getScoreLevel(getGuidanceScore(guidanceData[key]))]} shadow-xl rounded-2xl p-6 h-full flex flex-col`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-primary">
                      {icon}
                    </div>
                    <h3 className="font-semibold text-white font-cinzel text-xl">{label}</h3>
                  </div>
                  
                  <div className="flex-1">
                    <FormattedGuidanceText 
                      text={getGuidanceText(guidanceData[key]) || `Aucun conseil ${label.toLowerCase()} disponible pour aujourd'hui.`}
                      className="text-gray-200 leading-relaxed text-base"
                    />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <ShareButton
                      title={`Guidance ${label}`}
                      content={`${label} : ${getGuidanceText(guidanceData[key])}`}
                      variant="compact"
                      className="w-full justify-center"
                    />
                  </div>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mantra du jour */}
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <InteractiveCard className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-yellow-500/30 shadow-xl rounded-2xl p-8 flex flex-col items-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl mb-4"
            >
              🧘‍♂️
            </motion.div>
            <h3 className="font-semibold text-white mb-4 font-cinzel text-xl">Mantra du Jour</h3>
            <blockquote className="text-gray-900 italic text-lg md:text-xl text-center font-medium leading-relaxed">
              "{dailyMantra}"
            </blockquote>
            <div className="mt-4 flex items-center gap-2">
              <ShareButton
                title="Mantra du Jour"
                content={`Mantra du jour : "${dailyMantra}"`}
                variant="compact"
              />
            </div>
          </InteractiveCard>
        </motion.div>

        {/* Section d'aide et informations */}
        <motion.div variants={itemVariants} className="text-center text-sm text-gray-400 space-y-2">
          <p>Votre guidance est générée automatiquement chaque jour à 08:00</p>
          <p>Basée sur votre thème natal et les transits planétaires actuels</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default GuidanceContent;