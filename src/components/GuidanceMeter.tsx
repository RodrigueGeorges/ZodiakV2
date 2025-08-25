// React import not needed in TSX with jsx runtime
import { motion } from 'framer-motion';

interface GuidanceMeterProps {
  score: number;
  className?: string;
}

export function GuidanceMeter({ score, className = '' }: GuidanceMeterProps) {
  const percentage = Math.min(Math.max(score, 0), 100);
  
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-orange-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getGlowColor = (score: number) => {
    if (score >= 80) return 'shadow-green-500/50';
    if (score >= 60) return 'shadow-yellow-500/50';
    if (score >= 40) return 'shadow-orange-500/50';
    return 'shadow-red-500/50';
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      <div className="w-full bg-cosmic-700 rounded-full h-3 border border-cosmic-600 overflow-hidden">
        <motion.div
          className={`h-3 rounded-full ${getColor(score)} ${getGlowColor(score)} shadow-lg`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">Score</span>
        <span className="text-sm font-semibold text-primary">{score}%</span>
      </div>
    </div>
  );
} 