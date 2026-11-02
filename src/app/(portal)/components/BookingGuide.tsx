import React from 'react'
import Link from 'next/link'

/**
 * How a booking's status moves, and what each status does to the Dashboard and Analytics numbers.
 * Mirrors the rules in dashboard/page.tsx (calculateMetrics) and api/admin/analytics: keep in step.
 */
const STEPS = [
  {
    status: 'Pending',
    dot: 'bg-amber-500',
    text: 'Not yet agreed with the patient. Press Confirm once you have. Pending visits are not counted as revenue anywhere.',
  },
  {
    status: 'Confirmed',
    dot: 'bg-blue-500',
    text: 'Online bookings arrive already confirmed. On the Dashboard they count toward Projected and Pending revenue (money still to come in), not Settled. Revert moves one back to Pending.',
  },
  {
    status: 'Completed',
    dot: 'bg-emerald-500',
    text: 'Press Completed after the visit. This moves it to Settled revenue on the Dashboard, and counts it in Period Revenue and sales by service in Analytics.',
  },
  {
    status: 'Cancelled',
    dot: 'bg-red-500',
    text: 'The × button cancels the booking and frees its time slot. Cancelled visits are left out of every total.',
  },
]

export default function BookingGuide({ from }: { from: 'bookings' | 'analytics' }) {
  return (
    <details className="group rounded-2xl border border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/60 dark:bg-zinc-900/30 px-5 py-4 font-sans text-[#251101] dark:text-zinc-100">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[9px] md:text-[10px] font-serif uppercase tracking-[0.3em] text-[#595f72] marker:hidden [&::-webkit-details-marker]:hidden">
        {from === 'analytics' ? 'Where these numbers come from' : 'How to confirm and complete a booking'}
        <span className="text-[14px] leading-none transition-transform duration-300 group-open:rotate-45">+</span>
      </summary>
      <ol className="mt-4 space-y-3 text-[13px] leading-relaxed">
        {STEPS.map((s) => (
          <li key={s.status} className="flex gap-3">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
            <span>
              <strong className="font-semibold">{s.status}.</strong> {s.text}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[12px] text-[#595f72] dark:text-zinc-400">
        {from === 'analytics' ? (
          <>
            Revenue counts Completed visits in the chosen period; the appointment count includes every booking except cancelled ones. To
            count a visit, mark it Completed on{' '}
            <Link href="/admin/manager" className="underline underline-offset-4 hover:text-[#251101] dark:hover:text-white">
              Bookings
            </Link>
            . This page refreshes on its own every 30 seconds.
          </>
        ) : (
          <>Changes show on the Dashboard straight away, and in Analytics within 30 seconds.</>
        )}
      </p>
    </details>
  )
}
