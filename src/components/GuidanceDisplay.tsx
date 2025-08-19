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
