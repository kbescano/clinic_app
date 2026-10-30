'use client'

import { useRef } from 'react'
import { useInView } from 'motion/react'
import { Parallax, Reveal, SplitReveal, usePrefersReducedMotion } from '@/components/shared/motion'
import SlideVideo from '@/components/shared/SlideVideo'
import { Eyebrow } from './ui'

const COMFORTS = [
  { title: 'Headphones and a ceiling screen', body: 'Your playlist or a show, so the sound of the room fades away.' },
  { title: 'Warm blanket, cool room', body: 'Small comforts that make a long appointment feel short.' },
  { title: 'Raise a hand, we stop', body: 'Breaks whenever you need them. You stay in control.' },
]

export default function DentalCalm() {
  const reduce = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' })

  return (
    <section className="bg-ink px-5 py-24 text-white md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <Eyebrow tone="light">The experience</Eyebrow>
          <SplitReveal as="h2" text="Calm, by design." stagger={0.1} className="block text-[clamp(3.4rem,10vw,10rem)] font-medium leading-[0.88] tracking-[-0.055em]" />
          <Reveal delay={0.15}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70">
              Most people do not dread the treatment, they dread the room. So we started with the room: daylight, quiet, and a team
              that talks you through every step.
            </p>
          </Reveal>
        </div>
        <div ref={ref} className="md:col-span-5">
          <Parallax amount={6} className="aspect-[4/5] rounded-xl bg-[#2a2522]">
            <SlideVideo clip={{ id: 6755020, fps: 25 }} active={inView} still={reduce} />
          </Parallax>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-[1400px] gap-10 border-t border-white/15 pt-10 md:mt-28 md:grid-cols-3">
        {COMFORTS.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <p className="flex items-center gap-3 text-xl font-medium tracking-[-0.02em]">
              <span className="h-2 w-2 rounded-full bg-flame" />
              {c.title}
            </p>
            <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/60">{c.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
