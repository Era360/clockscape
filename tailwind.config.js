/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        clock: {
          dark: '#000000',
          card: '#111111',
          text: '#FFFFFF',
          shadow: 'rgba(0, 0, 0, 0.5)',
        },
      },
      animation: {
        'flip-down': 'flipDown 0.6s cubic-bezier(0.6, 0, 0.4, 1) forwards',
        'flip-up': 'flipUp 0.6s cubic-bezier(0.6, 0, 0.4, 1) forwards',
      },
      keyframes: {
        flipDown: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(-180deg)' },
        },
        flipUp: {
          '0%': { transform: 'rotateX(180deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
      }
    },
  },
  plugins: [],
}