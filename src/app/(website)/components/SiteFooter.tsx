import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@/payload.config'

const label = 'text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-4'

/** Closing call-to-action and contact details, shown at the end of the marketing pages. */
export default async function SiteFooter() {
  const payload = await getPayload({ config })
  const [contact, header] = await Promise.all([
    payload.findGlobal({ slug: 'contact-config' }),
    payload.findGlobal({ slug: 'header-config' }),
  ])

  return (
    <footer className="bg-zinc-950 text-white">
      <div className="max-w-[1440px] mx-auto px-6 md:px-14 pt-20 md:pt-32 pb-10">
        <p className={label}>Ready when you are</p>

        <Link href="/booking" className="group block outline-none">
          <span className="flex items-end gap-4 md:gap-8 text-[clamp(3rem,11vw,10rem)] font-extrabold uppercase tracking-tighter leading-[0.85]">
            <span>
              Book your
              <br />
              session
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-[0.7em] h-[0.7em] mb-[0.08em] shrink-0 transition-transform duration-500 group-hover:translate-x-3 group-focus-visible:translate-x-3"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        <div className="mt-16 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-10 border-t-2 border-white pt-10">
          <div>
            <p className={label}>Visit</p>
            <p className="text-lg md:text-xl font-semibold whitespace-pre-line">{contact.address}</p>
          </div>
          <div>
            <p className={label}>Contact</p>
            <p className="text-lg md:text-xl font-semibold">
              <a href={`mailto:${contact.email}`} className="hover:underline underline-offset-4">
                {contact.email}
              </a>
              <br />
              <a href={`tel:${contact.phoneNumber}`} className="hover:underline underline-offset-4">
                {contact.phoneNumber}
              </a>
            </p>
          </div>
          <div>
            <p className={label}>Hours</p>
            <p className="text-lg md:text-xl font-semibold whitespace-pre-line">
              {contact.officeHours}
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          <span>
            © {new Date().getFullYear()} {header.clinicName}
          </span>
          <span className="flex gap-8">
            <Link href="/services" className="hover:text-white transition-colors">
              Services
            </Link>
            <Link href="/appointments" className="hover:text-white transition-colors">
              My visits
            </Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
