/**
 * Extrait le texte de guidance d'un champ JSON
 */
export const getGuidanceText = (field: any): string => {
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field && 'text' in field) {
    const obj = field as { text: string };
    return obj.text || '';
  }
  return '';
};

/**
 * Extrait le score de guidance d'un champ JSON
 */
export const getGuidanceScore = (field: any): number => {
  if (typeof field === 'object' && field && 'score' in field) {
    const obj = field as { score: number };
    return obj.score || 75;
  }
  return 75;
};

/**
 * Configuration des scores de guidance
 */
export const guidanceScoreConfig = {
  love: {
    icon: '💕',
    label: 'Amour',
    colors: {
      low: 'from-red-500/20 to-red-600/20 border-red-500/30',
      medium: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
      high: 'from-pink-400/20 to-pink-500/20 border-pink-400/30'
    },
    badgeColors: {
      low: 'from-red-500 to-red-600 text-red-100',
      medium: 'from-pink-500 to-pink-600 text-pink-100',
      high: 'from-pink-400 to-pink-500 text-pink-100'
    }
  },
  work: {
    icon: '💼',
    label: 'Travail',
    colors: {
      low: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      medium: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      high: 'from-green-500/20 to-green-600/20 border-green-500/30'
    },
    badgeColors: {
      low: 'from-gray-500 to-gray-600 text-gray-100',
      medium: 'from-blue-500 to-blue-600 text-blue-100',
      high: 'from-green-500 to-green-600 text-green-100'
    }
  },
  energy: {
    icon: '⚡',
    label: 'Énergie',
    colors: {
      low: 'from-red-500/20 to-red-600/20 border-red-500/30',
      medium: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      high: 'from-green-500/20 to-green-600/20 border-green-500/30'
    },
    badgeColors: {
      low: 'from-red-500 to-red-600 text-red-100',
      medium: 'from-yellow-500 to-yellow-600 text-yellow-100',
      high: 'from-green-500 to-green-600 text-green-100'
    }
  }
};

/**
 * Détermine le niveau d'un score
 */
export const getScoreLevel = (score: number): 'low' | 'medium' | 'high' => {
  if (score < 40) return 'low';
  if (score < 70) return 'medium';
  return 'high';
};

/**
 * Retourne l'emoji correspondant au score
 */
export const getScoreEmoji = (score: number): string => {
  if (score < 30) return '😔';
  if (score < 50) return '😐';
  if (score < 70) return '😊';
  if (score < 90) return '😄';
  return '🌟';
};

/**
 * Génère un mantra quotidien basé sur la date
 */
export function getDailyMantra(date: string): string {
  const mantras = [
    "Je suis aligné avec l'énergie cosmique de ce jour",
    "Chaque moment est une opportunité de croissance spirituelle",
    "Je fais confiance au flux naturel de l'univers",
    "Ma lumière intérieure guide mes pas",
    "Je suis ouvert aux messages des étoiles",
    "L'harmonie céleste inspire mes actions",
    "Je cultive la paix intérieure en toutes circonstances",
    "Les forces cosmiques me soutiennent dans mon cheminement"
  ];
  
  const dayOfYear = new Date(date).getTime() % mantras.length;
  return mantras[dayOfYear];
} 