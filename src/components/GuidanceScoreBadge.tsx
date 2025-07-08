import React from 'react';
import { motion } from 'framer-motion';
import { guidanceScoreConfig, getScoreLevel, getScoreEmoji } from '../lib/utils/guidance';

interface GuidanceScoreBadgeProps {
  type: 'love' | 'work' | 'energy';
  score: number;
  className?: string;
}

export default function GuidanceScoreBadge({ type, score, className = '' }: GuidanceScoreBadgeProps) {
  const config = guidanceScoreConfig[type];
  const level = getScoreLevel(score);
  const colorClass = config.badgeColors[level];
  const emoji = getScoreEmoji(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${colorClass} shadow-lg border border-white/20 ${className}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-lg">{config.icon}</span>
        <span className="font-semibold text-sm">{config.label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg">{emoji}</span>
        <span className="font-bold text-sm">{score}%</span>
      </div>
      <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-white rounded-full"
        />
      </div>
    </motion.div>
  );
} 