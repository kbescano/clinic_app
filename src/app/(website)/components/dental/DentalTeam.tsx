'use client'

import { ClipReveal, Reveal, SplitReveal } from '@/components/shared/motion'
import type { Dentist } from './data'
import { Eyebrow } from './ui'

const COUNT = ['No dentists', 'One dentist', 'Two dentists', 'Three dentists', 'Four dentists', 'Five dentists', 'Six dentists']

export default function DentalTeam({ team }: { team: Dentist[] }) {
  if (team.length === 0) return null
  return (
    <section id="team" className="bg-paper px-5 py-24 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>The team</Eyebrow>
            <SplitReveal as="h2" text="People you will want to come back to." className="block max-w-[16ch] text-[clamp(2.6rem,6vw,6rem)] font-medium leading-[0.95] tracking-[-0.045em] text-ink" />
          </div>
          <p className="text-[17px] leading-relaxed text-bark/80 md:col-span-4 md:col-start-9">
            {COUNT[team.length] ?? `${team.length} dentists`}, one approach: explain first, treat second, and never rush.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {team.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}>
              <article className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-sand">
                  <ClipReveal className="absolute inset-0" delay={i * 0.08}>
                    <img
                      src={d.image}
                      alt={d.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                  </ClipReveal>
                  {/* Bio slides up on hover (and is always visible to screen readers) */}
                  <div className="absolute inset-x-3 bottom-3 translate-y-[120%] rounded-lg bg-paper/90 p-4 text-[15px] leading-relaxed text-ink backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
                    {d.bio}
                  </div>
                </div>
                <h3 className="mt-5 text-2xl font-medium tracking-[-0.02em] text-ink">{d.name}</h3>
                <p className="mt-1 text-[15px] text-stone">{d.role}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
