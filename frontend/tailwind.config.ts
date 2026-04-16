import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          400: '#e879f9',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
      },
      keyframes: {
        'scan-line': {
          '0%, 100%': { top: '0%' },
          '50%': { top: '100%' },
        },
      },
      animation: {
        'scan-line': 'scan-line 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
