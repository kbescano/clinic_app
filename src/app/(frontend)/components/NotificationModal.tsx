'use client'

import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, BellSlashIcon } from '@heroicons/react/24/outline'
import SlideInRight from './SlideInRight'
import { useNotification, ApptNotification } from './NotificationContext'
import dayjs from '@/lib/dayjs'

const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

export default function NotificationModal() {
  const { isOpen, onClose, notifications } = useNotification()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Delay content animation slightly so the modal container can begin sliding in first
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = 'unset'
      setShowContent(false)
    }
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
                <header className="mb-12 pb-8 relative">
                  {/* Draw-in bottom border for the header */}
                  <div
                    className={`absolute bottom-0 left-0 h-[0.5px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[2000ms] delay-[400ms] ${atelierEase} ${
                      showContent ? 'w-full' : 'w-0'
                    }`}
                  />

                  <div className="flex items-center gap-4">
                    <h2
                      className={`text-[11px] font-normal font-serif uppercase text-[#251101] dark:text-white leading-none transition-all duration-[2000ms] ${atelierEase} ${
                        showContent
                          ? 'opacity-100 translate-y-0 tracking-[0.4em]'
                          : 'opacity-0 translate-y-6 tracking-[1em]'
                      }`}
                    >
                      Activity
                    </h2>
                    <div
                      className={`h-[0.5px] bg-[#251101]/20 dark:bg-white/20 transition-all duration-[2000ms] delay-200 ${atelierEase} ${
                        showContent ? 'w-6' : 'w-0'
                      }`}
                    />
                  </div>
                </header>

                <div className="space-y-0 -mx-8 md:-mx-16 overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center py-32 transition-all duration-[2000ms] delay-300 ${atelierEase} ${
                        showContent
                          ? 'opacity-30 translate-y-0 blur-0'
                          : 'opacity-0 translate-y-8 blur-sm'
                      }`}
                    >
                      <BellSlashIcon className="w-6 h-6 text-[#595f72] mb-4 stroke-[1px]" />
                      <p className="text-[8px] uppercase tracking-[0.5em] text-[#595f72] font-serif">
                        Registry Empty
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <NotificationItem key={notif.id} data={notif} parentVisible={showContent} />
                    ))
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

function NotificationItem({
  data,
  parentVisible,
}: {
  data: ApptNotification
  parentVisible: boolean
}) {
  const [shouldHighlight, setShouldHighlight] = useState(false)
  const [isItemVisible, setIsItemVisible] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  // 1. CHOREOGRAPHY OBSERVER
  useEffect(() => {
    // Only start observing if the parent modal has started its content reveal
    if (!parentVisible) {
      setIsItemVisible(false)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsItemVisible(true)
          // Trigger only once to prevent repaint lag while scrolling
          if (itemRef.current) observer.unobserve(itemRef.current)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px 0px 0px 0px',
      },
    )

    if (itemRef.current) observer.observe(itemRef.current)
    return () => observer.disconnect()
  }, [parentVisible])

  // 2. HIGHLIGHT LOGIC (1 Hour Window)
  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000

    const updateHighlightState = () => {
      const now = dayjs()
      const created = dayjs(data.timestamp)
      const diffInMs = now.diff(created, 'millisecond')

      if (diffInMs < ONE_HOUR_MS) {
        setShouldHighlight(true)
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
    const interval = setInterval(updateHighlightState, 60000)
    return () => clearInterval(interval)
  }, [data.timestamp])

  return (
    <div
      ref={itemRef}
      className={`relative px-8 md:px-16 py-8 transition-colors duration-[2500ms] ${atelierEase} flex flex-col gap-3 group ${
        shouldHighlight ? 'bg-zinc-50 dark:bg-white/[0.03]' : 'bg-transparent'
      }`}
    >
      {/* Individual Draw-in Bottom Divider */}
      <div
        className={`absolute bottom-0 left-0 h-[0.5px] bg-zinc-50 dark:bg-zinc-900/50 transition-all duration-[1500ms] ${atelierEase} ${
          isItemVisible ? 'w-full' : 'w-0'
        }`}
      />

      {/* Visual Indicator: High-end vertical hairline drawing down */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[2px] bg-[#251101] dark:bg-white transition-all duration-[1500ms] delay-[400ms] ${atelierEase} origin-top ${
          shouldHighlight && isItemVisible
            ? 'h-10 opacity-100 scale-y-100'
            : 'h-0 opacity-0 scale-y-0'
        }`}
      />

      {/* Content wrapper fading and rising up */}
      <div
        className={`flex flex-col gap-3 transition-all duration-[1500ms] ${atelierEase} ${
          isItemVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-6 blur-[2px]'
        }`}
      >
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
    </div>
  )
}
