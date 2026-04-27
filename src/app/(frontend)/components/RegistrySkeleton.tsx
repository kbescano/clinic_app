'use client'

import React, { useId, useEffect, useState } from 'react'

export function RegistrySkeleton() {
  const gradientId = useId()

  const [isRevealed, setIsRevealed] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // 1. Instantly trigger the pitch-black curtain rising from the bottom
    setIsRevealed(true)

    // 2. Wait for the curtain to settle before fading in the minimalist line spinner
    const timer = setTimeout(() => {
      setShowContent(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isRevealed ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className={`relative flex items-center justify-center transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showContent ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-[15px] scale-90'
        }`}
      >
        {/* ULTRA-MINIMALIST HAIRLINE SPINNER */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-10 h-10 animate-spin"
          style={{ animationDuration: '1.5s' }}
        >
          <defs>
            {/* Comet-trail gradient fading into absolute transparency */}
            <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Faint structural background track */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="#FFFFFF"
            strokeWidth="0.5"
            strokeOpacity="0.05"
            fill="none"
          />

          {/* Foreground spinning hairline */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={`url(#${gradientId})`}
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="60"
            strokeDashoffset="20"
          />
        </svg>
      </div>
    </div>
  )
}
