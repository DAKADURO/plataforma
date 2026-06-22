/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(200, 80%, 50%)', // teal
          light: 'hsl(200, 80%, 70%)',
          dark: 'hsl(200, 80%, 30%)',
        },
        accent: {
          DEFAULT: 'hsl(45, 90%, 55%)', // amber
        },
        background: {
          light: '#f5f5f5',
          dark: '#0a0a0a',
        },
        foreground: {
          light: '#111111',
          dark: '#ededed',
        },
        glass: 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular']
      },
    },
  },
  plugins: [],
};
