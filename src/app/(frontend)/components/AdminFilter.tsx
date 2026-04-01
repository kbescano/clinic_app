'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useTransition } from 'react'

export default function AdminFilter({
  initialRange,
  initialStatus,
}: {
  initialRange: string
  initialStatus: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  // ATELIER TYPOGRAPHY:
  // - text-right: Anchors text to the right near the chevron.
  // - italic & tracking-[0.35em]: Signature high-end clinical feel.
  const selectClasses =
    'appearance-none bg-transparent border-none py-0 pl-0 pr-4 text-[8px] md:text-[9px] uppercase tracking-[0.35em] font-medium font-serif text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer outline-none transition-colors disabled:opacity-50 text-right'

  const optionClasses =
    'bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-serif text-right'

  return (
    <div className="flex items-center gap-10 shrink-0">
      {/* 1. DATE RANGE FILTER */}
      <div className="relative group">
        {isPending && (
          <div className="absolute -left-5 top-1/2 -translate-y-1/2">
            <ArrowPathIcon className="h-2 w-2 text-zinc-300 animate-spin" />
          </div>
        )}

        <select
          value={initialRange}
          onChange={(e) => handleFilterChange('range', e.target.value)}
          disabled={isPending}
          className={selectClasses}
        >
          <option value="today" className={optionClasses}>
            Today
          </option>
          <option value="7days" className={optionClasses}>
            Next 7 Days
          </option>
          <option value="thisMonth" className={optionClasses}>
            Monthly Roster
          </option>
          <option value="all" className={optionClasses}>
            Archive Registry
          </option>
        </select>

        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-300 pointer-events-none group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
      </div>

      {/* 2. STATUS FILTER */}
      <div className="relative group">
        <select
          value={initialStatus}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          disabled={isPending}
          className={selectClasses}
        >
          <option value="all" className={optionClasses}>
            All Status
          </option>
          <option value="pending" className={optionClasses}>
            Pending
          </option>
          <option value="confirmed" className={optionClasses}>
            Confirmed
          </option>
          <option value="completed" className={optionClasses}>
            Completed
          </option>
          <option value="cancelled" className={optionClasses}>
            Cancelled
          </option>
        </select>

        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-300 pointer-events-none group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
      </div>
    </div>
  )
}
