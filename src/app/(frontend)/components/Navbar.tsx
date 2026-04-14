'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ContactTrigger from './ContactTrigger'
import FadeIn from './FadeIn'

// --- TYPES & INTERFACES ---

interface ContactData {
  email: string
  address: string
  phoneNumber: string
  officeHours: string
}

interface HeaderData {
  topLabel: string
  logoUrl?: string | null
  clinicName: string
}

interface NavbarProps {
  contactData: ContactData
  headerData: HeaderData
}

export default function Navbar({ contactData, headerData }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0) // Using a Ref to prevent useEffect re-binding
  const pathname = usePathname()

  const isTransparent = pathname === '/' && isAtTop

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY

        // 1. Handle Top State
        setIsAtTop(currentScrollY < 50)

        // 2. Handle Show/Hide Logic
        // We use lastScrollY.current to compare without triggering a re-bind
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          setIsVisible(false) // Scrolling Down
        } else {
          setIsVisible(true) // Scrolling Up
        }

        lastScrollY.current = currentScrollY
      }
    }

    window.addEventListener('scroll', controlNavbar, { passive: true })
    return () => window.removeEventListener('scroll', controlNavbar)
  }, []) // Empty dependency array = Listener is bound only once

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] selection:bg-zinc-100 transition-all duration-700 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isTransparent
          ? 'bg-transparent border-transparent'
          : 'bg-white/80 dark:bg-[#050505]/80 backdrop-blur-lg border-b border-zinc-100/50 dark:border-zinc-900/50 shadow-sm'
      }`}
    >
      <FadeIn>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-20 md:h-24 flex items-center justify-between">
          {/* LEFT PILLAR: BOOKING (Home Page Only) */}
          <div className="flex-1 hidden md:flex items-center justify-start">
            {pathname === '/' && (
              <Link href="/booking" className="group relative py-2 overflow-hidden">
                <span
                  className={`text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-medium transition-all duration-500 font-serif inline-block transform group-hover:-translate-y-[1px] ${
                    isTransparent ? 'text-white' : 'text-[#595f72] dark:text-zinc-400'
                  }`}
                >
                  Book Appointment
                </span>
                <span
                  className={`absolute bottom-0 left-0 h-[1px] transition-all duration-500 ease-out group-hover:w-full w-0 ${
                    isTransparent ? 'bg-white' : 'bg-[#251101] dark:bg-zinc-400'
                  }`}
                />
              </Link>
            )}
          </div>

          {/* CENTER PILLAR: BRANDING */}
          <div className="flex-none text-center">
            <Link href="/" className="flex flex-col items-center group">
              <span
                className={`text-[10px] md:text-[11px] uppercase tracking-[0.7em] font-bold transition-colors duration-500 font-serif ${
                  isTransparent ? 'text-white' : 'text-[#251101] dark:text-zinc-100'
                }`}
              >
                {headerData?.clinicName || 'Clinic Registry'}
              </span>
            </Link>
          </div>

          {/* RIGHT PILLAR: CONTACT */}
          <div className="flex items-center justify-end gap-6 md:gap-10 flex-1">
            <div
              className={`transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-[#251101] dark:text-zinc-100'}`}
            >
              <ContactTrigger contactData={contactData} />
            </div>
          </div>
        </div>
      </FadeIn>
    </nav>
  )
}
