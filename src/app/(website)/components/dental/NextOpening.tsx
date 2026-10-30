'use client'

import Link from 'next/link'
import { useClinic } from '../ClinicContext'
import { useNextOpening } from '../useNextOpening'

/** "Next opening" chip over the hero, from the clinic's live availability. Hidden when nothing is free. */
export default function NextOpening() {
  const { slug, href } = useClinic()
  const slot = useNextOpening(slug)
  if (slot === null) return null

  return (
    <Link
      href={href('/booking')}
      className="group flex items-center gap-4 rounded-full bg-white/15 py-2.5 pl-4 pr-3 text-left text-white ring-1 ring-white/40 backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-ink"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <span className="flex min-w-[9.5rem] flex-col leading-tight">
        <span className="text-xs opacity-75">Next opening</span>
        {slot ? (
          <span className="text-[15px] font-medium">
            {slot.dayLabel} · {slot.timeLabel}
          </span>
        ) : (
          <span className="mt-1 h-4 w-32 animate-pulse rounded bg-white/30" />
        )}
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  )
}
