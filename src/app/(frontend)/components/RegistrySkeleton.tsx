'use client'

import React, { useId } from 'react'

export function RegistrySkeleton() {
  const gradientId = useId()

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-[#050505] z-[100]">
      <div className="relative animate-in fade-in zoom-in-95 duration-1000 ease-out">
        {/* CENTERED CLOCKWISE SPINNER */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.2" /* Slightly increased for better visibility of the gradient */
          className="w-5 h-5 md:w-6 md:h-6 animate-spin"
        >
          <defs>
            {/* High-end Metallic Midnight Gradient */}
            <linearGradient
              id={gradientId}
              x1="2"
              y1="2"
              x2="22"
              y2="22"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#000000" /> {/* Pure Black */}
              <stop offset="40%" stopColor="#1A1A1A" /> {/* Deep Charcoal */}
              <stop offset="70%" stopColor="#3F3F46" /> {/* Slate Highlight */}
              <stop offset="100%" stopColor="#09090B" /> {/* Near Black */}
            </linearGradient>
          </defs>
          <path
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>

        {/* The pulse ring also updated to a darker, more subtle tone */}
        <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 animate-ping opacity-10" />
      </div>
    </div>
  )
}
