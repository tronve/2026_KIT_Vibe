/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F5F5',
          100: '#E8E8E8',
          200: '#D1D1D1',
          300: '#B9B9B9',
          400: '#A1A1A1',
          500: '#808080',
          600: '#595959',
          700: '#323232',
          800: '#1A1A1A',
          900: '#0D0D0D',
        },
      },
      boxShadow: {
        glow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

