import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  safelist: [
    {
      pattern: /bg-(app-blue|app-cyan|app-gray|app-purple)/,
      variants: ['dark'],
    },
    {
      pattern: /text-(app-blue|app-cyan|app-gray|app-purple)/,
      variants: ['dark'],
    },
    {
      pattern: /border-(app-blue|app-cyan|app-gray|app-purple)/,
      variants: ['dark'],
    },
  ],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-satoshi)', 'sans-serif'],
        satoshi: ['var(--font-satoshi)', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'app-blue': '#F172AEB',
        'app-cyan': '#14b6d3',
        'app-gray': '#111827',
        'app-purple': '#371a58',
        'app-dark': '#202738',
        'app-light': '#9ca1b0',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1728px',
      '4xl': '1920px',
      '5xl': '2048px',
      '6xl': '2560px',
      '7xl': '2880px',
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
