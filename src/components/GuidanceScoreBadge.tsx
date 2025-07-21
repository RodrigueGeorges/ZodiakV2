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
  const emoji = getScoreEmoji(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-4 px-5 py-2 rounded-full bg-gradient-to-r from-[#C9B37E] to-[#A68A4A] shadow-xl border border-white/20 min-w-[220px] ${className}`}
      style={{ boxShadow: '0 4px 24px 0 rgba(201,179,126,0.25)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl drop-shadow-sm">{config.icon}</span>
        <span className="font-semibold text-white text-base drop-shadow-md tracking-wide" style={{textShadow:'0 1px 4px #0008'}}>{config.label}</span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <span className="text-xl">{emoji}</span>
        <span className="font-extrabold text-lg" style={{color:'#FFD700', textShadow:'0 1px 6px #FFD70088'}}>{score}%</span>
      </div>
      <div className="flex-1 mx-3">
        <div className="relative w-full h-2 bg-[#7A6A3A] rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute top-0 left-0 h-2 rounded-full"
            style={{
              width: `${score}%`,
              background: 'linear-gradient(90deg, #FFD700 0%, #FFB300 100%)',
              boxShadow: '0 0 8px #FFD700, 0 0 2px #fff',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
} 