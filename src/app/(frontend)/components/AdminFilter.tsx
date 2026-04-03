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
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex flex-col items-end gap-3 md:gap-4 shrink-0 relative">
      {/* 1. DATE RANGE FILTER (Pill - Aligned center with 'Management') */}
      <div className="inline-flex items-center bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded-full border border-zinc-100 dark:border-zinc-800/50 relative">
        {isPending && (
          <div className="absolute -left-8 top-1/2 -translate-y-1/2">
            <ArrowPathIcon className="h-3.5 w-3.5 text-[#595f72] animate-spin" />
          </div>
        )}

        <div
          className="absolute top-1.5 bottom-1.5 w-[76px] sm:w-[88px] md:w-32 bg-white dark:bg-zinc-800 rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform:
              initialRange === 'today'
                ? 'translateX(0)'
                : initialRange === '7days'
                  ? 'translateX(100%)'
                  : initialRange === 'thisMonth'
                    ? 'translateX(200%)'
                    : 'translateX(300%)',
          }}
        />

        {['today', '7days', 'thisMonth', 'all'].map((r) => (
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

      {/* 2. STATUS FILTER (Tucked Bottom-Left) */}
      <div className="relative group flex items-center pl-4 md:pl-2">
        <select
          value={initialStatus}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="appearance-none bg-transparent border-none py-0 pl-0 pr-6 text-[7px] md:text-[9px] uppercase tracking-[0.35em] font-medium font-serif text-[#595f72] hover:text-[#251101] dark:hover:text-zinc-100 cursor-pointer outline-none transition-colors text-left"
        >
          <option value="all" className="bg-white dark:bg-[#050505]">
            All Status
          </option>
          <option value="pending" className="bg-white dark:bg-[#050505]">
            Pending
          </option>
          <option value="confirmed" className="bg-white dark:bg-[#050505]">
            Confirmed
          </option>
          <option value="completed" className="bg-white dark:bg-[#050505]">
            Completed
          </option>
          <option value="cancelled" className="bg-white dark:bg-[#050505]">
            Cancelled
          </option>
        </select>
        <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-[#595f72] pointer-events-none" />
      </div>
    </div>
  )
}
