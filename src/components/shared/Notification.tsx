'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface NotificationProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Notification({ message, type = 'success', onClose }: NotificationProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation at 1.7s to finish by 2s
    const exitTimer = setTimeout(() => setIsExiting(true), 1700)
    const closeTimer = setTimeout(onClose, 2000)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(closeTimer)
    }
  }, [onClose])

  const icons = {
    success: <CheckCircleIcon className="w-4 h-4 text-emerald-500" />,
    error: <InformationCircleIcon className="w-4 h-4 text-red-500" />,
    info: <InformationCircleIcon className="w-4 h-4 text-blue-500" />,
  }

  return (
    <div
      className={`
      fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[200]
      transition-all duration-500 ease-in-out
      ${isExiting ? 'opacity-0 -translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}
    `}
    >
      <div className="relative overflow-hidden flex items-center gap-4 px-6 py-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-100 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-2xl min-w-[280px]">
        {/* Icon */}
        <div className="shrink-0">{icons[type]}</div>

        {/* Text */}
        <div className="flex-grow">
          <p className="text-[11px] text-zinc-800 dark:text-zinc-200 font-medium tracking-tight">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
