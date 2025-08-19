import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGuidance } from '../lib/hooks/useGuidance';
import { GuidanceMeter } from './GuidanceMeter';
import { GuidanceScoreBadge } from './GuidanceScoreBadge';
import { ButtonZodiak } from './ButtonZodiak';
import ShareButton from './ShareButton';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface GuidanceContentProps {
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function GuidanceContent({ className = '' }: GuidanceContentProps) {
  const { guidance, loading, error, generateGuidance, refreshGuidance } = useGuidance();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateGuidance = async () => {
    setIsGenerating(true);
    try {
      await generateGuidance();
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshGuidance();
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement de votre guidance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-500 mb-2">Erreur</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <ButtonZodiak
          onClick={handleGenerateGuidance}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? 'Génération...' : 'Réessayer'}
        </ButtonZodiak>
      </div>
    );
  }

  if (!guidance) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <h3 className="text-lg font-semibold text-primary mb-2">Aucune guidance disponible</h3>
        <p className="text-gray-400 mb-4">
          Générez votre première guidance quotidienne personnalisée
        </p>
        <ButtonZodiak
          onClick={handleGenerateGuidance}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? 'Génération...' : 'Générer ma guidance'}
        </ButtonZodiak>
      </div>
    );
  }

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {/* Header avec boutons d'action */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">Guidance du Jour</h2>
          <p className="text-gray-400">Conseils personnalisés selon les astres</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <ShareButton 
            title="Guidance du Jour"
            content={`${guidance.summary}\n\n💖 Amour: ${guidance.love.text}\n💼 Travail: ${guidance.work.text}\n⚡ Énergie: ${guidance.energy.text}`}
            url={window.location.href}
          />
        </div>
      </motion.div>

      {/* Résumé général */}
      <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-6 border border-primary/20 shadow-cosmic">
        <h3 className="text-lg font-semibold text-primary mb-3">Résumé du Jour</h3>
        <p className="text-gray-300 leading-relaxed">
          {guidance.summary}
        </p>
      </motion.div>

      {/* Sections détaillées */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Amour */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-6 border border-primary/20 shadow-cosmic">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-primary">💖 Amour</h3>
            <GuidanceScoreBadge score={guidance.love.score} />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {guidance.love.text}
          </p>
          <GuidanceMeter score={guidance.love.score} />
        </motion.div>

        {/* Travail */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-6 border border-primary/20 shadow-cosmic">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-primary">💼 Travail</h3>
            <GuidanceScoreBadge score={guidance.work.score} />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {guidance.work.text}
          </p>
          <GuidanceMeter score={guidance.work.score} />
        </motion.div>

        {/* Énergie */}
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-6 border border-primary/20 shadow-cosmic">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-primary">⚡ Énergie</h3>
            <GuidanceScoreBadge score={guidance.energy.score} />
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {guidance.energy.text}
          </p>
          <GuidanceMeter score={guidance.energy.score} />
        </motion.div>
      </div>

      {/* Mantra du jour */}
      {guidance.mantra && (
        <motion.div variants={itemVariants} className="bg-cosmic-800 rounded-lg p-6 border border-primary/30 text-center shadow-cosmic">
          <h3 className="text-lg font-semibold text-primary mb-2">🌟 Mantra du Jour</h3>
          <p className="text-gray-300 italic text-lg">
            "{guidance.mantra}"
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}