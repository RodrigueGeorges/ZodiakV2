import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import StarryBackground from './StarryBackground';
import { GRADIENTS, EFFECTS } from './constants/theme';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showLogo?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

export default function PageLayout({ 
  title, 
  subtitle, 
  children, 
  showLogo = true,
  maxWidth = '4xl',
  className = ''
}: PageLayoutProps) {
  return (
    <div className="page-container">
      {/* Fond étoilé animé */}
      <div className="page-background">
        <StarryBackground />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-cosmic-800/40 to-cosmic-900/90" />
      </div>

      <div className={`page-content ${maxWidthClasses[maxWidth]} ${className}`}>
        {/* Header premium harmonisé */}
        <motion.div 
          className="page-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {showLogo && <Logo size="md" className="page-header-logo" style={{ filter: 'drop-shadow(' + EFFECTS.halo + ')' }} />}
          <h1
            className="page-title text-primary bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text"
            style={{
              background: GRADIENTS.lunarSheenAnimated,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              animation: 'sheen 3s linear infinite',
              backgroundSize: '200% auto',
            }}
          >
            {title}
          </h1>
          {subtitle && <p className="page-subtitle text-primary/80">{subtitle}</p>}
        </motion.div>

        {/* Contenu de la page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 