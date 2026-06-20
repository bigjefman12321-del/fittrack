import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f1117',
        foreground: '#f1f5f9',
        card: {
          DEFAULT: '#161922',
          foreground: '#f1f5f9',
        },
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1e2433',
          foreground: '#94a3b8',
        },
        muted: {
          DEFAULT: '#1a1f2e',
          foreground: '#64748b',
        },
        accent: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
        border: '#2a3142',
        input: '#2a3142',
        ring: '#3b82f6',
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
