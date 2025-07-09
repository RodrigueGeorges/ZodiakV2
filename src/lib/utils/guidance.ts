import { SCORE_CONFIG } from '../constants/design';

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
 * Configuration des scores de guidance - Utilise le système cohérent
 */
export const guidanceScoreConfig = SCORE_CONFIG;

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