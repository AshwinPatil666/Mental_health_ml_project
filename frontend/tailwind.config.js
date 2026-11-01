/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#1B1D3A',
        muted: '#5B5E82',
        mist: '#F6F5FF',
        line: '#E7E5F7',
        lav: { 50: '#F3F1FF', 100: '#E9E5FF', 300: '#B9AEFA', 500: '#7C6CF0', 600: '#6A58E8', 700: '#5646CC' },
        sky: { 50: '#EEF4FF', 100: '#DCE8FF', 500: '#3E7BFA', 600: '#356BEA' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(60, 50, 140, 0.06), 0 8px 24px -12px rgba(60, 50, 140, 0.14)',
        lift: '0 2px 4px rgba(60, 50, 140, 0.08), 0 18px 40px -16px rgba(60, 50, 140, 0.28)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(36px,24px,0) scale(1.1)' },
        },
        glow: { '0%,100%': { opacity: '.5', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.12)' } },
        slidein: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'none' } },
        pop: { from: { opacity: '0', transform: 'scale(.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        sweep: {
          '0%': { transform: 'translateX(-150%) skewX(-12deg)' },
          '60%,100%': { transform: 'translateX(450%) skewX(-12deg)' },
        },
        nudge: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(5px)' } },
        dots: { '0%,80%,100%': { transform: 'scale(.6)', opacity: '.4' }, '40%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        rise: 'rise .7s cubic-bezier(.2,.7,.2,1) both',
        float: 'float 7s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        'drift-slow': 'drift 26s ease-in-out infinite reverse',
        glow: 'glow 3.5s ease-in-out infinite',
        slidein: 'slidein .45s cubic-bezier(.2,.7,.2,1) both',
        pop: 'pop .35s ease-out both',
        sweep: 'sweep 4.5s ease-in-out infinite',
        nudge: 'nudge 2s ease-in-out infinite',
        dots: 'dots 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
