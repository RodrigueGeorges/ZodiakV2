/**
 * Theme constants — DA "Cosmic Editorial" v2.
 *
 * Ne plus utiliser dans le nouveau code : préférer les tokens Tailwind
 * (`bg-night-950`, `text-aurora-400`, etc.). Ces constantes restent ici
 * uniquement pour les composants legacy non encore migrés et pour les
 * animations CSS injectées via styles inline.
 */
export const COLORS = {
  primary: '#8E55FF',
  secondary: '#E84A93',
  background: '#0B0B1A',
  backgroundGradient: '#171729',
  text: {
    primary: '#FAF7F2',
    secondary: '#C9A6FF',
    accent: '#E84A93',
  },
} as const;

export const GRADIENTS = {
  /** Halo aurora (utilisé dans les hero, headers, fonds décoratifs). */
  aurora:
    'radial-gradient(ellipse at 20% 0%, rgba(142,85,255,0.35), transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(232,74,147,0.22), transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(245,182,56,0.12), transparent 50%)',
  /** Texte gradient aurora ivoire → magenta. */
  text:
    'linear-gradient(135deg, #FAF7F2 0%, #C9A6FF 60%, #F472B6 100%)',
  /** Texte gradient aurora animé (pour effet sheen). */
  textAnimated:
    'linear-gradient(120deg, #FAF7F2 0%, #C9A6FF 30%, #F472B6 50%, #C9A6FF 70%, #FAF7F2 100%)',
  /** Surface verre aurora (cards). */
  glass:
    'linear-gradient(135deg, rgba(17,17,31,0.78), rgba(11,11,26,0.95))',

  // ─── Aliases legacy (à éviter dans le code neuf) ───
  lunarSheen:
    'linear-gradient(135deg, #FAF7F2 0%, #C9A6FF 60%, #F472B6 100%)',
  lunarSheenAnimated:
    'linear-gradient(120deg, #FAF7F2 0%, #C9A6FF 30%, #F472B6 50%, #C9A6FF 70%, #FAF7F2 100%)',
};

export const EFFECTS = {
  /** Halo aurora (utilisé pour shadow boxs glass). */
  halo: '0 0 40px -10px rgba(142,85,255,0.45)',
  /** Halo magenta (alternative chaude). */
  haloMagenta: '0 0 40px -10px rgba(232,74,147,0.4)',
  /** Animation sheen (texte/gradient qui glisse). */
  sheenAnimation: `
    @keyframes sheen {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
};
