module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  safelist: [
    'bg-red-700', 'text-white',
    'bg-yellow-500', 'text-black',
    'bg-green-500',
    'bg-blue-500',
    'bg-gray-400'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};