'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckBadgeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Notification from '../../components/Notification'

interface BookingActionsProps {
  appointmentId: string
  currentStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string
}

export default function BookingActions({ appointmentId, currentStatus }: BookingActionsProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    msg: string
    type: 'success' | 'error'
  } | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isUpdating = isPending || !!loadingType

  const updateStatus = async (newStatus: string) => {
    setLoadingType(newStatus)
    setShowCancelModal(false)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const messages: Record<string, string> = {
          confirmed: 'Appointment confirmed successfully',
          pending: 'Appointment moved back to pending',
          completed: 'Appointment marked as completed',
          cancelled: 'Appointment has been cancelled',
        }
        setNotification({ msg: messages[newStatus] || 'Status updated', type: 'success' })
        startTransition(() => {
          router.refresh()
        })
      } else {
        setNotification({ msg: 'Failed to update status', type: 'error' })
      }
    } catch {
      setNotification({ msg: 'Server connection error', type: 'error' })
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.msg}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* --- CLINICAL CANCELLATION MODAL (Preserved) --- */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300 font-serif">
          <div
            className="absolute inset-0 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-md"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-[24px] font-light mb-2 text-zinc-900 dark:text-white leading-none">
                Cancel Visit?
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-8 leading-relaxed">
                This action will release the <br /> current time slot.
              </p>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => updateStatus('cancelled')}
                  className="w-full py-4 bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full active:scale-95 transition-all"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROL INTERFACE */}
      <div className="flex flex-col shrink-0 lg:pr-10 font-serif">
        <div className="flex flex-col">
          {/* ROW 1 FIXED HEIGHT */}
          <div className="h-[16px] flex items-center gap-2.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isUpdating ? 'animate-ping' : 'animate-pulse'} ${
                currentStatus === 'completed'
                  ? 'bg-emerald-500'
                  : currentStatus === 'confirmed'
                    ? 'bg-blue-500'
                    : currentStatus === 'cancelled'
                      ? 'bg-red-500'
                      : 'bg-amber-500'
              }`}
            />
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-400 flex items-center gap-2 leading-none m-0">
              Status: <span className="text-zinc-700 dark:text-zinc-100">{currentStatus}</span>
              {isUpdating && <ArrowPathIcon className="w-3 h-3 animate-spin text-zinc-300 ml-1" />}
            </span>
          </div>

          {/* ROW 2 FIXED HEIGHT (Invisible Spacer ensures alignment with Email/Phone) */}
          <div className="h-[10px] flex items-center mt-2 opacity-0 select-none">
            <span className="text-[10px] leading-none m-0">Spacer</span>
          </div>
        </div>

        {/* ROW 3 FIXED MARGIN */}
        <div className="flex flex-nowrap items-center gap-2 w-full shrink-0 mt-4 lg:mt-6 min-h-[16px]">
          {currentStatus === 'completed' ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
              <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-500 leading-none m-0">
                Settled
              </span>
            </div>
          ) : (
            <>
              <button
                disabled={isUpdating}
                onClick={() => updateStatus(currentStatus === 'pending' ? 'confirmed' : 'pending')}
                className="px-3 py-1 border border-zinc-100 dark:border-zinc-800 text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-zinc-500 disabled:opacity-50 leading-none m-0"
              >
                {loadingType === 'confirmed' || loadingType === 'pending'
                  ? '...'
                  : currentStatus === 'pending'
                    ? 'Confirm'
                    : 'Revert'}
              </button>

              <button
                disabled={isUpdating}
                onClick={() => updateStatus('completed')}
                className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-[0.3em] font-bold rounded-xl hover:opacity-80 transition-all flex items-center gap-2 disabled:opacity-50 leading-none m-0"
              >
                {loadingType === 'completed' ? (
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckIcon className="w-3.5 h-3.5" />
                    Completed
                  </>
                )}
              </button>

              <button
                disabled={isUpdating}
                onClick={() => setShowCancelModal(true)}
                className="px-1.5 py-1 text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors disabled:opacity-20 shrink-0 leading-none m-0"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
