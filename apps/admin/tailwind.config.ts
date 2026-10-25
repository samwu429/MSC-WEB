import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f6f1fa',
          100: '#ece3f5',
          200: '#d9c8ea',
          600: '#7240a0',
          700: '#5B2A86',
          800: '#3C165F',
          900: '#2A1044',
        },
        gold: { 100: '#fff4cc', 500: '#FFD23F', 600: '#e8b90f', 700: '#8a6a00' },
        canvas: '#F5F3EF',
        ink: { DEFAULT: '#2C2140', soft: '#4A4155', muted: '#6B6570' },
        line: { DEFAULT: '#E4E0D8', strong: '#D4CDC0' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'Songti SC', 'Noto Serif SC', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
