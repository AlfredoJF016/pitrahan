/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        'neon-green': '#39FF14',
        'electric-cyan': '#00E5FF',
        'warning-red': '#FF3E3E',
        'dark-base': '#121212',
        'dark-card': '#1E1E1E',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.3)',
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
