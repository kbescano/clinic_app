'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BookNowButton() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Appear after 200px scroll
      setIsVisible(window.scrollY > 200)
    }
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <button
      onClick={() => router.push('/booking')}
      className={`
        md:hidden fixed left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-3 px-6 py-4
        bg-black dark:bg-white text-white dark:text-black
        rounded-full shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 1, 0.3, 1)
        ${
          isVisible
            ? 'bottom-[80px] opacity-70 translate-y-0'
            : 'bottom-0 opacity-0 translate-y-10 pointer-events-none'
        }
        active:scale-95
      `}
    >
      <span className="text-[8px] font-bold uppercase tracking-[0.5em] leading-none ml-1">
        Book Now
      </span>

      {/* Minimalist Arrow */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  )
}
