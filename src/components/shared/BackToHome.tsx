'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function BackToHome() {
  const router = useRouter()

  return (
    /* hidden: Hide on mobile
       md:flex: Show as flex on desktop (768px+)
       fixed: Lock to the viewport
       left-10 top-1/2: Position in the middle-left 
    */
    <button
      onClick={() => router.push('/')}
      className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-6 group transition-all duration-500"
    >
      {/* Visual Indicator: Vertical Line */}
      <div className="w-[1px] h-12 bg-zinc-100 dark:bg-zinc-900 group-hover:h-20 transition-all duration-500" />

      {/* Rotated Text */}
      <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] uppercase tracking-[0.8em] text-zinc-900 group-hover:text-black dark:group-hover:text-white transition-colors duration-300">
        Back to Home
      </span>

      {/* Small Icon for clarity */}
      <ArrowLeftIcon className="w-3 h-3 text-zinc-200 dark:text-zinc-800 group-hover:text-black dark:group-hover:text-white group-hover:-translate-y-1 transition-all" />
    </button>
  )
}
