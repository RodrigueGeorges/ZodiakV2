import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EFFECTS, GRADIENTS } from './constants/theme';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  tabIndex?: number;
  'aria-label'?: string;
}

function InteractiveCard({ children, className = '', onClick, tabIndex, 'aria-label': ariaLabel }: InteractiveCardProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Configuration d'animation optimisée pour mobile
  const animationConfig = isMobile ? {
    duration: 0.3,
    ease: "easeOut"
  } : {
    type: 'spring',
    stiffness: 260,
    damping: 20
  };

  return (
    <motion.div
      className={`relative bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border border-primary/20 shadow-xl rounded-xl overflow-hidden mobile-optimized text-primary backdrop-blur-lg bg-opacity-60 ${className}`}
      style={{
        boxShadow: EFFECTS.halo,
        background: GRADIENTS.glass,
        WebkitTapHighlightColor: 'transparent',
        touchAction: onClick ? 'manipulation' : 'auto',
      }}
      whileHover={{ scale: onClick && !isMobile ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animationConfig}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default React.memo(InteractiveCard);