/**** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        oceanStart: '#0e7490',
        oceanEnd: '#1e3a8a',
        card: '#0b3c5d',
        cardAccent: '#0e7490',
      },
      boxShadow: {
        ocean: '0 10px 25px rgba(14, 116, 144, 0.3)'
      },
      borderRadius: {
        xl: '1rem'
      }
    },
  },
  plugins: [],
}
