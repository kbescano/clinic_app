'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { EASE, SplitReveal, usePrefersReducedMotion } from '@/components/shared/motion'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import NextOpening from './NextOpening'
import { useClinic } from './ClinicContext'

interface Slide {
  label: string
  title: string
  cta: string
  /** On-page anchors scroll smoothly; everything else is a normal link. */
  href: string
  /** Pexels clip id and frame rate: the CDN serves 1080p and 540p files of each (the 4K original is up to 35 MB). */
  clip: { id: number; fps: number }
  /** Shown while (or instead of) the footage, so a slow or blocked video never leaves a black void. */
  tint: string
}

const SLIDES: Slide[] = [
  {
    label: 'Clinical Treatments',
    title: 'The Art of Rejuvenation',
    cta: 'Discover the process',
    href: '#services',
    clip: { id: 4267991, fps: 30 },
    tint: 'from-zinc-700 via-zinc-900 to-black',
  },
  {
    label: 'The Collection',
    title: 'Your Daily Ritual',
    cta: 'View treatments',
    href: '#services',
    clip: { id: 4264901, fps: 30 },
    tint: 'from-stone-600 via-stone-900 to-black',
  },
  {
    label: 'Advanced Dermal',
    title: 'Precision Skin Care',
    cta: 'Book an analysis',
    href: '/booking',
    clip: { id: 8204093, fps: 25 },
    tint: 'from-slate-600 via-slate-900 to-black',
  },
]

const SLIDE_MS = 6500

const clipUrl = ({ id, fps }: Slide['clip'], quality: 'hd_1920_1080' | 'sd_960_540') =>
  `https://videos.pexels.com/video-files/${id}/${id}-${quality}_${fps}fps.mp4`

function SlideVideo({
  clip,
  active,
  still,
  onReady,
}: {
  clip: Slide['clip']
  active: boolean
  still: boolean
  onReady: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string>()
  const [loaded, setLoaded] = useState(false)

  // Phones and data-saver users get the 540p file; everyone else 1080p. Chosen after mount so the
  // server and client markup match.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
    const small = window.matchMedia('(max-width: 767px)').matches || saveData
    setSrc(clipUrl(clip, small ? 'sd_960_540' : 'hd_1920_1080'))
  }, [clip])

  // Only the visible clip plays. The outgoing one keeps running just long enough to finish its fade.
  useEffect(() => {
    const video = ref.current
    if (!video || !src) return
    video.muted = true
    if (still) {
      video.pause()
      return
    }
    if (active) {
      video.play().catch(() => {})
      return
    }
    const timer = window.setTimeout(() => video.pause(), 2200)
    return () => window.clearTimeout(timer)
  }, [active, still, src])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => {
        setLoaded(true)
        onReady()
      }}
      className={`h-full w-full object-cover transition-opacity duration-[1600ms] ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}

export default function CinematicVideoHero() {
  const reduce = usePrefersReducedMotion()
  const { scrollTo } = useSmoothScroll()
  const { href } = useClinic()
  const [current, setCurrent] = useState(0)
  const [hidden, setHidden] = useState(false)
  // Flags live in refs so that clearing "dwell done" and changing slide happen in the same step.
  // (As state, the advance check re-ran while the flag was still set and skipped a slide.)
  const readyRef = useRef<boolean[]>(SLIDES.map(() => false))
  const dwellDoneRef = useRef(false)
  const [tick, setTick] = useState(0)

  // Each slide gets a full dwell, restarting whenever the slide changes (including manual picks).
  useEffect(() => {
    dwellDoneRef.current = false
    if (reduce || hidden) return
    const timer = window.setTimeout(() => {
      dwellDoneRef.current = true
      setTick((t) => t + 1)
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [current, reduce, hidden])

  // ...then moves on to the next clip that is actually ready to play. A clip that is still
  // downloading is waited for, and one that never loads is skipped, so the hero never shows an
  // empty gradient where footage should be.
  useEffect(() => {
    if (!dwellDoneRef.current) return
    for (let step = 1; step < SLIDES.length; step++) {
      const index = (current + step) % SLIDES.length
      if (readyRef.current[index]) {
        dwellDoneRef.current = false
        setCurrent(index)
        return
      }
    }
  }, [tick, current])

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Scroll-linked exit: the footage drifts and darkens while the headline lifts away, so the page
  // below feels like it is sliding over a scene instead of covering a flat picture.
  const viewport = useRef(900)
  useEffect(() => {
    const measure = () => (viewport.current = window.innerHeight)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { scrollY } = useScroll()
  const progress = useTransform(scrollY, (v) => Math.min(1, Math.max(0, v / viewport.current)))
  const mediaScale = useTransform(progress, [0, 1], [1, 1.16])
  const mediaY = useTransform(progress, [0, 1], ['0%', '10%'])
  const contentY = useTransform(progress, [0, 1], ['0vh', '-16vh'])
  const contentOpacity = useTransform(progress, [0, 0.55], [1, 0])
  const veil = useTransform(progress, [0, 1], [0, 0.7])

  return (
    <section className="relative h-[100dvh] overflow-hidden bg-[#050505] font-display text-white">
      <h1 className="sr-only">{SLIDES[current].title}</h1>

      {/* FOOTAGE */}
      <motion.div
        style={{ scale: reduce ? 1 : mediaScale, y: reduce ? 0 : mediaY }}
        className="absolute inset-0 will-change-transform"
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.clip.id}
            className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-[2000ms] ease-out ${slide.tint} ${
              current === i ? 'z-10 opacity-100' : 'z-0 opacity-0'
            }`}
          >
            <SlideVideo
              clip={slide.clip}
              active={current === i}
              still={reduce}
              onReady={() => {
                if (readyRef.current[i]) return
                readyRef.current[i] = true
                setTick((t) => t + 1)
              }}
            />
          </div>
        ))}
      </motion.div>

      {/* SCRIMS: one for legibility under the text, one that deepens as you scroll away */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle,transparent_25%,rgba(0,0,0,0.45)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/10 to-black/45" />
      <motion.div
        style={{ opacity: veil }}
        className="pointer-events-none absolute inset-0 z-20 bg-black"
      />

      {/* HEADLINES */}
      <motion.div
        style={{ y: reduce ? 0 : contentY, opacity: reduce ? 1 : contentOpacity }}
        className="absolute inset-0 z-40"
      >
        {SLIDES.map((slide, i) => {
          const active = current === i
          const state = active ? 'in' : 'out'
          const isAnchor = slide.href.startsWith('#')
          const buttonClass =
            'group inline-flex items-center gap-4 bg-white px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-950 transition-colors duration-300 hover:bg-zinc-200 md:px-9 md:py-5 md:text-sm'
          const arrow = (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )

          return (
            <div
              key={slide.title}
              aria-hidden={!active}
              className={`absolute bottom-28 left-6 right-6 flex flex-col items-start md:bottom-32 md:left-14 md:right-14 ${
                active ? '' : 'pointer-events-none'
              }`}
            >
              <motion.p
                animate={{ opacity: active ? 1 : 0, x: active ? 0 : -16 }}
                transition={{ duration: 0.8, ease: EASE, delay: active ? 0.5 : 0 }}
                className="mb-5 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.3em] md:mb-8 md:text-sm"
              >
                <span className="h-px w-10 bg-white" />
                {slide.label}
              </motion.p>

              <SplitReveal
                as="p"
                text={slide.title}
                state={state}
                delay={0.6}
                className="mb-8 block max-w-[16ch] text-balance text-[clamp(2.75rem,9.5vw,10rem)] font-extrabold uppercase leading-[0.86] tracking-tighter md:mb-12"
              />

              <motion.div
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }}
                transition={{ duration: 0.8, ease: EASE, delay: active ? 1.0 : 0 }}
              >
                {isAnchor ? (
                  <a
                    href={slide.href}
                    tabIndex={active ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo(slide.href, { offset: -80 })
                    }}
                    className={buttonClass}
                  >
                    {slide.cta}
                    {arrow}
                  </a>
                ) : (
                  <Link href={href(slide.href)} tabIndex={active ? 0 : -1} className={buttonClass}>
                    {slide.cta}
                    {arrow}
                  </Link>
                )}
              </motion.div>
            </div>
          )
        })}
      </motion.div>

      {/* LIVE AVAILABILITY */}
      <motion.div
        style={{ opacity: reduce ? 1 : contentOpacity }}
        className="absolute bottom-6 right-5 z-50 md:bottom-10 md:right-14"
      >
        <NextOpening />
      </motion.div>

      {/* SLIDE PICKER: segments fill over the dwell time */}
      <div
        className="absolute bottom-7 left-5 z-50 flex items-end gap-1 md:bottom-11 md:left-14"
        role="group"
        aria-label="Choose slide"
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            aria-current={current === i}
            className="group flex h-8 w-9 items-end md:w-12"
          >
            <span className="relative block h-[3px] w-full overflow-hidden bg-white/30 transition-colors group-hover:bg-white/50">
              <motion.span
                key={`${i}-${current === i}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: current === i ? 1 : 0 }}
                transition={{
                  duration: current === i && !reduce ? SLIDE_MS / 1000 : 0.01,
                  ease: 'linear',
                }}
                style={{ originX: 0 }}
                className="absolute inset-0 bg-white"
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
