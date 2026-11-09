/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          deep: '#075C55',
          dark: '#153A37',
          secondary: '#117A78',
          light: '#E6F4F1',
          hover: '#096E66',
        },
        gold: {
          warm: '#F3A052',
          hover: '#E08E41',
          light: '#FEF6EE',
        },
        iu: {
          bg: '#F4F8F6',
          text: '#173C39',
          muted: '#718583',
          border: '#DDE8E4',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bengali: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
