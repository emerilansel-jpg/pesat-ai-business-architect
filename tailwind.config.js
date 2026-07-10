/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'bg-primary': '#0B0F1A',
        'bg-secondary': '#111827',
        'bg-tertiary': '#1A1F35',
        'accent-primary': '#7C3AED',
        'accent-secondary': '#8B5CF6',
        'accent-tertiary': '#A78BFA',
        'text-primary': '#F8FAFC',
        'text-secondary': '#CBD5E1',
        'text-muted': '#64748B',
      },
      animation: {
        'particle-drift': 'particle-drift linear infinite',
      },
      keyframes: {
        'particle-drift': {
          '0%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-10px) translateX(-10px)' },
          '75%': { transform: 'translateY(-30px) translateX(5px)' },
          '100%': { transform: 'translateY(0) translateX(0)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
