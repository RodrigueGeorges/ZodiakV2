// Constantes de thème pour l'application
export const COLORS = {
  primary: '#00BFFF', // Bleu néon principal
  secondary: '#0080FF', // Bleu secondaire
  background: '#0B1120',
  backgroundGradient: '#1e293b',
  text: {
    primary: '#00BFFF', // Bleu néon pour le texte principal
    secondary: '#0080FF', // Bleu secondaire pour le texte secondaire
  }
} as const;

export const ANIMATIONS = {
  duration: {
    slow: '20s',
    medium: '3s',
    fast: '1.5s',
  },
  timing: {
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'ease-in-out',
  }
} as const;

// Memoized animation styles
export const KEYFRAMES = {
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { 
        filter: drop-shadow(0 0 15px ${COLORS.primary});
        transform: scale(1);
      }
      50% { 
        filter: drop-shadow(0 0 30px ${COLORS.primary});
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
} as const;

export const GRADIENTS = {
  lunarSheen: 'linear-gradient(120deg, #00BFFF 0%, #40B5FF 40%, #0080FF 70%, #E6F7FF 100%)',
  lunarSheenAnimated: 'linear-gradient(120deg, #00BFFF 0%, #40B5FF 40%, #0080FF 70%, #E6F7FF 100%)', // Utilisé avec animation
  glass: 'rgba(24, 28, 40, 0.6)',
};

export const EFFECTS = {
  halo: '0 0 32px 8px rgba(0, 191, 255, 0.5)', // Halo bleu néon
  sheenAnimation: `
    @keyframes sheen {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  twinkle: `
    @keyframes twinkle {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
  `,
};