/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#00d09c',
          600: '#00b386',
          700: '#008b68',
          dark: '#121417',
          surface: '#1c1f24',
          border: '#2a2f37'
        }
      }
    },
  },
  plugins: [],
};
