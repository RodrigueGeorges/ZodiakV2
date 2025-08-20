import React from 'react';
import { motion } from 'framer-motion';
import { GuidanceMeter } from './GuidanceMeter';
import { GuidanceScoreBadge } from './GuidanceScoreBadge';

interface GuidanceDisplayProps {
  guidance: any;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Fonction pour nettoyer et parser les données JSON dans le texte
const parseGuidanceText = (text: string) => {
  if (!text) return { text: '', score: 0 };
  
  try {
    // Essayer de parser le JSON complet
    const parsed = JSON.parse(text);
    return {
      text: parsed.text || text,
      score: parsed.score || 0
    };
  } catch (e) {
    // Si ce n'est pas du JSON valide, chercher des patterns JSON dans le texte
    const jsonMatch = text.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || text.replace(jsonMatch[0], '').trim(),
          score: parsed.score || 0
        };
      } catch (e2) {
        // Si tout échoue, retourner le texte original
        return { text: text, score: 0 };
      }
    }
    return { text: text, score: 0 };
  }
};

export default function GuidanceDisplay({ guidance, className = '' }: GuidanceDisplayProps) {
  if (!guidance) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <h3 className="text-lg font-semibold text-primary mb-2">Aucune guidance disponible</h3>
        <p className="text-gray-400">Aucune guidance trouvée pour ce lien.</p>
      </div>
    );
  }

  // Parser les données pour chaque section
  const loveData = parseGuidanceText(guidance.love);
  const workData = parseGuidanceText(guidance.work);
  const energyData = parseGuidanceText(guidance.energy);

  return (
    <motion.div
      className={`space-y-8 ${className}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.15
          }
        }
      }}
    >
      {/* Résumé général */}
      <motion.div 
        variants={itemVariants} 
        className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 rounded-2xl p-8 border border-primary/20 shadow-cosmic backdrop-blur-sm"
      >
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-2xl font-bold font-cinzel text-primary">Résumé du Jour</h3>
        </div>
        <p className="text-gray-200 leading-relaxed text-lg">
          {guidance.summary}
        </p>
      </motion.div>

      {/* Sections détaillées */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Amour */}
        <motion.div 
          variants={itemVariants} 
          className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 rounded-2xl p-6 border border-primary/20 shadow-cosmic backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💖</span>
              <h3 className="text-xl font-bold font-cinzel text-primary">Amour</h3>
            </div>
            <GuidanceScoreBadge score={loveData.score} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {loveData.text || 'Aucune guidance disponible pour l\'amour.'}
          </p>
          <GuidanceMeter score={loveData.score} />
        </motion.div>

        {/* Travail */}
        <motion.div 
          variants={itemVariants} 
          className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 rounded-2xl p-6 border border-primary/20 shadow-cosmic backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💼</span>
              <h3 className="text-xl font-bold font-cinzel text-primary">Travail</h3>
            </div>
            <GuidanceScoreBadge score={workData.score} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {workData.text || 'Aucune guidance disponible pour le travail.'}
          </p>
          <GuidanceMeter score={workData.score} />
        </motion.div>

        {/* Énergie */}
        <motion.div 
          variants={itemVariants} 
          className="bg-gradient-to-br from-cosmic-800 to-cosmic-700 rounded-2xl p-6 border border-primary/20 shadow-cosmic backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              <h3 className="text-xl font-bold font-cinzel text-primary">Énergie</h3>
            </div>
            <GuidanceScoreBadge score={energyData.score} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {energyData.text || 'Aucune guidance disponible pour l\'énergie.'}
          </p>
          <GuidanceMeter score={energyData.score} />
        </motion.div>
      </div>

      {/* Mantra du jour */}
      <motion.div 
        variants={itemVariants} 
        className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-primary/30 text-center shadow-cosmic backdrop-blur-sm"
      >
        <div className="flex items-center justify-center mb-4">
          <span className="text-3xl mr-3">🌟</span>
          <h3 className="text-2xl font-bold font-cinzel text-primary">Mantra du Jour</h3>
          <span className="text-3xl ml-3">🌟</span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent rounded-lg"></div>
          <p className="text-gray-100 italic text-xl font-medium relative z-10 leading-relaxed">
            "{guidance.mantra || 'Les étoiles vous guident vers votre destinée...'}"
          </p>
        </div>
      </motion.div>

      {/* Message d'encouragement */}
      <motion.div 
        variants={itemVariants} 
        className="text-center py-6"
      >
        <p className="text-gray-400 text-sm">
          🌟 Que les étoiles vous guident dans votre journée 🌟
        </p>
      </motion.div>
    </motion.div>
  );
}
