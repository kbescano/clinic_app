import React from 'react'
import Link from 'next/link'
import type { Tenant } from '@/payload-types'
import { clinicPath } from '@/lib/clinics'
import { Reveal, SplitReveal } from '@/components/shared/motion'
import BackToTop from './BackToTop'

const label = 'text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-4'

/** Closing call-to-action and contact details, shown at the end of the marketing pages. */
export default function SiteFooter({ tenant }: { tenant: Tenant }) {
  const { contact } = tenant
  const href = (path: string) => clinicPath(tenant.slug, path)

  return (
    <footer className="bg-zinc-950 font-display text-white">
      <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-20 md:px-14 md:pt-32">
        <p className={label}>Ready when you are</p>

        <Link href={href('/booking')} className="group block outline-offset-8">
          <span className="flex items-end gap-4 text-[clamp(3rem,11vw,10rem)] font-extrabold uppercase leading-[0.85] tracking-tighter md:gap-8">
            <SplitReveal text="Book your session" stagger={0.09} className="block max-w-[8ch]" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="mb-[0.08em] h-[0.7em] w-[0.7em] shrink-0 transition-transform duration-500 group-hover:translate-x-3 group-focus-visible:translate-x-3"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        <Reveal className="mt-16 grid grid-cols-1 gap-10 border-t-2 border-white pt-10 md:mt-28 md:grid-cols-3">
          <div>
            <p className={label}>Visit</p>
            <p className="whitespace-pre-line text-lg font-semibold md:text-xl">{contact.address}</p>
          </div>
          <div>
            <p className={label}>Contact</p>
            <p className="text-lg font-semibold md:text-xl">
              <a href={`mailto:${contact.email}`} className="underline-offset-4 hover:underline">
                {contact.email}
              </a>
              <br />
              <a href={`tel:${contact.phoneNumber}`} className="underline-offset-4 hover:underline">
                {contact.phoneNumber}
              </a>
            </p>
          </div>
          <div>
            <p className={label}>Hours</p>
            <p className="whitespace-pre-line text-lg font-semibold md:text-xl">{contact.officeHours}</p>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col-reverse gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} {tenant.name}
          </span>
          <span className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href={href('/services')} className="transition-colors hover:text-white">
              Services
            </Link>
            <Link href={href('/appointments')} className="transition-colors hover:text-white">
              My visits
            </Link>
            <Link href="/login" className="transition-colors hover:text-white">
              Staff portal
            </Link>
            <Link href="/" className="transition-colors hover:text-white">
              Our other clinic
            </Link>
            <BackToTop />
          </span>
        </div>
      </div>
    </footer>
  )
}
