/**
 * Zodiak Design Tokens v2 — "Cosmic Editorial"
 * ============================================
 *
 * Direction artistique :
 *   - Fond profond, indigo nocturne (#0B0B1A) avec halos de couleur diffus
 *   - Accent "aurora" : violet → magenta → ambre
 *   - Texte premium ivoire chaud, hiérarchie typographique forte
 *   - Mouvement : slow drift, pas de paillettes ni d'effets gimmick
 *
 * Tokens à privilégier (ne plus utiliser `primary`, `secondary`, `cosmic-XXX` sauf rétrocompat) :
 *   - bg     : `bg-night-950` (fond), `bg-night-900` (cards), `bg-night-800` (overlays)
 *   - text   : `text-ivory-50` (titre), `text-ivory-200` (corps), `text-ivory-400` (meta)
 *   - accent : `text-aurora-400`, `bg-aurora-500`, `from-aurora-400 to-magenta-500`
 *   - border : `border-night-700`, `border-aurora-500/30`
 *
 * Les anciens tokens (`primary`, `secondary`, `cosmic-*`) sont GARDÉS comme aliases
 * vers la nouvelle palette pour ne pas casser l'existant pendant la migration.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─────── Nouvelle palette principale ───────
        night: {
          50:  '#E5E5EE',
          100: '#C9C9D8',
          200: '#9999B5',
          300: '#5C5C82',
          500: '#2A2A48',
          600: '#1F1F38',
          700: '#171729',
          800: '#11111F',
          900: '#0B0B1A',
          950: '#06060F',
        },
        ivory: {
          50:  '#FAF7F2',
          100: '#F5EFE6',
          200: '#EAE2D4',
          300: '#D7CCB7',
          400: '#A99E8B',
          500: '#7A7160',
        },
        aurora: {
          50:  '#F4ECFF',
          100: '#E5D2FF',
          200: '#C9A6FF',
          300: '#AB7AFF',
          400: '#8E55FF',
          500: '#6F33F0', // accent principal
          600: '#5A23C8',
          700: '#451B97',
          800: '#2F1366',
          900: '#180A3B',
        },
        magenta: {
          400: '#F472B6',
          500: '#E84A93',
          600: '#C12B72',
        },
        amber: {
          200: '#FCE3A4',
          300: '#FAD46B',
          400: '#F5B638', // chaleur "or" sans tomber dans le gold criard
          500: '#D89720',
        },

        // ─────── Aliases rétrocompat (à supprimer en sprint design final) ───────
        primary: '#8E55FF',     // = aurora.400
        secondary: '#E84A93',   // = magenta.500
        accent: '#F5B638',      // = amber.400
        cosmic: {
          800: '#11111F',       // = night.800
          900: '#0B0B1A',       // = night.900
        },
      },
      fontFamily: {
        // Display = Cinzel pour les hero/pages d'accroche.
        // Sans = Inter pour le corps. PAS d'Open Sans / Montserrat (déjà retirés).
        cinzel: ['Cinzel', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Échelle modulaire 1.250 (major third)
        'display-xl': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display':    ['clamp(2rem, 3.5vw, 3rem)',   { lineHeight: '1.1',  letterSpacing: '-0.015em' }],
        'h1':         ['1.875rem',                    { lineHeight: '1.15' }],
        'h2':         ['1.5rem',                      { lineHeight: '1.2' }],
        'h3':         ['1.25rem',                     { lineHeight: '1.3' }],
        'body-lg':    ['1.125rem',                    { lineHeight: '1.6' }],
        'body':       ['1rem',                        { lineHeight: '1.65' }],
        'caption':    ['0.875rem',                    { lineHeight: '1.5' }],
        'micro':      ['0.75rem',                     { lineHeight: '1.4', letterSpacing: '0.04em' }],
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'aurora-drift': 'aurora-drift 24s ease-in-out infinite',
        'breath': 'breath 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'aurora-drift': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)', opacity: '0.55' },
          '33%':      { transform: 'translate3d(8%, -4%, 0) scale(1.08)', opacity: '0.7' },
          '66%':      { transform: 'translate3d(-6%, 6%, 0) scale(0.95)', opacity: '0.45' },
        },
        'breath': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.015)', opacity: '0.92' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'aurora':         'radial-gradient(ellipse at 20% 0%, rgba(142,85,255,0.35), transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(232,74,147,0.22), transparent 55%), radial-gradient(ellipse at 50% 110%, rgba(245,182,56,0.12), transparent 50%)',
        'aurora-soft':    'linear-gradient(135deg, rgba(142,85,255,0.12), rgba(232,74,147,0.08))',
        'gradient-text':  'linear-gradient(135deg, #FAF7F2 0%, #C9A6FF 60%, #F472B6 100%)',
      },
      boxShadow: {
        // Lueurs subtiles, pas de "shadow-glow" violent
        'glow-aurora':  '0 0 40px -10px rgba(142, 85, 255, 0.45)',
        'glow-magenta': '0 0 40px -10px rgba(232, 74, 147, 0.4)',
        'card':         '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 32px -12px rgba(0,0,0,0.6)',
        'card-hover':   '0 1px 0 rgba(255,255,255,0.06) inset, 0 16px 48px -12px rgba(0,0,0,0.7)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },
  plugins: [],
}
