import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { DateTime } from 'luxon';
import { useGuidance } from '../lib/hooks/useGuidance';
import LoadingScreen from './LoadingScreen';
import EmptyState from './EmptyState';
import InteractiveCard from './InteractiveCard';
import GuidanceScoreBadge from './GuidanceScoreBadge';
import ShareButton from './ShareButton';
import FormattedGuidanceText from './FormattedGuidanceText';
import PageLayout from './PageLayout';
import { getGuidanceText, getGuidanceScore, guidanceScoreConfig, getScoreLevel } from '../lib/utils/guidance';
import { DESIGN_ICONS, DESIGN_CLASSES } from '../lib/constants/design';

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
    <PageLayout 
      title="Guidance du jour"
      subtitle="Vos conseils astrologiques personnalisés"
      maxWidth="4xl"
    >
      <div className="space-y-8">
        {/* Bloc résumé premium, unique, personnalisé */}
        <motion.div variants={itemVariants}>
          <InteractiveCard className="card-premium-glow max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="text-6xl mb-6"
              >
                🔮
              </motion.div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-cinzel text-white drop-shadow-glow text-center mb-4 font-bold leading-tight">
                {guidanceData.summary}
              </h2>
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-sm">Guidance générée par l'IA</span>
                <span className={DESIGN_CLASSES.text.accent}>✨</span>
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
              { key: 'love' as keyof GuidanceData, label: 'Amour & Relations', icon: DESIGN_ICONS.semantic.love, config: guidanceScoreConfig.love },
              { key: 'work' as keyof GuidanceData, label: 'Travail & Carrière', icon: DESIGN_ICONS.semantic.work, config: guidanceScoreConfig.work },
              { key: 'energy' as keyof GuidanceData, label: 'Énergie & Vitalité', icon: DESIGN_ICONS.semantic.energy, config: guidanceScoreConfig.energy },
            ].map(({ key, label, icon, config }, idx) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <InteractiveCard className="card-premium h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={DESIGN_CLASSES.text.primary}>
                      <span className="text-2xl">{icon}</span>
                    </div>
                    <h3 className="font-semibold text-white font-cinzel text-xl">{label}</h3>
                  </div>
                  <div className="flex-1">
                    <FormattedGuidanceText 
                      text={getGuidanceText(guidanceData[key]) || `Aucun conseil ${label.toLowerCase()} disponible pour aujourd'hui.`}
                      className="text-gray-200 leading-relaxed text-base"
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <ShareButton
                      title={`Ma guidance ${label}`}
                      content={getGuidanceText(guidanceData[key])}
                      variant="compact"
                    />
                  </div>
                </InteractiveCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mantra premium */}
        <motion.div variants={itemVariants}>
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="px-6 py-4 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-xl shadow-inner text-lg font-cinzel text-center text-primary animate-pulse-slow">
              {dailyMantra}
            </div>
          </div>
        </motion.div>

        {/* Infos et actions */}
        <motion.div variants={itemVariants} className="flex items-center justify-between text-sm text-gray-400 bg-cosmic-800/80 px-4 py-2 rounded-lg border border-white/10 mt-8">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Dernière mise à jour : {DateTime.fromISO(today).toFormat('dd/MM/yyyy')} à 08:00</span>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={handleRefreshGuidance}
              disabled={isRefreshingManual}
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Actualiser la guidance"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingManual ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </motion.button>
            <ShareButton
              title="Ma Guidance Quotidienne"
              content={`${guidanceData.summary}\n\nAmour: ${getGuidanceText(guidanceData.love)}\nTravail: ${getGuidanceText(guidanceData.work)}\nÉnergie: ${getGuidanceText(guidanceData.energy)}\n\nMantra: \"${dailyMantra}\"`}
              variant="default"
            />
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}

export default GuidanceContent;