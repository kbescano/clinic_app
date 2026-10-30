'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'motion/react'
import { SplitReveal, usePrefersReducedMotion } from '@/components/shared/motion'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import { useDocumentHidden, useSlideCycle } from '@/components/shared/useSlideCycle'
import SlideVideo from '@/components/shared/SlideVideo'
import { useClinic } from '../ClinicContext'
import { heroClips } from './data'
import NextOpening from './NextOpening'
import { Arrow, Eyebrow, btnGlass, btnPrimary } from './ui'

const DWELL_MS = 7000

export default function DentalHero() {
  const reduce = usePrefersReducedMotion()
  const tabHidden = useDocumentHidden()
  const { current, setCurrent, markReady } = useSlideCycle(heroClips.length, DWELL_MS, reduce || tabHidden)
  const { name, contact, href } = useClinic()
  const { scrollTo } = useSmoothScroll()
  // The neighbourhood: the last line of the address.
  const area = contact.address.split(/\n|,/).map((part) => part.trim()).filter(Boolean).at(-2) ?? ''

  // As the page scrolls away, the footage pushes in and the copy lifts and fades.
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90])
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} className="bg-paper p-2 md:p-3">
      <div className="relative h-[calc(100dvh-16px)] min-h-[560px] overflow-hidden rounded-xl bg-[#2a2522] md:h-[calc(100dvh-24px)] md:rounded-2xl">
        <h1 className="sr-only">{name}: dentistry, made brighter</h1>

        <motion.div style={{ scale: reduce ? 1 : mediaScale }} className="absolute inset-0">
          {heroClips.map((h, i) => (
            <div key={h.clip.id} className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${current === i ? 'opacity-100' : 'opacity-0'}`}>
              <SlideVideo clip={h.clip} active={current === i} still={reduce} onReady={() => markReady(i)} />
            </div>
          ))}
        </motion.div>

        {/* Legibility: darker towards the copy at the bottom, a touch at the top for the nav. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />

        <motion.div
          style={{ y: reduce ? 0 : copyY, opacity: reduce ? 1 : copyOpacity }}
          className="absolute inset-x-0 bottom-0 p-6 pb-8 text-white md:p-12 lg:p-16"
        >
          <Eyebrow tone="light">
            {name}
            {area && ` · ${area}`}
          </Eyebrow>
          <SplitReveal
            as="p"
            text="Dentistry, made brighter."
            stagger={0.08}
            className="block max-w-[11ch] text-[clamp(3.2rem,9.2vw,9.5rem)] font-medium leading-[0.92] tracking-[-0.045em]"
          />

          <div className="mt-8 flex flex-col gap-8 md:mt-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-md space-y-6">
              <p className="text-lg leading-relaxed text-white/85">
                Calm rooms, clear prices, and dentists who explain everything before they begin.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={href('/booking')} className={btnPrimary}>
                  Book a visit <Arrow />
                </Link>
                <button onClick={() => scrollTo('#treatments', { offset: -90 })} className={btnGlass}>
                  Explore treatments
                </button>
              </div>
            </div>

            <div className="flex flex-col items-start gap-6 md:items-end">
              <NextOpening />
              <div className="flex gap-4" role="group" aria-label="Choose clip">
                {heroClips.map((h, i) => (
                  <button
                    key={h.clip.id}
                    onClick={() => setCurrent(i)}
                    aria-current={current === i}
                    className={`group w-24 text-left text-xs transition-colors md:w-28 ${current === i ? 'text-white' : 'text-white/55 hover:text-white/80'}`}
                  >
                    <span className="mb-2 block h-[2px] overflow-hidden rounded-full bg-white/25">
                      <motion.span
                        key={`${i}-${current === i}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: current === i ? 1 : 0 }}
                        transition={{ duration: current === i && !reduce ? DWELL_MS / 1000 : 0.01, ease: 'linear' }}
                        style={{ originX: 0 }}
                        className="block h-full w-full bg-white"
                      />
                    </span>
                    {h.caption}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
