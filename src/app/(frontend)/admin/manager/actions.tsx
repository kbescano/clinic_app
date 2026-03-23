'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckBadgeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function BookingActions({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string
  currentStatus: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-between w-full">
      {/* STATUS BADGE (Left Aligned) */}
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            currentStatus === 'completed'
              ? 'bg-emerald-500'
              : currentStatus === 'confirmed'
                ? 'bg-blue-500'
                : 'bg-amber-500'
          }`}
        />
        <span className="text-[7px] uppercase tracking-[0.3em] font-bold text-zinc-400">
          Status: <span className="text-zinc-600 dark:text-zinc-200">{currentStatus}</span>
        </span>
      </div>

      {/* ACTIONS (Right Aligned) */}
      <div className="flex items-center gap-2">
        {currentStatus === 'completed' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
            <CheckBadgeIcon className="w-3 h-3 text-emerald-500" />
            <span className="text-[7px] uppercase tracking-widest font-bold text-emerald-500">
              Settled
            </span>
          </div>
        ) : (
          <>
            <button
              onClick={() => updateStatus(currentStatus === 'pending' ? 'confirmed' : 'pending')}
              className="px-3 py-1.5 border border-zinc-100 dark:border-zinc-800 text-[7px] uppercase tracking-widest font-bold rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-zinc-500"
            >
              {loading ? '...' : currentStatus === 'pending' ? 'Confirm' : 'Revert'}
            </button>

            <button
              onClick={() => updateStatus('completed')}
              className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[7px] uppercase tracking-widest font-bold rounded-2xl hover:opacity-80 transition-all flex items-center gap-2"
            >
              {loading === 'completed' ? (
                '...'
              ) : (
                <>
                  <CheckIcon className="w-3 h-3" /> Completed
                </>
              )}
            </button>

            <button
              onClick={() => confirm('Cancel?') && updateStatus('cancelled')}
              className="p-1 text-zinc-200 hover:text-red-500"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
