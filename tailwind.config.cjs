/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#11B69A',
          600: '#0D8F79',
          700: '#0B6F5F',
        },
      },
      boxShadow: {
        glow: '0 20px 80px rgba(17, 182, 154, 0.18)',
      },
    },
  },
  plugins: [],
}

