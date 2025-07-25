import React from 'react';
import { motion } from 'framer-motion';
import { guidanceScoreConfig, getScoreLevel, getScoreEmoji } from '../lib/utils/guidance';

interface GuidanceScoreBadgeProps {
  score: number;
  className?: string;
}

export function GuidanceScoreBadge({ score, className = '' }: GuidanceScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (score >= 40) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getScoreColor(score)} ${className}`}>
      {score}%
    </span>
  );
} 