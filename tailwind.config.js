/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      width: {
        'iphone': '375px',
      },
      height: {
        'iphone': '812px',
      },
    },
  },
  plugins: [],
}