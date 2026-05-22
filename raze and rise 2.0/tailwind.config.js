/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0B',
          elevated: '#141416',
          input: '#1C1B1B',
        },
        fg: {
          DEFAULT: '#E5E2E1',
          muted: '#99907C',
          subtle: '#5C564B',
        },
        accent: {
          DEFAULT: '#F2CA50',
          deep: '#D4AF37',
          dim: 'rgba(212, 175, 55, 0.10)',
        },
        border: {
          DEFAULT: 'rgba(212, 175, 55, 0.22)',
          strong: 'rgba(212, 175, 55, 0.45)',
        },
        danger: {
          DEFAULT: '#EF4444',
          dim: 'rgba(239, 68, 68, 0.12)',
        },
        success: {
          DEFAULT: '#10B981',
          dim: 'rgba(16, 185, 129, 0.12)',
        },
        // Phase 2 — set-state semantic color aliases (alias of Phase 1 tokens; new semantic names)
        'set-go': '#F2CA50',
        'set-nogo': '#EF4444',
        'set-warmup': '#5C564B',
        'timer-zero-bg': '#F2CA50',
        'timer-zero-fg': '#0A0A0B',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui'],
        serif: ['Noto Serif', 'Georgia'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '17px' }],
        body: ['16px', { lineHeight: '24px' }],
        heading: ['24px', { lineHeight: '30px' }],
        display: ['32px', { lineHeight: '38px' }],
        // Phase 2 — numeric typography roles (tabular-nums applied at NumericText component level)
        numeric: ['16px', { lineHeight: '24px', fontWeight: '700' }],
        'numeric-large': ['28px', { lineHeight: '31px', fontWeight: '700' }],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '8px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
