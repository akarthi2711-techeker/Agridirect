/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary greens
        'paddy-green': '#2D6A4F',
        'leaf-green': '#40916C',
        'earthy-green': '#52B788',
        'light-green': '#B7E4C7',
        // Earth tones
        'earth-brown': '#6B4226',
        'coconut-brown': '#8B5E3C',
        // Accent
        'harvest-yellow': '#F4A261',
        'golden': '#E9C46A',
        // Dark mode
        'forest-dark': '#1B2E22',
        'earth-dark': '#2C1A0E',
        'charcoal': '#1C1C1E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        tamil: ['Noto Sans Tamil', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
};
