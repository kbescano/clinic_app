'use client'

import Link from 'next/link'
import { Reveal, SplitReveal } from '@/components/shared/motion'
import { useSmoothScroll } from '@/components/shared/SmoothScroll'
import { useClinic } from '../ClinicContext'
import { useNextOpening } from '../useNextOpening'
import { Arrow, Eyebrow, btnInk } from './ui'

/** "Mon to Sat, 9:00 AM to 5:00 PM" (one line per schedule) → rows of days and times. */
function hoursRows(officeHours: string) {
  return officeHours
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cut = line.indexOf(',')
      return cut > 0 ? { days: line.slice(0, cut).trim(), time: line.slice(cut + 1).trim() } : { days: line, time: '' }
    })
}

export function DentalVisit() {
  const { slug, contact, href } = useClinic()
  const slot = useNextOpening(slug)

  return (
    <section id="visit" className="bg-paper px-5 py-24 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <Eyebrow>Visit</Eyebrow>
          <SplitReveal as="h2" text="Come and see the studio." className="block max-w-[12ch] text-[clamp(2.6rem,6vw,6rem)] font-medium leading-[0.95] tracking-[-0.045em] text-ink" />
          <Reveal delay={0.1} className="mt-12 grid gap-10 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-stone">Address</p>
              <p className="whitespace-pre-line text-lg leading-relaxed text-ink">{contact.address}</p>
              <p className="mb-3 mt-8 text-sm font-medium text-stone">Contact</p>
              <p className="text-lg leading-relaxed text-ink">
                <a href={`tel:${contact.phoneNumber}`} className="underline-offset-4 hover:underline">
                  {contact.phoneNumber}
                </a>
                <br />
                <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-stone">Hours</p>
              <dl className="text-[17px] text-ink">
                {hoursRows(contact.officeHours).map((h) => (
                  <div key={h.days} className="flex justify-between gap-6 border-t border-ink/15 py-3 last:border-b">
                    <dt>{h.days}</dt>
                    <dd className="text-right">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="md:col-span-5 md:col-start-8">
          <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl bg-flame p-8 text-ink md:p-12">
            <div>
              <p className="text-[15px] font-medium">Next opening</p>
              <p className="mt-2 text-[clamp(2.4rem,4.4vw,4rem)] font-medium leading-none tracking-[-0.04em]">
                {slot ? (
                  <>
                    {slot.dayLabel}
                    <br />
                    {slot.timeLabel}
                  </>
                ) : slot === null ? (
                  'Book online'
                ) : (
                  ' '
                )}
              </p>
            </div>
            <div className="space-y-5">
              <p className="max-w-xs text-[17px] leading-relaxed">New patients are welcome. Your first check-up includes a 3D scan.</p>
              <Link href={href('/booking')} className={btnInk}>
                Book a visit <Arrow />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function DentalFooter() {
  const { scrollTo } = useSmoothScroll()
  const { name, href } = useClinic()
  const [first] = name.split(' ')
  return (
    <footer className="overflow-hidden bg-ink px-5 pb-24 pt-16 text-white md:px-10 md:pb-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-6 text-[15px] text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              ['Treatments', '#treatments'],
              ['Smile in 3D', '#smile'],
              ['Team', '#team'],
              ['Visit', '#visit'],
            ].map(([label, target]) => (
              <button key={target} onClick={() => scrollTo(target, { offset: -90 })} className="transition-colors hover:text-white">
                {label}
              </button>
            ))}
            <Link href={href('/appointments')} className="transition-colors hover:text-white">
              My visits
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <Link href="/login" className="transition-colors hover:text-white">
              Staff portal
            </Link>
            <Link href="/" className="transition-colors hover:text-white">
              Our other clinic
            </Link>
            <button onClick={() => scrollTo(0)} className="transition-colors hover:text-white">
              Back to top ↑
            </button>
          </div>
        </div>
        <p aria-hidden className="mt-16 select-none text-[clamp(6rem,30vw,28rem)] font-medium leading-[0.78] tracking-[-0.07em] text-white">
          {first}
        </p>
        <p className="mt-8 text-sm text-white/40">
          © {new Date().getFullYear()} {name}
        </p>
      </div>
    </footer>
  )
}
