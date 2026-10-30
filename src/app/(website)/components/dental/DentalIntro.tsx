'use client'

import { CalendarDaysIcon, DocumentCheckIcon, HandRaisedIcon, ViewfinderCircleIcon } from '@heroicons/react/24/outline'
import { Reveal } from '@/components/shared/motion'
import { promises } from './data'
import { Eyebrow, ScrollWords } from './ui'

const ICONS = [CalendarDaysIcon, ViewfinderCircleIcon, DocumentCheckIcon, HandRaisedIcon]

export default function DentalIntro() {
  return (
    <section className="bg-paper px-5 py-24 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-16 md:grid-cols-12">
        <div className="md:col-span-7">
          <Eyebrow>A dental studio that feels different</Eyebrow>
          <ScrollWords
            text="We built Ivory for people who put off the dentist. Quiet rooms, honest prices and care that is explained in plain words, so every visit feels a little lighter than the last."
            className="text-[clamp(1.9rem,3.6vw,3.6rem)] font-medium leading-[1.08] tracking-[-0.03em] text-ink"
          />
        </div>

        <ul className="self-end md:col-span-4 md:col-start-9">
          {promises.map((p, i) => {
            const Icon = ICONS[i]
            return (
              <Reveal key={p.title} delay={i * 0.06}>
                <li className="flex gap-4 border-t border-ink/15 py-5 last:border-b">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-flame" strokeWidth={1.8} />
                  <div>
                    <p className="text-[17px] font-medium text-ink">{p.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-bark/80">{p.body}</p>
                  </div>
                </li>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
