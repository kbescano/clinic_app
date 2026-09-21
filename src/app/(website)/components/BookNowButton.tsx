'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BookNowButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 200)
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <Link
      href="/booking"
      tabIndex={isVisible ? 0 : -1}
      className={`md:hidden fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-7 py-4 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold uppercase tracking-[0.2em] shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-500 active:scale-95 ${
        isVisible
          ? 'bottom-20 opacity-100 translate-y-0'
          : 'bottom-0 opacity-0 translate-y-20 pointer-events-none'
      }`}
    >
      Book now
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 17L17 7M17 7H7M17 7V17" />
      </svg>
    </Link>
  )
}
