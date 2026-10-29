'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { EquipmentScene } from './equipment/createEquipmentScene'

/**
 * A pinned 3D still life of clinic equipment. The section stays put while the page scrolls past it;
 * the scene fades up slowly on the way in, turns as you scroll, and dissolves on the way out,
 * running in reverse when you scroll back up. Three.js is only downloaded when the section is
 * within a couple of screens of the viewport.
 */
export default function EquipmentShowcase() {
  const reduce = useReducedMotion() ?? false
  const runway = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [unsupported, setUnsupported] = useState(false)

  // Spring-smoothed progress: the scene lags the scroll slightly, which is what makes it feel slow.
  const { scrollYProgress } = useScroll({ target: runway, offset: ['start end', 'end start'] })
  const progress = useSpring(scrollYProgress, { stiffness: 55, damping: 24, mass: 0.9 })
  const opacity = useTransform(progress, [0.06, 0.3, 0.7, 0.94], [0, 1, 1, 0])
  const wordX = useTransform(progress, [0, 1], ['4%', '-4%'])

  const progressNow = useRef(0)
  useMotionValueEvent(progress, 'change', (v) => (progressNow.current = v))

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

    let scene: EquipmentScene | null = null
    let started = false
    let cancelled = false
    let visible = false

    const start = async () => {
      try {
        const { createEquipmentScene } = await import('./equipment/createEquipmentScene')
        if (cancelled) return
        scene = createEquipmentScene(hostEl, {
          getProgress: () => progressNow.current,
          getPointer: () => pointer.current,
          still: reduce,
        })
        scene.setActive(visible)
      } catch (error) {
        // No WebGL (or it failed to start): the section simply shows its headline word.
        console.warn('3D equipment scene unavailable:', error)
        setUnsupported(true)
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && !started) {
          started = true
          void start()
        }
        scene?.setActive(visible)
      },
      { rootMargin: '150% 0px' },
    )
    observer.observe(runwayEl)

    return () => {
      cancelled = true
      observer.disconnect()
      scene?.dispose()
    }
  }, [reduce])

  return (
    // The runway is the scroll distance the pinned scene lasts for.
    <div ref={runway} className={`relative ${reduce ? 'h-[100dvh]' : 'h-[270vh]'}`}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-zinc-950">
        <motion.div style={reduce ? undefined : { opacity }} className="absolute inset-0">
          {/* Large word behind the scene; it drifts sideways against the scroll for parallax */}
          <motion.p
            aria-hidden
            style={reduce ? undefined : { x: wordX }}
            className="absolute inset-0 flex select-none items-center justify-center whitespace-nowrap font-display text-[clamp(4rem,16.5vw,24rem)] font-extrabold uppercase leading-none tracking-tighter text-white/[0.07]"
          >
            Precision
          </motion.p>

          <div
            ref={host}
            role="img"
            aria-label="Three-dimensional clinic equipment: a stethoscope, a syringe and capsules, turning slowly"
            className={`absolute inset-0 ${unsupported ? 'hidden' : ''}`}
          />
        </motion.div>
      </div>
    </div>
  )
}
