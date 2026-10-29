'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/** How long the overlay stays fully visible before it starts to fade. */
export const SKELETON_VISIBLE_MS = 600

// 1. Move the actual logic into an inner component
function SkeletonInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [showContent, setShowContent] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // 1. Instantly reset states on page navigation
    setShowContent(false)
    setIsFadingOut(false)

    // 2. Start the spinner entrance fade-in
    const entranceTimer = setTimeout(() => {
      setShowContent(true)
    }, 50)

    // 3. Fade out after SKELETON_VISIBLE_MS (the CSS transition then takes another 400ms).
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, SKELETON_VISIBLE_MS)

    return () => {
      clearTimeout(entranceTimer)
      clearTimeout(fadeOutTimer)
    }
  }, [pathname, searchParams])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#050505] transition-opacity duration-[400ms] ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* THE SPINNER */}
      <div
        className={`relative flex items-center justify-center transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showContent
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-12 h-12 animate-spin opacity-90 text-zinc-950 dark:text-white"
          style={{ animationDuration: '2s' }}
        >
          <defs>
            <linearGradient id="atelier-spinner-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="40%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.05"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="url(#atelier-spinner-gradient)"
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

// 2. Export the component wrapped in its own Suspense boundary
export function RegistrySkeleton() {
  return (
    <Suspense fallback={null}>
      <SkeletonInner />
    </Suspense>
  )
}
