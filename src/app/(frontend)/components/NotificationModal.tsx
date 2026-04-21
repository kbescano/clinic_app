'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import SlideInRight from './SlideInRight'
import { useNotification, ApptNotification } from './NotificationContext'
import dayjs from '@/lib/dayjs'

export default function NotificationModal() {
  const { isOpen, onClose, notifications } = useNotification()

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden selection:bg-zinc-100">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/20 dark:bg-black/60"
            onClick={onClose}
          />

          <SlideInRight width="30vw">
            <div className="relative h-full w-full max-w-md p-8 md:p-16 flex flex-col bg-white dark:bg-[#050505] overflow-y-auto scrollbar-hide">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-10 right-10 text-zinc-400 hover:text-[#251101] dark:hover:text-white transition-all outline-none"
              >
                <XMarkIcon className="w-6 h-6 stroke-[1px]" />
              </button>

              <div className="mt-12 md:mt-16 flex-1">
                <header className="mb-12 border-b border-zinc-100 dark:border-zinc-900 pb-6">
                  <h2 className="text-[16px] font-light font-serif uppercase tracking-tight text-[#251101] dark:text-white leading-none">
                    Activity
                  </h2>
                </header>

                <div className="space-y-8 pb-10">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                      <BellSlashIcon className="w-8 h-8 text-[#595f72] mb-4 stroke-[1px]" />
                      <p className="text-[9px] uppercase tracking-[0.3em] text-[#595f72] font-serif">
                        No recent activity
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
  return (
    <div className="flex flex-col gap-2 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-baseline gap-4">
        <p className="text-[14px] md:text-[15px] font-serif text-[#251101] dark:text-zinc-200 leading-snug">
          <span className="font-medium capitalize">{data.bookerName}</span> scheduled{' '}
          <span className="italic">{data.service}</span>.
        </p>
        <span className="text-[8px] uppercase tracking-widest text-[#595f72] font-serif shrink-0">
          {dayjs(data.timestamp).fromNow(true)}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-1">
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#595f72] font-serif">
          {data.scheduleDate}
        </span>
        <span className="w-1 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#595f72] font-serif">
          {data.phone}
        </span>
      </div>
    </div>
  )
}
