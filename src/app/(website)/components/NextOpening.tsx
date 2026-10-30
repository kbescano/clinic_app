'use client'

import Link from 'next/link'
import { useClinic } from './ClinicContext'
import { useNextOpening } from './useNextOpening'

/** A live "next opening" chip. Hidden when nothing is bookable or the lookup fails. */
export default function NextOpening({ className = '' }: { className?: string }) {
  const { slug, href } = useClinic()
  // undefined = still loading, null = nothing to show
  const slot = useNextOpening(slug)

  if (slot === null) return null

  return (
    <Link
      href={href('/booking')}
      className={`group flex items-center gap-4 border border-white/40 bg-black/35 px-5 py-4 text-white backdrop-blur-md transition-colors duration-300 hover:bg-white hover:text-zinc-950 ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <span className="flex min-w-[9.5rem] flex-col leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">Next opening</span>
        {slot ? (
          <span className="mt-1 text-base font-extrabold tracking-tight md:text-lg">
            {slot.dayLabel} · {slot.timeLabel}
          </span>
        ) : (
          <span className="mt-1.5 h-4 w-32 animate-pulse bg-white/30" />
        )}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="shrink-0 transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  )
}
