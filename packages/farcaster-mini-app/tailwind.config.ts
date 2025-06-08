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
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
