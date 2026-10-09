/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Cinzel', 'Georgia', 'serif'],      // titles, banners
        'ui': ['"UI Digits"', 'Marcellus', 'Georgia', 'serif'],         // buttons, labels, body (Friz Quadrata stand-in)
        'chat': ['"Roboto Condensed"', '"Arial Narrow"', 'sans-serif'], // chat frame, combat log
      },
      colors: {
        // WoW UI gold, item quality, chat channels, faction (set by <html data-faction>)
        'gold': { DEFAULT: '#ffd100', light: '#fff1a8', dark: '#a8801c', deep: '#5a4314' },
        'quality': { poor: '#9d9d9d', common: '#ffffff', uncommon: '#1eff00', rare: '#0070dd', epic: '#a335ee', legendary: '#ff8000' },
        'chan': { say: '#ffffff', system: '#ffff00', party: '#aaaaff', whisper: '#ff80ff', guild: '#40ff40', error: '#ff2020', yell: '#ff4040' },
        'faction': { DEFAULT: 'rgb(var(--faction) / <alpha-value>)', light: 'rgb(var(--faction-light) / <alpha-value>)' },
        'ink': { 950: '#040508', 900: '#08090e', 800: '#0f1118', 700: '#171a24', 600: '#232734' },
        'parchment': { DEFAULT: '#e9d6a6', dark: '#c4a66a', ink: '#2b1d0e' },
      },
    },
  },
  plugins: [],
}
