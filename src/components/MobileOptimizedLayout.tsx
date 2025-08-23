import React from 'react';
import { motion } from 'framer-motion';
import StarryBackground from './StarryBackground';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
}

export function MobileOptimizedLayout({ 
  children, 
  className = '', 
  showBackground = true 
}: MobileOptimizedLayoutProps) {
  return (
    <div className={`min-h-screen bg-cosmic-900 relative safe-area-inset-top ${className}`}>
      {/* Fond étoilé animé */}
      {showBackground && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <StarryBackground />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-cosmic-800/40 to-cosmic-900/90" />
        </div>
      )}

      {/* Contenu optimisé pour mobile */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 py-2 md:py-8 safe-area-inset-bottom pb-20 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default MobileOptimizedLayout;
