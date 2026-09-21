import { Inter_Tight } from 'next/font/google'

// Variable font: heavy weights (800) for headings without a second family.
export const display = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})
