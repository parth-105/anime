module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39FF14',
        violet: '#7C4DFF',
        midnight: '#05060a'
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(180deg, #000000 0%, rgba(16,8,36,1) 100%)'
      }
    }
  },
  plugins: []
}


