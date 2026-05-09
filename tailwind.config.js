/**
 * Zodiak Design Tokens v3 — "Cosmic Editorial Ritual"
 * ====================================================
 *
 * Direction artistique (mai 2026) :
 *   - Encre profonde violacée (#0A0814) avec champ d'étoiles vivant
 *   - UN SEUL accent dominant : or alchimique (#D4A656)
 *   - Magenta cosmique réservé aux moments rituels (mantra, anniversaire)
 *   - Typographie sculptée : Fraunces (serif éditorial moderne) + Inter
 *   - Cinzel relégué aux eyebrows / small caps de signature
 *   - Spacing généreux, hiérarchie typo radicale
 *   - Animations contemplatives (ease-out 600-800ms)
 *   - SUPPRESSION : gradients multi-couleurs, halos cumulés, glow violents
 *
 * Note technique :
 *   On garde les NOMS de tokens (aurora/magenta/amber/night/ivory) pour
 *   que l'ancien code se rénove automatiquement via remap des HEX.
 *   `aurora-*` qui était violet devient désormais or alchimique.
 *   `magenta-*` reste pourpre mais à utiliser avec parcimonie.
 *   `amber-*` devient ocre désertique chaud.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─────── Encres nocturnes (fond, surfaces) ───────
        // Violet quasi-noir, avec une touche cosmique. JAMAIS pur noir.
        night: {
          50:  '#E5E2EC',
          100: '#C9C3D5',
          200: '#9991AE',
          300: '#5C5577',
          500: '#2A2540',
          600: '#1F1B33',
          700: '#171328',
          800: '#11101F',
          900: '#0E0B1A',
          950: '#0A0814',
        },

        // ─────── Papier crème (texte, surfaces claires) ───────
        // Ivoire chaud calcaire. JAMAIS blanc pur (trop clinique).
        ivory: {
          50:  '#F4ECDB',
          100: '#EFE5CD',
          200: '#E4D8B8',
          300: '#D4C49A',
          400: '#A8987A',
          500: '#7A6E55',
        },

        // ─────── ACCENT UNIQUE — Or alchimique ───────
        // Inspiré des dorures de manuscrits enluminés et des ors patinés.
        // C'est LA couleur de signature. Utilisée partout où il faut un accent.
        // (Ex-aurora violet → désormais or. Toutes les pages héritent.)
        aurora: {
          50:  '#FBF3DD',
          100: '#F4E4B0',
          200: '#EAD183',
          300: '#DFBA62',
          400: '#D4A656',  // accent principal
          500: '#C8943C',
          600: '#A87A2D',
          700: '#825D22',
          800: '#5A4017',
          900: '#3A290F',
        },

        // ─────── Magenta cosmique (RITUEL UNIQUEMENT) ───────
        // Réservé aux moments forts : mantra du jour, révolution solaire,
        // détails sacrés. Jamais mélangé à l'or sur la même zone visible.
        magenta: {
          400: '#E48BB7',
          500: '#C9619B',
          600: '#9F4179',
        },

        // ─────── Ocre désertique (chaleur secondaire) ───────
        // Pour les moments solaires (lever, vitalité). Très ponctuel.
        amber: {
          200: '#F0DBB1',
          300: '#E5C285',
          400: '#D4A656',  // = aurora.400 (alignement chromatique)
          500: '#B8862F',
        },

        // ─────── Aliases rétrocompat ───────
        primary:   '#D4A656',  // = aurora.400 (or)
        secondary: '#C9619B',  // = magenta.500
        accent:    '#D4A656',  // = aurora.400
        cosmic: {
          800: '#11101F',
          900: '#0E0B1A',
        },
      },

      fontFamily: {
        // Display = Fraunces (serif sculpté moderne, vraie identité 2026)
        // Sans = Inter (neutre, lisible, classique)
        // Cinzel reste pour les SIGNATURES rituelles (eyebrows small caps)
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
        serif:   ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        // Cinzel : conservé en rétrocompat (toutes les pages utilisent
        // font-cinzel actuellement). Désormais c'est juste "Fraunces alternatif"
        // pour ne pas tout casser. Mais idéalement à migrer vers font-serif.
        cinzel:  ['Fraunces', 'Cinzel', 'serif'],
      },

      fontSize: {
        // Hiérarchie typo radicale : on assume des tailles ÉNORMES.
        // C'est la signature éditoriale (cf. CHANI, AskNova, Mubi).
        'display-xl': ['clamp(3.5rem, 8vw, 7.5rem)',  { lineHeight: '0.95', letterSpacing: '-0.025em' }],
        'display':    ['clamp(2.5rem, 5.5vw, 4.5rem)', { lineHeight: '1.0',  letterSpacing: '-0.02em'  }],
        'h1':         ['clamp(2rem, 3vw, 2.75rem)',    { lineHeight: '1.1',  letterSpacing: '-0.015em' }],
        'h2':         ['clamp(1.5rem, 2.2vw, 2rem)',   { lineHeight: '1.15', letterSpacing: '-0.01em'  }],
        'h3':         ['1.25rem',                       { lineHeight: '1.3',  letterSpacing: '-0.005em' }],
        'body-lg':    ['1.125rem',                      { lineHeight: '1.7' }],
        'body':       ['1rem',                          { lineHeight: '1.7' }],
        'caption':    ['0.875rem',                      { lineHeight: '1.55' }],
        'micro':      ['0.75rem',                       { lineHeight: '1.4',  letterSpacing: '0.16em' }],
      },

      animation: {
        // Animations contemplatives, pas de fioritures.
        'fade-in':     'fade-in 0.8s ease-out',
        'fade-in-up':  'fade-in-up 0.8s ease-out',
        'twinkle':     'twinkle 3s ease-in-out infinite',
        'breath':      'breath 8s ease-in-out infinite',
        'shimmer':     'shimmer 2.4s linear infinite',
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '1' },
        },
        'breath': {
          '0%, 100%': { transform: 'scale(1)',     opacity: '0.95' },
          '50%':      { transform: 'scale(1.005)', opacity: '1'    },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      backgroundImage: {
        // Halos très très subtils — invisibles à l'œil mais présents en couche.
        // Plus de "aurora" multicolore néon. Juste de l'or qui respire.
        'cosmic':       'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,166,86,0.08), transparent 70%), radial-gradient(ellipse 60% 50% at 50% 100%, rgba(201,97,155,0.04), transparent 60%)',
        'cosmic-dim':   'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,166,86,0.04), transparent 70%)',
        // Rétrocompat (anciens noms qui sont encore utilisés ailleurs)
        'aurora':       'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,166,86,0.08), transparent 70%)',
        'aurora-soft':  'linear-gradient(135deg, rgba(212,166,86,0.05), rgba(201,97,155,0.03))',
        'gradient-text': 'none',
        // Texture grain papier (overlay subtil sur les surfaces)
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E\")",
      },

      boxShadow: {
        // Plus de shadow-glow violent. Tout devient invisible ou hairline.
        'glow-aurora':  '0 0 60px -20px rgba(212, 166, 86, 0.25)',
        'glow-magenta': '0 0 60px -20px rgba(201, 97, 155, 0.20)',
        'card':         'none',
        'card-hover':   '0 1px 0 rgba(244,236,219,0.04) inset',
        'editorial':    '0 1px 0 rgba(244,236,219,0.04) inset, 0 30px 80px -40px rgba(0,0,0,0.6)',
      },

      backdropBlur: {
        xs: '2px',
      },

      spacing: {
        // Spacing éditorial généreux : sections, padding cards.
        18:  '4.5rem',
        22:  '5.5rem',
        30:  '7.5rem',
        40:  '10rem',
        48:  '12rem',
        56:  '14rem',
        64:  '16rem',
        88:  '22rem',
        128: '32rem',
      },

      borderRadius: {
        // Radius adoucis : on sort du "all rounded-2xl/3xl" pop années 2010.
        // Nouveau standard : sm/md pour cards, none/sm pour boutons éditoriaux.
        'editorial': '4px',  // Cards éditoriales (CHANI-like)
        '4xl':       '1.25rem',  // Anciens 4xl ramenés
        '5xl':       '1.5rem',
      },

      letterSpacing: {
        // Pour les small caps Cinzel signature
        'ritual': '0.32em',
        'wide-cosmic': '0.22em',
      },

      zIndex: {
        60:  '60',
        70:  '70',
        80:  '80',
        90:  '90',
        100: '100',
      },
    },
  },
  plugins: [],
};
