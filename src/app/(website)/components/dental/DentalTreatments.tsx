'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useInView } from 'motion/react'
import { Reveal, SplitReveal, usePrefersReducedMotion } from '@/components/shared/motion'
import SlideVideo from '@/components/shared/SlideVideo'
import { useClinic } from '../ClinicContext'
import type { Treatment } from './data'
import { Arrow, Eyebrow, btnPaper, btnPrimary } from './ui'

function Card({ t, featured }: { t: Treatment; featured?: boolean }) {
  const { href } = useClinic()
  const reduce = usePrefersReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' })

  return (
    <article ref={ref} className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-sand transition-shadow duration-500 hover:shadow-[0_24px_60px_-30px_rgba(65,58,58,0.45)]">
      <div className={`relative overflow-hidden bg-sand ${featured ? 'min-h-[360px] flex-1' : 'aspect-[4/3]'}`}>
        {t.clip ? (
          <SlideVideo clip={t.clip} active={inView} still={reduce} className="absolute inset-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
        ) : (
          <img
            src={t.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
          />
        )}
        {featured && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">Most booked</span>
        )}
      </div>
      <div className="flex flex-col gap-2 p-5 md:p-6">
        <h3 className={`font-medium tracking-[-0.02em] text-ink ${featured ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>{t.title}</h3>
        <p className="text-[15px] leading-relaxed text-bark/75">{t.blurb}</p>
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-sm text-stone">
            <span className="font-medium text-ink">{t.price}</span> · {t.duration}
          </p>
          <Link
            href={`${href('/booking')}?serviceId=${t.id}`}
            aria-label={`Book ${t.title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flame text-ink transition-transform duration-300 group-hover:translate-x-0.5 hover:scale-105"
          >
            <Arrow />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function DentalTreatments({ treatments }: { treatments: Treatment[] }) {
  const { href } = useClinic()
  // Emergency care gets its own banner; the rest fill the featured card and the grid.
  const emergency = treatments.find((t) => /emergency/i.test(t.title))
  const [lead, ...grid] = treatments.filter((t) => t !== emergency)
  if (!lead) return null
  return (
    <section id="treatments" className="bg-paper px-2 pb-24 md:px-3 md:pb-40">
      <div className="mx-auto max-w-[1400px] px-3 md:px-7">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Treatments</Eyebrow>
            <SplitReveal as="h2" text="Everything your smile needs." className="block max-w-[14ch] text-[clamp(2.6rem,6vw,6rem)] font-medium leading-[0.95] tracking-[-0.045em] text-ink" />
          </div>
          <div className="max-w-sm space-y-5">
            <p className="text-[17px] leading-relaxed text-bark/80">Prices are agreed with you before anything begins. No surprises on the way out.</p>
            <Link href={href('/booking')} className={btnPaper}>
              Book a visit <Arrow />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:grid-rows-2">
          <Reveal className="md:row-span-2">
            <Card t={lead} featured />
          </Reveal>
          {grid.slice(0, 4).map((t, i) => (
            <Reveal key={t.id} delay={0.05 * (i + 1)}>
              <Card t={t} />
            </Reveal>
          ))}
        </div>

        {emergency && (
        <Reveal className="mt-3">
          <div className="flex flex-col gap-6 overflow-hidden rounded-xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-5">
              <img src={emergency.image} alt="" loading="lazy" className="hidden h-20 w-20 shrink-0 rounded-lg object-cover sm:block" />
              <div>
                <h3 className="text-2xl font-medium tracking-[-0.02em]">{emergency.title}</h3>
                <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-white/65">
                  {emergency.blurb} We keep slots free every day for pain, chips and knocked-out teeth.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <p className="whitespace-nowrap text-sm text-white/60">
                <span className="font-medium text-white">{emergency.price}</span> · {emergency.duration}
              </p>
              <Link href={`${href('/booking')}?serviceId=${emergency.id}`} className={`${btnPrimary} whitespace-nowrap`}>
                Urgent slot <Arrow />
              </Link>
            </div>
          </div>
        </Reveal>
        )}
      </div>
    </section>
  )
}
