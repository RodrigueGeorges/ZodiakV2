// ATTENTION: NE PAS MODIFIER CE FICHIER
// Ces constantes définissent l'identité visuelle de l'application

import { Sun, Moon, Compass, Clock, Heart, Briefcase, Battery, Sparkle, User, MessageSquare } from 'lucide-react';

/**
 * Système de couleurs cohérent pour toute l'application
 */
export const DESIGN_COLORS = {
  // Couleurs principales
  primary: '#D8CAB8', // Silver Gold
  secondary: '#FF69B4', // Rose
  cosmic: {
    800: '#1a1a2e',
    900: '#16213e'
  },
  
  // Couleurs d'accent cohérentes
  accent: {
    gold: '#D8CAB8', // Silver Gold
    yellow: '#D8CAB8', // Silver Gold
    pink: '#FF69B4', // Même que secondary
    white: '#FFFFFF',
    gray: {
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280'
    }
  },
  
  // Couleurs sémantiques (pour les scores, états, etc.)
  semantic: {
    success: '#10B981', // Vert
    warning: '#F59E0B', // Orange
    error: '#EF4444', // Rouge
    info: '#3B82F6' // Bleu
  }
};

/**
 * Système d'icônes cohérent
 */
export const DESIGN_ICONS = {
  // Icônes principales (Lucide)
  primary: {
    sun: Sun,
    moon: Moon,
    compass: Compass,
    clock: Clock,
    heart: Heart,
    briefcase: Briefcase,
    battery: Battery,
    sparkle: Sparkle,
    user: User,
    messageSquare: MessageSquare
  },
  
  // Icônes sémantiques (Emojis pour les scores)
  semantic: {
    love: '💕',
    work: '💼', 
    energy: '⚡',
    success: '🌟',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  }
};

/**
 * Configuration des scores avec couleurs cohérentes
 */
export const SCORE_CONFIG = {
  love: {
    icon: DESIGN_ICONS.semantic.love,
    label: 'Amour',
    colors: {
      low: `from-${DESIGN_COLORS.semantic.error}/20 to-${DESIGN_COLORS.semantic.error}/20 border-${DESIGN_COLORS.semantic.error}/30`,
      medium: `from-${DESIGN_COLORS.secondary}/20 to-${DESIGN_COLORS.secondary}/20 border-${DESIGN_COLORS.secondary}/30`,
      high: `from-${DESIGN_COLORS.primary}/20 to-${DESIGN_COLORS.primary}/20 border-${DESIGN_COLORS.primary}/30`
    },
    badgeColors: {
      low: `from-${DESIGN_COLORS.semantic.error} to-${DESIGN_COLORS.semantic.error} text-white`,
      medium: `from-${DESIGN_COLORS.secondary} to-${DESIGN_COLORS.secondary} text-white`,
      high: `from-${DESIGN_COLORS.primary} to-${DESIGN_COLORS.primary} text-black`
    }
  },
  work: {
    icon: DESIGN_ICONS.semantic.work,
    label: 'Travail',
    colors: {
      low: `from-${DESIGN_COLORS.semantic.error}/20 to-${DESIGN_COLORS.semantic.error}/20 border-${DESIGN_COLORS.semantic.error}/30`,
      medium: `from-${DESIGN_COLORS.semantic.info}/20 to-${DESIGN_COLORS.semantic.info}/20 border-${DESIGN_COLORS.semantic.info}/30`,
      high: `from-${DESIGN_COLORS.semantic.success}/20 to-${DESIGN_COLORS.semantic.success}/20 border-${DESIGN_COLORS.semantic.success}/30`
    },
    badgeColors: {
      low: `from-${DESIGN_COLORS.semantic.error} to-${DESIGN_COLORS.semantic.error} text-white`,
      medium: `from-${DESIGN_COLORS.semantic.info} to-${DESIGN_COLORS.semantic.info} text-white`,
      high: `from-${DESIGN_COLORS.semantic.success} to-${DESIGN_COLORS.semantic.success} text-white`
    }
  },
  energy: {
    icon: DESIGN_ICONS.semantic.energy,
    label: 'Énergie',
    colors: {
      low: `from-${DESIGN_COLORS.semantic.error}/20 to-${DESIGN_COLORS.semantic.error}/20 border-${DESIGN_COLORS.semantic.error}/30`,
      medium: `from-${DESIGN_COLORS.semantic.warning}/20 to-${DESIGN_COLORS.semantic.warning}/20 border-${DESIGN_COLORS.semantic.warning}/30`,
      high: `from-${DESIGN_COLORS.semantic.success}/20 to-${DESIGN_COLORS.semantic.success}/20 border-${DESIGN_COLORS.semantic.success}/30`
    },
    badgeColors: {
      low: `from-${DESIGN_COLORS.semantic.error} to-${DESIGN_COLORS.semantic.error} text-white`,
      medium: `from-${DESIGN_COLORS.semantic.warning} to-${DESIGN_COLORS.semantic.warning} text-white`,
      high: `from-${DESIGN_COLORS.semantic.success} to-${DESIGN_COLORS.semantic.success} text-white`
    }
  }
};

/**
 * Classes CSS cohérentes
 */
export const DESIGN_CLASSES = {
  // Couleurs de texte
  text: {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-[#D8CAB8]',
    white: 'text-white',
    gray: 'text-gray-300'
  },
  
  // Couleurs de fond
  bg: {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    cosmic: 'bg-cosmic-900',
    cosmicLight: 'bg-cosmic-800'
  },
  
  // Gradients
  gradient: {
    primary: 'bg-gradient-to-r from-primary to-secondary',
    primaryVia: 'bg-gradient-to-r from-primary via-secondary to-primary',
    cosmic: 'bg-gradient-to-br from-cosmic-800 to-cosmic-900'
  }
};

export const DESIGN_TOKENS = {
  // Couleurs principales
  colors: {
    primary: '#D4A373',
    secondary: '#D4A373',
    cosmic: {
      900: '#0B1120',
      800: '#1a1f2e',
      700: '#2a2f3e',
      600: '#3a3f4e',
      500: '#4a4f5e',
    }
  },

  // Typographie
  fonts: {
    cinzel: 'Cinzel',
    montserrat: 'Montserrat',
    openSans: 'Open Sans',
  },

  // Animations
  animations: {
    duration: {
      slow: '20s',
      medium: '3s',
      fast: '1.5s',
    },
    timing: {
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'ease-in-out',
    },
    keyframes: {
      float: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `,
      glow: `
        @keyframes glow {
          0%, 100% { 
            filter: drop-shadow(0 0 15px #D4A373);
            transform: scale(1);
          }
          50% { 
            filter: drop-shadow(0 0 30px #D4A373);
            transform: scale(1.1);
          }
        }
      `,
      spinSlow: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `,
      reverseSpin: `
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `,
      cosmicPulse: `
        @keyframes cosmic-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `,
    },
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    pulse: 'animate-pulse',
    cosmic: 'animate-cosmic-text'
  },

  // Composants de base
  components: {
    card: {
      background: 'bg-white/5',
      backdropBlur: 'backdrop-blur-lg',
      border: 'border border-white/10',
      rounded: 'rounded-lg',
      shadow: 'shadow-xl',
      base: 'bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 rounded-2xl shadow-lg border border-primary/10 p-6',
      interactive: 'bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 rounded-2xl shadow-lg border border-primary/10 p-6 hover:border-primary/30 transition-all duration-200 cursor-pointer'
    },
    button: {
      base: [
        'px-4 py-2 rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ].join(' '),
      primary: 'px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg',
      secondary: 'px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20',
      ghost: 'px-6 py-3 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200'
    },
    input: {
      base: 'w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all duration-200',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500/50'
    }
  },

  // Effets visuels
  effects: {
    gradients: {
      primary: 'bg-gradient-to-r from-primary to-secondary',
      cosmic: 'bg-gradient-to-br from-cosmic-800 to-cosmic-900',
      glass: 'bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm'
    },
    text: {
      gradient: 'text-transparent bg-clip-text',
      cosmic: 'animate-cosmic-text',
    }
  }
} as const;

export type DesignToken = typeof DESIGN_TOKENS[keyof typeof DESIGN_TOKENS];

// Fonction utilitaire pour accéder aux tokens de design
export function getDesignToken(path: string): string {
  return path.split('.').reduce((obj, key) => (obj as Record<string, unknown>)[key], DESIGN_TOKENS as Record<string, unknown>) as string;
}