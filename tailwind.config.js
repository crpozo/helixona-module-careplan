/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand gold — primary identity. See STYLE.md §1.
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
        // Ink / near-black — kept for dark accents (staff chip, logo text).
        ink: {
          700: '#1c1c1c',
          800: '#111111',
          900: '#000000',
        },
      },
      fontFamily: {
        sans: [
          'Nunito',
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
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
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
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-32px)', opacity: '0' },
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
        wiggle: 'wiggle 0.8s ease-in-out infinite',
        'float-up': 'float-up 0.9s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
