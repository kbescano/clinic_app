import defaultColors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display, ui-sans-serif)', 'system-ui', 'sans-serif'],
        // Dental clinic: friendly, regular-weight sans on warm paper.
        dental: ['var(--font-dental, ui-sans-serif)', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        // Dental clinic palette: warm paper, ink and one hot accent.
        paper: '#f5f1ee',
        sand: '#e8e4e1',
        // `stone` alone is the dental grey; the stone-50…950 scale stays available.
        stone: { ...defaultColors.stone, DEFAULT: '#968b88' },
        bark: '#413a3a',
        ink: '#0a0a0a',
        flame: '#ff5e2b',
        cobalt: '#2d4fff',
      },
    },
  },
  plugins: [],
}

export default config
