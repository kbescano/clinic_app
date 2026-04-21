'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useNotification } from './NotificationContext'

export default function NotificationTrigger() {
  const { onOpen, unreadCount } = useNotification()
  const pathname = usePathname()

  // Logic gate: Use white on the homepage top, black everywhere else
  const isHomePage = pathname === '/'

  return (
    <button
      onClick={onOpen}
      aria-label="View notifications"
      className="relative flex items-center gap-3 group outline-none transition-all duration-500 hover:scale-110"
    >
      {/* INSTAGRAM-STYLE BADGE */}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#d7263d] border-[1.5px] border-white dark:border-black text-[7px] text-white font-serif font-bold animate-in zoom-in duration-300">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-opacity duration-500"
      >
        <defs>
          <linearGradient id="blackAtelierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="40%" stopColor="#050505" />
            <stop offset="75%" stopColor="#121212" />
            <stop offset="100%" stopColor="#251101" />
          </linearGradient>

          <linearGradient id="whiteAtelierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FAFAFA" />
            <stop offset="70%" stopColor="#F5F5F4" />
            <stop offset="100%" stopColor="#ECECEB" />
          </linearGradient>
        </defs>

        {/* BELL ICON */}
        <path
          d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
          stroke={isHomePage ? 'url(#whiteAtelierGradient)' : 'url(#blackAtelierGradient)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
      </svg>
    </button>
  )
}
