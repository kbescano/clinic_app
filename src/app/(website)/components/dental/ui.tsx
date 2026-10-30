'use client'

import type { ReactNode } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { usePrefersReducedMotion } from '@/components/shared/motion'

export const btnPrimary =
  'inline-flex items-center gap-3 rounded-[4px] bg-flame px-5 py-3.5 text-[15px] font-medium text-ink transition-[filter,transform] duration-200 hover:brightness-95 active:scale-[0.98]'
export const btnGlass =
  'inline-flex items-center gap-3 rounded-[4px] bg-white/15 px-5 py-3.5 text-[15px] font-medium text-white ring-1 ring-white/40 backdrop-blur-md transition-colors duration-200 hover:bg-white hover:text-ink'
export const btnPaper =
  'inline-flex items-center gap-3 rounded-[4px] bg-white px-5 py-3.5 text-[15px] font-medium text-ink ring-1 ring-sand transition-shadow duration-200 hover:ring-ink'
export const btnInk =
  'inline-flex items-center gap-3 rounded-[4px] bg-ink px-5 py-3.5 text-[15px] font-medium text-white transition-[filter,transform] duration-200 hover:brightness-125 active:scale-[0.98]'

export const Arrow = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const ToothMark = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden className={className}>
    <path d="M6 2.5C3.6 2.5 2 4.4 2 7c0 3 1.3 5 1.9 8.6.4 2.5.9 5.4 2.3 5.4 1.5 0 1.6-3.8 3.8-3.8s2.3 3.8 3.8 3.8c1.4 0 1.9-2.9 2.3-5.4C16.7 12 18 10 18 7c0-2.6-1.6-4.5-4-4.5-1.7 0-2.4.9-4 .9s-2.3-.9-4-.9z" />
  </svg>
)

export function Eyebrow({ children, tone = 'dark' }: { children: ReactNode; tone?: 'dark' | 'light' }) {
  return (
    <p className={`mb-6 flex items-center gap-3 text-sm font-medium ${tone === 'light' ? 'text-white/70' : 'text-stone'}`}>
      <span className="h-2 w-2 rounded-full bg-flame" />
      {children}
    </p>
  )
}

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return <motion.span style={{ opacity }}>{word} </motion.span>
}

/** A statement that darkens word by word as it scrolls through the viewport. */
export function ScrollWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = text.split(' ')
  if (reduce) return <p className={className}>{text}</p>
  return (
    <p ref={ref} className={className} aria-label={text}>
      <span aria-hidden>
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </span>
    </p>
  )
}
