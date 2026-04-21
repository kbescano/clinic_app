'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import SlideInRight from './SlideInRight'
import { useNotification, ApptNotification } from './NotificationContext'
import dayjs from '@/lib/dayjs'

export default function NotificationModal() {
  const { isOpen, onClose, notifications } = useNotification()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden selection:bg-zinc-100">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <SlideInRight width="30vw">
            <div className="relative h-full w-full p-8 md:p-16 flex flex-col bg-white dark:bg-[#050505]">
              <button
                onClick={onClose}
                className="absolute top-10 right-10 p-2 text-zinc-400 hover:text-[#251101] dark:hover:text-white transition-all outline-none"
              >
                <XMarkIcon className="w-5 h-5 stroke-[1px]" />
              </button>

              <div className="mt-12 md:mt-16 flex-1 flex flex-col">
                <header className="mb-12 border-b border-zinc-100 dark:border-zinc-900 pb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[11px] font-normal font-serif uppercase tracking-[0.4em] text-[#251101] dark:text-white leading-none">
                      Activity
                    </h2>
                    <div className="h-[0.5px] w-6 bg-[#251101]/20 dark:bg-white/20" />
                  </div>
                </header>

                <div className="space-y-0 -mx-8 md:-mx-16 overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-30">
                      <BellSlashIcon className="w-6 h-6 text-[#595f72] mb-4 stroke-[1px]" />
                      <p className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] font-serif">
                        Registry Empty
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => <NotificationItem key={notif.id} data={notif} />)
                  )}
                </div>
              </div>
            </div>
          </SlideInRight>
        </div>
      )}
    </AnimatePresence>
  )
}

function NotificationItem({ data }: { data: ApptNotification }) {
  const [shouldHighlight, setShouldHighlight] = useState(false)

  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000

    const updateHighlightState = () => {
      const now = dayjs()
      const created = dayjs(data.timestamp)
      const diffInMs = now.diff(created, 'millisecond')

      if (diffInMs < ONE_HOUR_MS) {
        setShouldHighlight(true)

        // Schedule the highlight to turn off precisely at the 1-hour mark
        const remainingTime = ONE_HOUR_MS - diffInMs
        const timer = setTimeout(() => {
          setShouldHighlight(false)
        }, remainingTime)

        return () => clearTimeout(timer)
      } else {
        setShouldHighlight(false)
      }
    }

    updateHighlightState()

    // Check every minute just to stay in sync
    const interval = setInterval(updateHighlightState, 60000)
    return () => clearInterval(interval)
  }, [data.timestamp])

  return (
    <div
      className={`relative px-8 md:px-16 py-8 border-b border-zinc-50 dark:border-zinc-900/50 transition-all duration-[2500ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col gap-3 group ${
        shouldHighlight ? 'bg-zinc-50 dark:bg-white/[0.03]' : 'bg-transparent'
      }`}
    >
      {/* Visual Indicator: High-end vertical hairline */}
      {shouldHighlight && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-10 bg-[#251101] dark:bg-white animate-in fade-in slide-in-from-left-2 duration-1000" />
      )}

      <div className="flex justify-between items-baseline gap-6">
        <p className="text-[14px] md:text-[15px] font-serif text-[#251101] dark:text-zinc-200 leading-relaxed tracking-tight">
          <span className="font-medium">{data.bookerName}</span>
          <span className="text-[#595f72] dark:text-zinc-500"> scheduled </span>
          <span>{data.service}</span>
        </p>
        <span className="text-[8px] uppercase tracking-[0.3em] text-[#595f72] font-serif shrink-0 opacity-60">
          {dayjs(data.timestamp).fromNow(true)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#595f72] dark:text-zinc-500 font-serif">
          {data.scheduleDate}
        </span>
        <span className="w-[3px] h-[3px] rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#595f72] dark:text-zinc-500 font-serif">
          {data.phone}
        </span>
      </div>
    </div>
  )
}
