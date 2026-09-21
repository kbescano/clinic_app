'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FadeIn from '@/components/shared/FadeIn'
import NotificationTrigger from './NotificationTrigger'

interface PortalHeaderProps {
  clinicName: string
  email: string
}

const utilityLink =
  'text-[8px] uppercase tracking-[0.5em] font-serif text-[#595f72] dark:text-zinc-400 hover:text-[#251101] dark:hover:text-white transition-colors duration-500'

export default function PortalHeader({ clinicName, email }: PortalHeaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const lastScrollY = useRef(0)
  const router = useRouter()

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY
      setIsVisible(!(currentScrollY > lastScrollY.current && currentScrollY > 100))
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', controlHeader, { passive: true })
    return () => window.removeEventListener('scroll', controlHeader)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/70 dark:bg-[#050505]/70 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-900/50 shadow-sm ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <FadeIn>
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 h-20 md:h-28 flex items-center justify-between">
          {/* LEFT: back to the public site */}
          <div className="flex-1 flex items-center justify-start">
            <Link href="/" className={`${utilityLink} hidden md:block`}>
              Website
            </Link>
          </div>

          {/* CENTER: BRANDING PILLAR */}
          <div className="flex-none flex flex-col items-center">
            <span className="text-[6px] uppercase tracking-[0.8em] text-[#595f72] dark:text-zinc-500 mb-2 font-serif">
              Staff Portal
            </span>
            <Link href="/dashboard" className="group flex flex-col items-center">
              <h1 className="text-[11px] md:text-[13px] uppercase tracking-[0.8em] font-light font-serif text-[#251101] dark:text-zinc-100">
                {clinicName || 'Atelier'}
              </h1>
              <div className="w-1 h-1 rounded-full mt-1.5 bg-[#251101]/10 dark:bg-white/10" />
            </Link>
          </div>

          {/* RIGHT: UTILITY PILLAR */}
          <div className="flex-1 flex items-center justify-end gap-6 md:gap-10">
            <Link href="/dashboard-secret-portal" className={`${utilityLink} hidden md:block`}>
              CMS
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={email}
              className={`${utilityLink} disabled:opacity-50`}
            >
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
            <div className="transform hover:scale-110 transition-transform duration-500">
              <NotificationTrigger />
            </div>
          </div>
        </div>
      </FadeIn>
    </nav>
  )
}
