import { Instrument_Sans, Inter_Tight } from 'next/font/google'

// Variable font: heavy weights (800) for headings without a second family.
export const display = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// The dental clinic's face.
export const dental = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-dental',
  display: 'swap',
})
