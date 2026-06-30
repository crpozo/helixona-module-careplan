/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand gold — primary identity (a gentle accent in the wellness look).
        brand: {
          50: '#faf7f0',
          100: '#f3ebd9',
          200: '#e8d7b4',
          300: '#e0cba0',
          400: '#d9bf8d',
          500: '#d6b981',
          600: '#c2a163',
          700: '#9c7e44',
          800: '#7a6234',
          900: '#5a4827',
        },
        // Ink — warm near-blacks (not pure black) for a softer, premium feel.
        ink: {
          700: '#3a332b',
          800: '#2a241e',
          900: '#1d1813',
        },
        // We override the default cool "slate" with a WARM greige scale so every
        // existing slate-* utility across the app reads warm without per-file edits.
        slate: {
          50: '#f8f5ef',
          100: '#f1ebe0',
          200: '#e7decd',
          300: '#d8cdb7',
          400: '#a99f8c',
          500: '#83796a',
          600: '#645b4f',
          700: '#4b443a',
          800: '#322e27',
          900: '#211d18',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        // Softer, rounder surfaces for the wellness aesthetic.
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(70 50 20 / 0.04), 0 6px 20px -8px rgb(70 50 20 / 0.10)',
        warm: '0 10px 30px -12px rgb(120 90 40 / 0.18)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'ring-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
        'ring-pulse': 'ring-pulse 1.8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
