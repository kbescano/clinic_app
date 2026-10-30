'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { EASE, usePrefersReducedMotion } from '@/components/shared/motion'
import { useDocumentHidden } from '@/components/shared/useSlideCycle'
import SlideVideo from '@/components/shared/SlideVideo'
import type { Clip } from '@/lib/media'
import type { ClinicSlug } from '@/lib/clinics'

interface Panel {
  id: ClinicSlug
  kicker: string
  fallbackName: string
  line: string
  clip: Clip
}

const PANELS: Panel[] = [
  {
    id: 'skin',
    kicker: 'Skin care clinic',
    fallbackName: 'Skin',
    line: 'Facials, peels and skin treatments, planned by dermatologists.',
    clip: { id: 4267991, fps: 30 },
  },
  {
    id: 'dental',
    kicker: 'Dental studio',
    fallbackName: 'Dental',
    line: 'Check-ups, whitening, aligners and implants, explained before we begin.',
    clip: { id: 3762905, fps: 25 },
  },
]

/** The landing page: pick a clinic. The chosen half grows to fill the screen, then its site opens. */
export default function Chooser({ names }: { names: Partial<Record<ClinicSlug, string>> }) {
  const router = useRouter()
  const reduce = usePrefersReducedMotion()
  const hidden = useDocumentHidden()
  const [hover, setHover] = useState<ClinicSlug | null>(null)
  const [chosen, setChosen] = useState<ClinicSlug | null>(null)

  const panels = PANELS.filter((p) => names[p.id])

  const choose = (id: ClinicSlug) => {
    if (chosen) return
    if (reduce) return router.push(`/${id}`)
    setChosen(id)
    router.prefetch(`/${id}`)
    window.setTimeout(() => router.push(`/${id}`), 650)
  }

  const grow = (id: ClinicSlug) => (chosen ? (chosen === id ? 12 : 0.0001) : hover === id ? 1.35 : 1)

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-black md:flex-row">
      {panels.map((p) => {
        const isSkin = p.id === 'skin'
        const dimmed = (hover && hover !== p.id) || (chosen && chosen !== p.id)
        return (
          <motion.a
            key={p.id}
            href={`/${p.id}`}
            onClick={(e) => {
              e.preventDefault()
              choose(p.id)
            }}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p.id)}
            onBlur={() => setHover(null)}
            animate={{ flexGrow: grow(p.id) }}
            transition={{ duration: chosen ? 0.65 : 0.8, ease: EASE }}
            style={{ flexBasis: 0 }}
            className={`group relative min-h-0 min-w-0 overflow-hidden text-white outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white ${
              isSkin ? 'font-display' : 'font-dental'
            }`}
            aria-label={`Open the ${p.kicker.toLowerCase()}: ${names[p.id]}`}
          >
            <div className={`absolute inset-0 transition-transform duration-[1400ms] ease-out group-hover:scale-105 ${isSkin ? 'bg-zinc-800' : 'bg-[#3a302b]'}`}>
              <SlideVideo clip={p.clip} active={!hidden} still={reduce} />
            </div>
            <div className={`absolute inset-0 transition-colors duration-700 ${dimmed ? 'bg-black/70' : isSkin ? 'bg-black/45' : 'bg-black/35'}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 md:p-12">
              <p
                className={
                  isSkin
                    ? 'mb-3 text-xs font-bold uppercase tracking-[0.3em] text-white/80'
                    : 'mb-3 flex items-center gap-2 text-sm font-medium text-white/80'
                }
              >
                {!isSkin && <span className="h-2 w-2 rounded-full bg-flame" />}
                {p.kicker}
              </p>
              <p
                className={
                  isSkin
                    ? 'max-w-[12ch] text-[clamp(2.8rem,7vw,7rem)] font-extrabold uppercase leading-[0.88] tracking-tighter'
                    : 'max-w-[12ch] text-[clamp(3rem,7.5vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.06em]'
                }
              >
                {names[p.id] ?? p.fallbackName}
              </p>
              <p className="mt-4 hidden max-w-sm text-[15px] leading-relaxed text-white/75 sm:block md:mt-6">{p.line}</p>
              <span
                className={`mt-5 inline-flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-1 md:mt-8 ${
                  isSkin
                    ? 'bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-950'
                    : 'rounded-[4px] bg-flame px-5 py-3 text-[15px] font-medium text-ink'
                }`}
              >
                Enter site
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </motion.a>
        )
      })}

      {/* Heading over the seam */}
      <motion.div
        animate={{ opacity: chosen ? 0 : 1 }}
        className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center px-6 pt-8 text-center text-white md:pt-12"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/70">Our clinics</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight md:text-4xl">Where would you like to go?</h1>
      </motion.div>

      <Link
        href="/login"
        className="absolute right-4 top-4 rounded-full bg-black/40 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md transition-colors hover:bg-white hover:text-black md:right-6 md:top-6"
      >
        Staff portal
      </Link>
    </div>
  )
}
