'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BookNowButton() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Logic: Appear after 200px scroll
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
        flex items-center gap-4 px-7 py-4
        /* GLASSMORPHISM BASE */
        bg-black/90 dark:bg-white/90 backdrop-blur-xl
        text-white dark:text-black
        rounded-full 
        /* HAIRLINE BORDER - The 'Atelier' Touch */
        border border-white/10 dark:border-black/10
        /* HIGH-END SHADOW */
        shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(255,255,255,0.1)]
        /* KINETIC TRANSITION */
        transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)
        ${
          isVisible
            ? 'bottom-20 opacity-100 translate-y-0 scale-100'
            : 'bottom-0 opacity-0 translate-y-20 scale-90 pointer-events-none'
        }
        active:scale-95 active:duration-150
      `}
    >
      {/* GLOW EFFECT (Subtle background pulse) */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />

      <span className="relative text-[9px] font-medium uppercase tracking-[0.5em] leading-none ml-1 font-serif">
        Book Now
      </span>

      {/* REFINED MINIMALIST ARROW */}
      <div className="relative flex items-center justify-center">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-500 group-active:translate-x-1"
        >
          <path d="M7 17L17 7M17 7H7M17 7V17" />
        </svg>
      </div>

      {/* KEYBOARD ACCESSIBILITY RING */}
      <span className="sr-only">Book an appointment</span>
    </button>
  )
}
