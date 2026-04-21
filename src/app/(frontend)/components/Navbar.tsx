'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FadeIn from './FadeIn'
import NotificationTrigger from './NotificationTrigger'

interface HeaderData {
  topLabel: string
  logoUrl?: string | null
  clinicName: string
}

interface NavbarProps {
  headerData: HeaderData
}

export default function Navbar({ headerData }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0)
  const pathname = usePathname()

  const isHomePage = pathname === '/'
  const isTransparent = isHomePage && isAtTop

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY
        setIsAtTop(currentScrollY < 40)

        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
        lastScrollY.current = currentScrollY
      }
    }

    window.addEventListener('scroll', controlNavbar, { passive: true })
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isTransparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/70 dark:bg-[#050505]/70 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-900/50 shadow-sm'
      }`}
    >
      <FadeIn>
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-20 md:h-28 flex items-center justify-between">
          {/* LEFT: ACTION PILLAR */}
          <div className="flex-1 flex items-center justify-start">
            <Link href="/booking" className="group relative py-1 overflow-hidden hidden md:block">
              <span
                className={`text-[8px] uppercase tracking-[0.5em] font-serif transition-colors duration-700 ${
                  isTransparent ? 'text-white' : 'text-[#595f72] dark:text-zinc-400'
                }`}
              >
                Book Session
              </span>
              <span
                className={`absolute bottom-0 left-0 h-[1px] transition-all duration-700 ease-in-out w-0 group-hover:w-full ${
                  isTransparent ? 'bg-white' : 'bg-[#251101] dark:bg-zinc-400'
                }`}
              />
            </Link>
          </div>

          {/* CENTER: BRANDING PILLAR */}
          <div className="flex-none flex flex-col items-center">
            {isTransparent && headerData?.topLabel && (
              <span className="text-[6px] uppercase tracking-[0.8em] text-white/40 mb-2 font-serif animate-in fade-in slide-in-from-top-1 duration-1000">
                {headerData.topLabel}
              </span>
            )}
            <Link href="/" className="group flex flex-col items-center">
              <h1
                className={`text-[11px] md:text-[13px] uppercase tracking-[0.8em] font-light transition-all duration-1000 font-serif ${
                  isTransparent ? 'text-white' : 'text-[#251101] dark:text-zinc-100'
                }`}
              >
                {headerData?.clinicName || 'Atelier'}
              </h1>
              {/* STEALTH UNDER DOT: luxury indicator */}
              <div
                className={`w-1 h-1 rounded-full mt-1.5 transition-all duration-1000 ${
                  isTransparent ? 'bg-white/20' : 'bg-[#251101]/10 dark:bg-white/10'
                }`}
              />
            </Link>
          </div>

          {/* RIGHT: UTILITY PILLAR */}
          <div className="flex-1 flex items-center justify-end gap-8 md:gap-12">
            <div className="flex items-center gap-6 md:gap-10">
              <div className="transform hover:scale-110 transition-transform duration-500">
                <NotificationTrigger />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </nav>
  )
}
