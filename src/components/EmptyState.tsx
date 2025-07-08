import React from 'react';
import { motion } from 'framer-motion';
import { Star, Sparkles, Moon, Sun } from 'lucide-react';

interface EmptyStateProps {
  type: 'natal' | 'guidance' | 'profile' | 'general';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const emptyStateConfig = {
  natal: {
    icon: <Star className="w-16 h-16 text-primary" />,
    emoji: '🌌',
    defaultTitle: 'Thème Natal Non Disponible',
    defaultMessage: 'Complétez vos informations de naissance pour découvrir votre carte du ciel personnalisée.',
    illustration: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-primary/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border-2 border-secondary/30 rounded-full"
        />
        <div className="absolute inset-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
          <span className="text-3xl">🌟</span>
        </div>
      </div>
    )
  },
  guidance: {
    icon: <Sparkles className="w-16 h-16 text-secondary" />,
    emoji: '✨',
    defaultTitle: 'Aucune Guidance Disponible',
    defaultMessage: 'Votre guidance quotidienne sera bientôt disponible. Les astres préparent quelque chose de spécial pour vous.',
    illustration: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-6xl">✨</span>
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full"
        />
      </div>
    )
  },
  profile: {
    icon: <Sun className="w-16 h-16 text-yellow-400" />,
    emoji: '👤',
    defaultTitle: 'Profil Incomplet',
    defaultMessage: 'Ajoutez vos informations personnelles pour personnaliser votre expérience astrologique.',
    illustration: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full flex items-center justify-center"
        >
          <span className="text-5xl">👤</span>
        </motion.div>
      </div>
    )
  },
  general: {
    icon: <Moon className="w-16 h-16 text-slate-300" />,
    emoji: '🌙',
    defaultTitle: 'Aucune Donnée',
    defaultMessage: 'Les données ne sont pas encore disponibles. Veuillez réessayer plus tard.',
    illustration: (
      <div className="relative w-32 h-32 mx-auto mb-6">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-slate-400/20 to-slate-600/20 rounded-full flex items-center justify-center"
        >
          <span className="text-5xl">🌙</span>
        </motion.div>
      </div>
    )
  }
};

export default function EmptyState({ 
  type, 
  title, 
  message, 
  action, 
  className = '' 
}: EmptyStateProps) {
  const config = emptyStateConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center py-12 px-6 text-center relative ${className}`}
    >
      {/* Illustration animée */}
      {config.illustration}

      {/* Contenu */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="max-w-md"
      >
        <h3 className="text-xl font-cinzel font-bold mb-4 bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
          {title || config.defaultTitle}
        </h3>
        <p className="text-gray-300 mb-6 leading-relaxed">
          {message || config.defaultMessage}
        </p>

        {/* Bouton d'action */}
        {action && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {action.label}
          </motion.button>
        )}
      </motion.div>

      {/* Éléments décoratifs */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-4 right-4 text-primary/20"
      >
        <Star className="w-8 h-8" />
      </motion.div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-4 left-4 text-secondary/20"
      >
        <Sparkles className="w-6 h-6" />
      </motion.div>
    </motion.div>
  );
} 