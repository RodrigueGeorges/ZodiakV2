import React from 'react';
import { motion } from 'framer-motion';
import { useMobile } from '../lib/hooks/useMobile';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function MobileOptimizedCard({ 
  children, 
  className = '', 
  onClick, 
  disabled = false 
}: MobileOptimizedCardProps) {
  const { isMobile } = useMobile();
  
  return (
    <motion.div
      className={`bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border border-primary/20 rounded-xl p-4 md:p-6 shadow-xl backdrop-blur-lg ${className}`}
      whileHover={!disabled ? { scale: isMobile ? 1.02 : 1.05 } : {}}
      whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: onClick ? 'manipulation' : 'auto',
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-disabled={disabled}
    >
      {children}
    </motion.div>
  );
}

export default MobileOptimizedCard;
