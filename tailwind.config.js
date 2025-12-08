/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← This is non-negotiable
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};