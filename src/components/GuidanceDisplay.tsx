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

export default function GuidanceDisplay({ guidance, className = '' }: GuidanceDisplayProps) {
  if (!guidance) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <h3 className="text-lg font-semibold text-primary mb-2">Aucune guidance disponible</h3>
        <p className="text-gray-400">Aucune guidance trouvée pour ce lien.</p>
      </div>
    );
  }

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
            <GuidanceScoreBadge score={guidance.love?.score || 0} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {guidance.love?.text || 'Aucune guidance disponible pour l\'amour.'}
          </p>
          <GuidanceMeter score={guidance.love?.score || 0} />
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
            <GuidanceScoreBadge score={guidance.work?.score || 0} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {guidance.work?.text || 'Aucune guidance disponible pour le travail.'}
          </p>
          <GuidanceMeter score={guidance.work?.score || 0} />
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
            <GuidanceScoreBadge score={guidance.energy?.score || 0} />
          </div>
          <p className="text-gray-200 leading-relaxed mb-4">
            {guidance.energy?.text || 'Aucune guidance disponible pour l\'énergie.'}
          </p>
          <GuidanceMeter score={guidance.energy?.score || 0} />
        </motion.div>
      </div>

      {/* Mantra du jour */}
      {guidance.mantra && (
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
              "{guidance.mantra}"
            </p>
          </div>
        </motion.div>
      )}

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
