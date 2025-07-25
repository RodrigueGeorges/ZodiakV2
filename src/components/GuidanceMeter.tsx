import React from 'react';
import { motion } from 'framer-motion';

interface GuidanceMeterProps {
  score: number;
  className?: string;
}

export function GuidanceMeter({ score, className = '' }: GuidanceMeterProps) {
  const percentage = Math.min(Math.max(score, 0), 100);
  
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
      <div className="w-full bg-cosmic-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${getColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <div className="text-right text-xs text-gray-400 mt-1">
        {score}%
      </div>
    </div>
  );
} 