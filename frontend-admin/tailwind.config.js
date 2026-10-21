/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b100ab',
        'primary-dark': '#9c0096',
      },
      backgroundImage: {
        'gradient-purple': 'radial-gradient(circle at center, #6a1299 0%, #3f0b66 45%, #1f0238 100%)',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}