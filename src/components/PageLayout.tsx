import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';
import StarryBackground from './StarryBackground';

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
          {showLogo && <Logo className="page-header-logo" />}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
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