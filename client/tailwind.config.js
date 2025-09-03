/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'wow': ['Inter', 'sans-serif'],
      },
      colors: {
        'wow': {
          'bg-dark': '#0f0f0f',
          'bg-medium': '#1a1a1a',
          'bg-light': '#2a2a2a',
          'border': '#444444',
          'gold': '#d4af37', // Darker, more readable gold
          'gold-bright': '#ffd700', // Keep bright gold for accents
          'gold-dark': '#b8860b', // Even darker gold for better contrast
          'blue': '#4a9eff', // Lighter blue for better readability
          'red': '#cc2936',
          'text-primary': '#f4f4f4',
          'text-secondary': '#b0b0b0',
          'text-muted': '#888888',
        }
      },
      backgroundImage: {
        'wow-stone': "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)",
        'wow-button': "linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)",
        'wow-button-hover': "linear-gradient(145deg, #4a4a4a 0%, #3a3a3a 50%, #2a2a2a 100%)",
        'wow-gold': "linear-gradient(145deg, #d4af37 0%, #e6c547 50%, #d4af37 100%)",
      },
      boxShadow: {
        'wow-inset': 'inset 2px 2px 5px rgba(0,0,0,0.3), inset -2px -2px 5px rgba(255,255,255,0.1)',
        'wow-outset': '2px 2px 10px rgba(0,0,0,0.5), -1px -1px 5px rgba(255,255,255,0.05)',
        'wow-glow': '0 0 20px rgba(212, 175, 55, 0.5)', // Updated to new gold
        'wow-glow-bright': '0 0 20px rgba(255, 215, 0, 0.5)', // Bright version for special effects
        'wow-text': '2px 2px 4px rgba(0,0,0,0.8)',
      },
      animation: {
        'dice-roll': 'diceRoll 1s ease-in-out',
        'winner-glow': 'winnerGlow 2s infinite',
        'pulse-gold': 'pulseGold 2s infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        diceRoll: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '25%': { transform: 'rotate(90deg) scale(1.1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '75%': { transform: 'rotate(270deg) scale(1.1)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        winnerGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.8)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
      },
    },
  },
  plugins: [],
}
