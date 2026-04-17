import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
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
