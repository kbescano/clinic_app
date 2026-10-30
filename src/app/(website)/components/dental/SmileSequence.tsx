'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { usePrefersReducedMotion } from '@/components/shared/motion'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import type { TeethScene } from './teeth/createTeethScene'
import { stages } from './data'
import { Eyebrow } from './ui'

// Where each stage starts on the pinned scroll (matches the camera keys in createTeethScene).
const BOUNDS = [0, 0.27, 0.5, 0.74, 1]
const CENTRES = [0.14, 0.4, 0.65, 0.9]

function StageBar({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const fill = useTransform(progress, [BOUNDS[index], BOUNDS[index + 1]], [0, 1])
  return (
    <span className="absolute left-0 top-0 h-full w-[2px] bg-white/15">
      <motion.span style={{ scaleY: fill, originY: 0 }} className="block h-full w-full bg-flame" />
    </span>
  )
}

/**
 * The mid-page centrepiece: a full set of teeth in 3D, pinned while the page scrolls past. Four
 * stages, each tied to a treatment: a scan sweeps the arch, the enamel whitens, a clear aligner
 * settles over the upper teeth, and a molar lifts away to show an implant. Scrolling back up plays
 * it in reverse.
 */
export default function SmileSequence() {
  const reduce = usePrefersReducedMotion()
  const { scrollTo } = useSmoothScroll()
  const runway = useRef<HTMLElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(0)
  const [unsupported, setUnsupported] = useState(false)

  // Progress while pinned (drives the model) and while passing through (drives the fade in and out).
  const { scrollYProgress: pinned } = useScroll({ target: runway, offset: ['start start', 'end end'] })
  const { scrollYProgress: passing } = useScroll({ target: runway, offset: ['start end', 'end start'] })
  const progress = useSpring(pinned, { stiffness: 70, damping: 22, mass: 0.8 })
  const sceneOpacity = useTransform(passing, [0.04, 0.17, 0.85, 0.97], [0, 1, 1, 0])

  const progressNow = useRef(0)
  useMotionValueEvent(progress, 'change', (v) => {
    progressNow.current = v
    const next = v < BOUNDS[1] ? 0 : v < BOUNDS[2] ? 1 : v < BOUNDS[3] ? 2 : 3
    setStage((s) => (s === next ? s : next))
  })

  const pointer = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const runwayEl = runway.current
    const hostEl = host.current
    if (!runwayEl || !hostEl) return
    let scene: TeethScene | null = null
    let started = false
    let cancelled = false
    let visible = false
    let timer: number | undefined

    const start = async () => {
      try {
        const { createTeethScene } = await import('./teeth/createTeethScene')
        if (cancelled) return
        scene = createTeethScene(hostEl, {
          getProgress: () => progressNow.current,
          getPointer: () => pointer.current,
          still: reduce,
        })
        scene.setActive(visible)
      } catch (error) {
        console.warn('3D teeth unavailable:', error)
        setUnsupported(true)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && !started) {
          started = true
          // Fetch the 3D code once the section is close, but never in competition with the hero.
          timer = window.setTimeout(() => void start(), 600)
        }
        scene?.setActive(visible)
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(runwayEl)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      observer.disconnect()
      scene?.dispose()
    }
  }, [reduce])

  const jumpTo = (i: number) => {
    const el = runway.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    scrollTo(top + (el.offsetHeight - window.innerHeight) * CENTRES[i])
  }

  return (
    <section id="smile" ref={runway} className={`relative bg-ink text-white ${reduce ? '' : 'h-[420vh]'}`}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_68%_52%,rgba(255,94,43,0.20),transparent_70%)]" />

        <motion.div
          ref={host}
          role="img"
          aria-label="A full set of teeth in 3D, shown being scanned, whitened, fitted with a clear aligner and given an implant"
          style={{ opacity: reduce ? 1 : sceneOpacity }}
          className={`absolute inset-x-0 bottom-[28%] top-0 md:bottom-0 md:left-[30%] ${unsupported ? 'hidden' : ''}`}
        />

        <div className="relative z-10 flex h-full flex-col justify-end p-6 pb-8 md:w-[40%] md:justify-center md:p-14 lg:p-20">
          <div className="hidden md:block">
            <Eyebrow tone="light">Your smile, in 3D</Eyebrow>
            <h2 className="max-w-[12ch] text-[clamp(2.4rem,4.4vw,4.6rem)] font-medium leading-[0.98] tracking-[-0.04em]">
              See every step before we begin.
            </h2>
          </div>

          <ol className="mt-0 space-y-1 md:mt-12">
            {stages.map((s, i) => {
              const active = i === stage
              const open = active || reduce
              return (
                <li key={s.title} className={open ? '' : 'hidden md:block'}>
                  <button onClick={() => jumpTo(i)} aria-current={active ? 'step' : undefined} className="relative block w-full py-3 pl-6 text-left">
                    <StageBar progress={progress} index={i} />
                    <span className={`block text-xl font-medium tracking-[-0.02em] transition-colors duration-500 md:text-2xl ${open ? 'text-white' : 'text-white/35 hover:text-white/60'}`}>
                      {s.title}
                    </span>
                    <span
                      className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <span className="overflow-hidden">
                        <span className="block max-w-sm pt-2 text-[15px] leading-relaxed text-white/70">{s.body}</span>
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          {/* Phones: which of the four stages you are on */}
          <div className="mt-4 flex gap-1.5 md:hidden" aria-hidden>
            {stages.map((s, i) => (
              <span key={s.title} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= stage ? 'bg-flame' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
