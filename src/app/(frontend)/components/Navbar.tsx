'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ContactTrigger from './ContactTrigger'
import FadeIn from './FadeIn'

interface NavbarProps {
  contactData: any
  headerData: any
}

export default function Navbar({ contactData, headerData }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // --- SCROLL LOGIC ---
  useEffect(() => {
    const controlNavbar = () => {
      // Show navbar if at the top, or if scrolling up. Hide on scroll down.
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false) // Scrolling Down
        } else {
          setIsVisible(true) // Scrolling Up
        }
        setLastScrollY(window.scrollY)
      }
    }

    window.addEventListener('scroll', controlNavbar)
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [lastScrollY])

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-900 z-[100] selection:bg-zinc-100 transition-transform duration-500 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <FadeIn>
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-20 md:h-24 flex items-center justify-between">
          {/* LEFT PILLAR (Empty to balance the layout) */}
          <div className="flex-1 hidden md:block" />

          {/* CENTER PILLAR: BRANDING */}
          <div className="flex-none text-center">
            <Link href="/" className="flex flex-col items-center group">
              {/* ATELIER LOGO: Small, High Tracking */}
              <span className="text-[10px] uppercase tracking-[0.6em] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors font-serif">
                {headerData?.clinicName || 'Clinic Registry'}
              </span>
            </Link>
          </div>

          {/* RIGHT PILLAR: CONTACT */}
          <div className="flex items-center justify-end gap-6 md:gap-10 flex-1">
            <div className="flex items-center">
              <ContactTrigger contactData={contactData} />
            </div>
          </div>
        </div>
      </FadeIn>
    </nav>
  )
}
