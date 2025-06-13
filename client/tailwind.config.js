
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/*.jsx"
  ],
  theme: {
    extend: {
      colors: {
        lavender: {
          100: '#C7B8EA', // light lavender
          200: '#C5C3C8', // pastel lavender
          300: '#B577A8', // soft lavender
          400: '#A353A4', // rich lavender
          500: '#7A288A', // deep lavender
          600: '#631A7E', // dark lavender
          700: '#4E1A6F', // very dark lavender
          800: '#3B0B59', // almost black lavender
          900: '#21004F', // black lavender
        },
        plum: {
          100: '#ffd7e9', // light plum
          200: '#ffc5c5', // pastel plum
          300: '#ffa0c9', // soft plum
          400: '#ff73a6', // rich plum
          500: '#ff47a6', // deep plum
          600: '#e91e63', // dark plum
          700: '#c51162', // very dark plum
          800: '#a9105a', // almost black plum
          900: '#7f0d46', // black plum
        },
        grape: {
          100: '#F7D2F5', // light grape
          200: '#E9C5EA', // pastel grape
          300: '#C984B5', // soft grape
          400: '#A855A3', // rich grape
          500: '#7A288A', // deep grape
          600: '#631A7E', // dark grape
          700: '#4E1A6F', // very dark grape
          800: '#3B0B59', // almost black grape
          900: '#21004F', // black grape
        },
        purple: {
          100: '#C9C3E6', // light purple
          200: '#B5B2E5', // pastel purple
          300: '#A377E6', // soft purple
          400: '#7A288A', // rich purple
          500: '#6c5ce7', // deep purple
          600: '#5B21B6', // dark purple
          700: '#4B006E', // very dark purple
          800: '#3B005A', // almost black purple
          900: '#21004F', // black purple
        },
      },
    },
  },
  plugins: [],
}