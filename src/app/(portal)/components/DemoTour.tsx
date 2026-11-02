'use client'

import React, { useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  CursorArrowRaysIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

/**
 * A short welcome tour for demo visitors (most arrive from an email link and have never seen the
 * portal): one card per page in the top bar, then where to find help. Opens by itself once per
 * browser session; the demo strip's "Tour" button opens it again.
 */
const steps = (clinicName: string) => [
  {
    icon: SparklesIcon,
    title: `Welcome to the ${clinicName || 'clinic'} demo`,
    body: "This is a working staff portal filled with sample bookings. Look around freely: nothing you click here changes anything. Here's a quick look at the four pages in the bar at the top.",
  },
  {
    icon: CalendarDaysIcon,
    title: 'Dashboard',
    body: "Today's schedule at a glance: who's coming in, and revenue split into Projected (booked), Settled (completed) and Pending (still to come in). Switch to the next 7 days at the top.",
  },
  {
    icon: ClipboardDocumentCheckIcon,
    title: 'Bookings',
    body: 'Every booking in one list, with search and filters. Confirm a booking, press Completed after the visit, or × to cancel and free the slot. Completed visits are what count as revenue.',
  },
  {
    icon: ClipboardDocumentListIcon,
    title: 'History',
    body: "Patient records: each patient's past visits and the notes written after them, found in seconds instead of a drawer of cards.",
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics',
    body: 'Revenue and booking trends for today, this week, this month, this year or all time, sales by service, and reports you can download.',
  },
  {
    icon: CursorArrowRaysIcon,
    title: 'Help is on hover',
    body: 'Point at anything in the top bar for a short explanation. Open this tour again from "Tour" in the black strip, or press "Exit demo" when you are done.',
  },
]

const SEEN_KEY = 'portal-demo-tour-seen'

export default function DemoTour({ clinicName, open, onOpenChange }: { clinicName: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [index, setIndex] = useState(0)
  const all = steps(clinicName)
  const step = all[index]
  const last = index === all.length - 1

  // First demo page of this browser session: open by itself.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      return // storage blocked: no automatic tour, the button still works
    }
    onOpenChange(true)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpenChange(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open || !step) return null
  const Icon = step.icon
  const close = () => {
    onOpenChange(false)
    setIndex(0)
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 font-serif animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-md" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-tour-title"
        className="relative w-full max-w-md rounded-[2rem] border border-zinc-100 bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-[#251101] dark:bg-zinc-800 dark:text-white">
            <Icon className="h-6 w-6" />
          </span>
          <button
            onClick={close}
            aria-label="Skip the tour"
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-[9px] uppercase tracking-[0.4em] text-[#595f72]">
          {index + 1} of {all.length}
        </p>
        <h2 id="demo-tour-title" className="mb-3 text-[26px] font-light leading-tight tracking-tight text-[#251101] dark:text-white">
          {step.title}
        </h2>
        <p className="mb-8 font-sans text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">{step.body}</p>

        <div className="mb-6 flex items-center justify-center gap-1.5" aria-hidden>
          {all.map((s, i) => (
            <span key={s.title} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-[#251101] dark:bg-white' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'}`} />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              onClick={() => setIndex((i) => i - 1)}
              className="flex items-center gap-1 rounded-full px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Back
            </button>
          )}
          <button
            autoFocus
            onClick={() => (last ? close() : setIndex((i) => i + 1))}
            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-black py-3.5 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:opacity-80 active:scale-95 dark:bg-white dark:text-black"
          >
            {last ? 'Start exploring' : 'Next'}
            {!last && <ChevronRightIcon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
