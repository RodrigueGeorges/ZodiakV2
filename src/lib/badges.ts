/**
 * Définitions des badges silencieux.
 *
 * Chaque badge a une `condition` qui prend un contexte et retourne true.
 * Le hook `useBadges` évalue les conditions au mount + à chaque update et
 * persiste les nouveaux gains via `user_badges`.
 *
 * Le ton est volontairement poétique — les "badges" Zodiak ne sont pas des
 * achievements de jeu vidéo. Ce sont des "marqueurs" cosmiques.
 */

export interface BadgeContext {
  streakCurrent: number;
  streakBest: number;
  totalDays: number;
  friendCount: number;
  synastryHighScoreCount: number;
  guidanceCount: number;
  chatMessageCount: number;
  moonPhase?: 'new' | 'full' | string;
  joinedDays: number;
}

export interface BadgeDef {
  id: string;
  glyph: string;
  name: string;
  description: string;
  /** Tier visuel : aurora / magenta / amber / argent. */
  tone: 'aurora' | 'magenta' | 'amber' | 'silver';
  /** Renvoie true si l'user vient de remplir la condition. */
  earned: (ctx: BadgeContext) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_breath',
    glyph: '✦',
    name: 'Première respiration',
    description: 'Tu as ouvert ta première carte du ciel.',
    tone: 'aurora',
    earned: (c) => c.joinedDays >= 0 && c.guidanceCount >= 1,
  },
  {
    id: 'three_dawns',
    glyph: '☀',
    name: 'Trois aurores',
    description: 'Trois jours consécutifs avec ta guidance.',
    tone: 'amber',
    earned: (c) => c.streakCurrent >= 3,
  },
  {
    id: 'lunation',
    glyph: '☾',
    name: 'Une lunaison',
    description: 'Sept jours d\'affilée auprès du ciel.',
    tone: 'aurora',
    earned: (c) => c.streakCurrent >= 7,
  },
  {
    id: 'cycle_complete',
    glyph: '◯',
    name: 'Cycle complet',
    description: 'Trente jours, un cycle lunaire entier.',
    tone: 'magenta',
    earned: (c) => c.streakCurrent >= 30,
  },
  {
    id: 'devoted',
    glyph: '✺',
    name: 'Constellation fidèle',
    description: 'Cent jours dans le ciel.',
    tone: 'amber',
    earned: (c) => c.streakBest >= 100,
  },
  {
    id: 'first_link',
    glyph: '∞',
    name: 'Premier lien',
    description: 'Tu as lu ta première synastrie.',
    tone: 'magenta',
    earned: (c) => c.friendCount >= 1,
  },
  {
    id: 'magnetic',
    glyph: '✨',
    name: 'Lien magnétique',
    description: 'Une synastrie au-dessus de 85.',
    tone: 'magenta',
    earned: (c) => c.synastryHighScoreCount >= 1,
  },
  {
    id: 'curious',
    glyph: '?',
    name: 'Voix curieuse',
    description: 'Dix questions posées à ton guide.',
    tone: 'aurora',
    earned: (c) => c.chatMessageCount >= 10,
  },
  {
    id: 'new_moon_keeper',
    glyph: '🌑',
    name: 'Gardien·ne de nouvelles lunes',
    description: 'Présent·e lors d\'une nouvelle lune.',
    tone: 'silver',
    earned: (c) => c.moonPhase === 'new' && c.streakCurrent >= 1,
  },
  {
    id: 'full_moon_witness',
    glyph: '🌕',
    name: 'Témoin de pleine lune',
    description: 'Présent·e lors d\'une pleine lune.',
    tone: 'amber',
    earned: (c) => c.moonPhase === 'full' && c.streakCurrent >= 1,
  },
];

export const badgeToneClasses: Record<BadgeDef['tone'], { bg: string; ring: string; text: string }> =
  {
    aurora: {
      bg: 'bg-gradient-to-br from-aurora-500/30 to-aurora-700/20',
      ring: 'ring-aurora-400/40',
      text: 'text-aurora-200',
    },
    magenta: {
      bg: 'bg-gradient-to-br from-magenta-500/30 to-aurora-500/20',
      ring: 'ring-magenta-400/40',
      text: 'text-magenta-200',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-500/35 to-magenta-500/20',
      ring: 'ring-amber-300/50',
      text: 'text-amber-200',
    },
    silver: {
      bg: 'bg-gradient-to-br from-night-700/60 to-aurora-500/20',
      ring: 'ring-night-500/50',
      text: 'text-ivory-200',
    },
  };
