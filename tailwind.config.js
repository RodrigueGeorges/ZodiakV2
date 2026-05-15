/**
 * Zodiak — charte « brutal cosmos » (2026)
 * Référence d’esprit : marketing Co–Star (noir, typo massive, mono pour le protocole,
 * quasi pas de déco) + couche ciel atlas bleu (accent `aurora` = glace, pas or).
 */
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─────── Encres nocturnes (fond, surfaces) — froid, quasi brut ───────
        night: {
          50:  '#F2EDE6',
          100: '#D9D1C5',
          200: '#A89E90',
          300: '#6B655C',
          500: '#3D3832',
          600: '#2A2520',
          700: '#1A1714',
          800: '#0f0d0c',
          900: '#080706',
          // 950 = "vraie nuit profonde" (légèrement bleutée).
          // Utilisé comme texte sombre sur boutons clairs et ring-offset.
          // NE PAS remettre à #000000 — ça casse la sémantique et les contrastes.
          950: '#050608',
        },

        // ─────── Tokens sémantiques (CSS vars, voir index.css) ───────
        // Préfère ces alias dans les nouveaux composants : ils sont stables
        // si la palette évolue, et rendent l'intent lisible.
        surface: {
          base:    'rgb(var(--surface-base) / <alpha-value>)',
          raised:  'rgb(var(--surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
        },
        border: {
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
          strong: 'rgb(var(--border-strong) / <alpha-value>)',
        },
        text: {
          primary:   'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--text-muted) / <alpha-value>)',
        },

        // Filets & chrome — hairlines blancs (pas bronze)
        signal: {
          200: 'rgba(255,255,255,0.22)',
          300: 'rgba(255,255,255,0.16)',
          400: 'rgba(255,255,255,0.9)',
          500: 'rgba(255,255,255,0.45)',
          600: 'rgba(255,255,255,0.1)',
        },

        // ─────── Texte & surfaces claires (neutre froid, type Co–Star) ───────
        ivory: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
        },

        // ─────── Accent unique = glace / ciel (cohérent StarField bleu) ───────
        aurora: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },

        // ─────── Magenta cosmique (RITUEL UNIQUEMENT) ───────
        // Réservé aux moments forts : mantra du jour, révolution solaire,
        // détails sacrés. Jamais mélangé à l'or sur la même zone visible.
        magenta: {
          400: '#E48BB7',
          500: '#C9619B',
          600: '#9F4179',
        },

        amber: {
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },

        primary:   '#38bdf8',
        secondary: '#C9619B',
        accent:    '#38bdf8',
        cosmic: {
          800: '#0f0d0c',
          900: '#080706',
        },
      },

      fontFamily: {
        // Display = Fraunces Variable — auto-hébergé (@fontsource-variable/fraunces)
        // Sans = Inter Variable
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter Variable', 'Inter', 'sans-serif'],
        mono: [
          'JetBrains Mono Variable',
          'JetBrains Mono',
          'ui-monospace',
          'monospace',
        ],
        serif: ['Fraunces Variable', 'Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Fraunces Variable', 'Fraunces', 'Cormorant Garamond', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Fraunces Variable', 'Georgia', 'serif'],
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

      transitionTimingFunction: {
        /** Rituel éditorial (proche expo-out premium) — Framer Motion aligné */
        ritual: 'cubic-bezier(0.22, 1, 0.36, 1)',
        /** UI directe, peu de « bounce » */
        brutal: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        /** Durées conseillées animations UI */
        'ritual': '560ms',
        'ritual-slow': '900ms',
      },

      animation: {
        // Animations contemplatives, pas de fioritures.
        'fade-in':     'fade-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in-up':  'fade-in-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'twinkle':     'twinkle 3s ease-in-out infinite',
        'breath':      'breath 8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
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
        'cosmic':       'radial-gradient(ellipse 85% 55% at 18% 8%, rgba(56,189,248,0.08), transparent 72%), radial-gradient(ellipse 70% 45% at 88% 92%, rgba(14,165,233,0.05), transparent 65%)',
        'cosmic-dim':   'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.05), transparent 70%)',
        'aurora':       'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.07), transparent 70%)',
        'aurora-soft':  'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(14,165,233,0.04))',
        'gradient-text': 'none',
        // Texture grain papier (overlay subtil sur les surfaces)
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E\")",
      },

      boxShadow: {
        // Plus de shadow-glow violent. Tout devient invisible ou hairline.
        'glow-aurora':  '0 0 60px -20px rgba(56, 189, 248, 0.22)',
        'glow-magenta': '0 0 60px -20px rgba(201, 97, 155, 0.20)',
        'card':         'none',
        'card-hover':   '0 1px 0 rgba(244,236,219,0.04) inset',
        'editorial':    '0 1px 0 rgba(244,236,219,0.04) inset, 0 30px 80px -40px rgba(0,0,0,0.6)',

        // ─────── Échelle d'élévation sémantique (à privilégier) ───────
        // shadow-1 = chip/badge ; shadow-2 = card ; shadow-3 = card hover ;
        // shadow-4 = popover/menu ; shadow-5 = modal/sheet.
        '1': 'inset 0 1px 0 rgba(255,255,255,0.04)',
        '2': 'inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.4)',
        '3': 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -12px rgba(0,0,0,0.6)',
        '4': 'inset 0 1px 0 rgba(255,255,255,0.09), 0 18px 40px -20px rgba(0,0,0,0.75)',
        '5': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 32px 80px -32px rgba(0,0,0,0.85)',
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
  plugins: [forms],
};
