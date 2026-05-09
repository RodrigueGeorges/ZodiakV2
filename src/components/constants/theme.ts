/**
 * Ancres couleur / dégradés pour styles inline ou legacy.
 * Le JSX neuf doit préférer Tailwind : `bg-night-950`, `text-aurora-400`, `border-signal-*`.
 */
export const COLORS = {
  primary: '#aa8558',
  secondary: '#8f6f47',
  background: '#000000',
  backgroundGradient: '#0f0d0c',
  text: {
    primary: '#f4ecdb',
    secondary: '#e8dcc8',
    accent: '#aa8558',
  },
} as const;

export const GRADIENTS = {
  /** Halo discret (hero / bandeaux) — or froid sur vide. */
  aurora:
    'radial-gradient(ellipse at 20% 0%, rgba(170,133,88,0.14), transparent 58%), radial-gradient(ellipse at 80% 60%, rgba(90,71,46,0.12), transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.4), transparent 48%)',
  /** Texte ivoire → or (titres très ponctuels). */
  text: 'linear-gradient(135deg, #fbf3dd 0%, #aa8558 72%)',
  textAnimated:
    'linear-gradient(120deg, #fbf3dd 0%, #aa8558 42%, #c9ae8c 58%, #fbf3dd 100%)',
  /** Surface type verre — neutre chaud sombre. */
  glass:
    'linear-gradient(135deg, rgba(26,23,20,0.82), rgba(8,7,6,0.94))',

  lunarSheen:
    'linear-gradient(135deg, #fbf3dd 0%, #aa8558 65%, #5a472e 100%)',
  lunarSheenAnimated:
    'linear-gradient(120deg, #fbf3dd 0%, #aa8558 40%, #8f6f47 62%, #fbf3dd 100%)',
};

export const EFFECTS = {
  halo: '0 0 40px -12px rgba(170,133,88,0.35)',
  haloMagenta: '0 0 36px -10px rgba(201,97,155,0.28)',
  sheenAnimation: `
    @keyframes sheen {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
};
