/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Texas Health Resources inspired palette
        'thr-blue': {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066cc', // Primary blue
          600: '#0052a3',
          700: '#003d7a',
          800: '#002952',
          900: '#001429',
        },
        'thr-green': {
          50: '#e6f7f0',
          100: '#ccefe1',
          200: '#99dfc3',
          300: '#66cfa5',
          400: '#33bf87',
          500: '#00a862', // Primary green
          600: '#00864e',
          700: '#00653b',
          800: '#004327',
          900: '#002214',
        },
      },
    },
  },
  plugins: [],
}
