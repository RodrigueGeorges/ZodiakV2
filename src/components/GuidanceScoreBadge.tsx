import React from 'react';
import { motion } from 'framer-motion';

interface GuidanceScoreBadgeProps {
  score: number;
  className?: string;
}

export function GuidanceScoreBadge({ score, className = '' }: GuidanceScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 border-green-400/40 shadow-green-500/20';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-300 border-yellow-400/40 shadow-yellow-500/20';
    if (score >= 40) return 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 border-orange-400/40 shadow-orange-500/20';
    return 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-red-400/40 shadow-red-500/20';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '✨';
    if (score >= 40) return '⭐';
    return '💫';
  };

  return (
    <motion.span 
      className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 shadow-lg backdrop-blur-sm ${getScoreColor(score)} ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="mr-1">{getScoreEmoji(score)}</span>
      {score}%
    </motion.span>
  );
} 