'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { RegistrySkeleton } from './RegistrySkeleton'

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
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const statusOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled']
  const rangeOptions = ['today', '7days', 'thisMonth', 'all']

  return (
    <div className="flex flex-col items-end gap-4 shrink-0 relative">
      {/* 1. DATE RANGE FILTER */}
      <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative">
        {isPending && (
          <div className="absolute -left-4 top-1/2 -translate-y-1/2">
            <RegistrySkeleton />
          </div>
        )}

        <div
          className="absolute top-1.5 bottom-1.5 w-[76px] sm:w-[88px] md:w-32 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: `translateX(${rangeOptions.indexOf(initialRange) * 100}%)`,
          }}
        />

        {rangeOptions.map((r) => (
          <button
            key={r}
            onClick={() => handleFilterChange('range', r)}
            className={`relative z-10 w-[76px] sm:w-[88px] md:w-32 py-2 text-[7px] md:text-[8px] uppercase tracking-[0.25em] font-medium transition-colors duration-300 font-serif ${
              initialRange === r ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
            }`}
          >
            {r === 'today'
              ? 'Today'
              : r === '7days'
                ? 'Next 7 Days'
                : r === 'thisMonth'
                  ? 'Monthly'
                  : 'All Time'}
          </button>
        ))}
      </div>

      {/* 2. STATUS FILTER (Now identical to Range Filter) */}
      <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative">
        <div
          className="absolute top-1 bottom-1 w-[60px] sm:w-[70px] md:w-24 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: `translateX(${statusOptions.indexOf(initialStatus) * 100}%)`,
          }}
        />

        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange('status', s)}
            className={`relative z-10 w-[60px] sm:w-[70px] md:w-24 py-1.5 text-[6px] md:text-[7px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 font-serif ${
              initialStatus === s ? 'text-[#251101] dark:text-white' : 'text-[#595f72]'
            }`}
          >
            {s === 'all' ? 'All Status' : s}
          </button>
        ))}
      </div>
    </div>
  )
}
