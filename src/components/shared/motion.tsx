'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

/** The house easing: fast out, long settle. */
export const EASE = [0.16, 1, 0.3, 1] as const

const IN_VIEW = { once: true, margin: '0px 0px -10% 0px' } as const

// motion.create() must not run during render (it would mint a new component type each time and
// remount the text), so tags are created once and reused.
const motionTags = new Map<ElementType, typeof motion.span>()
function motionTag(tag: ElementType) {
  let component = motionTags.get(tag)
  if (!component) {
    component = motion.create(tag as 'span') as typeof motion.span
    motionTags.set(tag, component)
  }
  return component
}

/** Honours the visitor's OS "reduce motion" setting for every motion component below it. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Headline text that rises out of a mask, word by word. Pass `state` to drive it from outside (the
 * hero slides); leave it off and it plays once when scrolled into view. The words are aria-hidden
 * and the whole phrase is exposed as one label, so screen readers do not hear it letter-chopped.
 */
export function SplitReveal({
  text,
  as: Tag = 'span',
  className,
  delay = 0,
  stagger = 0.06,
  state,
}: {
  text: string
  as?: ElementType
  className?: string
  delay?: number
  stagger?: number
  state?: 'in' | 'out'
}) {
  const MotionTag = motionTag(Tag)
  const container = {
    out: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
    in: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
  const word = {
    out: { y: '115%', transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] as const } },
    in: { y: '0%', transition: { duration: 0.95, ease: EASE } },
  }

  return (
    <MotionTag
      className={className}
      aria-label={text}
      variants={container}
      initial="out"
      animate={state}
      whileInView={state ? undefined : 'in'}
      viewport={IN_VIEW}
    >
      {text.split(' ').map((w, i) => (
        <span key={i} aria-hidden>
          {i > 0 && ' '}
          {/* The mask is padded so ascenders and descenders are not clipped. */}
          <span className="-my-[0.1em] inline-block overflow-hidden py-[0.1em] align-bottom">
            <motion.span variants={word} className="inline-block will-change-transform">
              {w}
            </motion.span>
          </span>
        </span>
      ))}
    </MotionTag>
  )
}

/** Wipes its children open (top to bottom) as they enter the viewport. */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
      whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
      viewport={IN_VIEW}
      transition={{ duration: 1.2, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slides its content slower than the page as it crosses the viewport, which is what makes an image
 * feel like it sits behind the frame. The content is scaled up slightly so edges never show.
 */
export function Parallax({
  children,
  className = '',
  amount = 8,
}: {
  children: ReactNode
  className?: string
  /** Travel in percent of the element's height, each way. */
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [`${-amount}%`, `${amount}%`])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={reduce ? undefined : { y, scale: 1 + (amount / 100) * 2.4 }}
        className="relative h-full w-full will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  )
}
