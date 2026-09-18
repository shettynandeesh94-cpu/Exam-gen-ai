/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Allow manual class-based dark mode switching if needed, defaulted to dark
  theme: {
    extend: {
      colors: {
        brand: {
          darkBg: 'var(--brand-darkBg)',
          cardBg: 'var(--brand-cardBg)',
          border: 'var(--brand-border)',
          textPrimary: 'var(--brand-textPrimary)',
          textSecondary: 'var(--brand-textSecondary)',
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          error: 'var(--brand-error)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(99, 102, 241, 0.15)',
        'accent-glow': '0 0 15px rgba(6, 182, 212, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
