/** @type {import('tailwindcss').Config} */
module.exports = {
  // // Archivos donde Tailwind buscará clases usadas
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef8ff',
          100: '#d8eeff',
          200: '#b9e0ff',
          300: '#88ccff',
          400: '#50afff',
          500: '#2a8ff7',
          600: '#1570eb',
          700: '#1259d8',
          800: '#1548ae',
          900: '#173e89',
          950: '#122759',
        },
      },
      // Tipografías globales del sistema
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};