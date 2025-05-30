/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
  darkMode: ['selector', '[class="app-dark"]'],
  content: [
    './apps/playground/src/**/*.{html,ts,scss,css}',
    './libs/smz-core/src/**/*.{html,ts,scss,css}',
    './libs/smz-layout/src/**/*.{html,ts,scss,css}',
    './libs/smz-forms/src/**/*.{html,ts,scss,css}',
  ],
  plugins: [PrimeUI],
  theme: {
    screens: {
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1920px',
    },
    extend: {
      colors: {
        'surface-border': 'var(--surface-border)',
      },
    },
  },
};
