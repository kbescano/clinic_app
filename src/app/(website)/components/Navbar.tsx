'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FadeIn from '@/components/shared/FadeIn'

interface HeaderData {
  topLabel: string
  logoUrl?: string | null
  clinicName: string
}

interface NavbarProps {
  headerData: HeaderData
}

const LINKS = [
  { name: 'Services', href: '/services' },
  { name: 'Specialists', href: '/#specialists' },
  { name: 'My visits', href: '/appointments' },
]

export default function Navbar({ headerData }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0)
  const pathname = usePathname()

  const isHomePage = pathname === '/'
  const isTransparent = isHomePage && isAtTop

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY
      setIsAtTop(currentScrollY < 40)
      setIsVisible(!(currentScrollY > lastScrollY.current && currentScrollY > 100))
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', controlNavbar, { passive: true })
    return () => window.removeEventListener('scroll', controlNavbar)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isTransparent
          ? 'bg-transparent border-b border-transparent text-white'
          : 'bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-zinc-950 dark:border-white/20 text-zinc-950 dark:text-white'
      }`}
    >
      <FadeIn>
        <div className="max-w-[1800px] mx-auto px-6 md:px-14 h-20 md:h-24 flex items-center justify-between gap-6">
          {/* WORDMARK */}
          <Link href="/" className="flex flex-col leading-none">
            {isTransparent && headerData?.topLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] opacity-70 mb-1.5">
                {headerData.topLabel}
              </span>
            )}
            <span className="text-sm md:text-lg font-extrabold uppercase tracking-[0.14em] md:tracking-[0.18em] whitespace-nowrap">
              {headerData?.clinicName || 'Atelier'}
            </span>
          </Link>

          <div className="flex items-center gap-8 md:gap-10">
            <div className="hidden md:flex items-center gap-8">
              {LINKS.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs font-bold uppercase tracking-[0.18em] underline-offset-[10px] decoration-2 transition-opacity hover:opacity-60 ${
                      isActive ? 'underline' : ''
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>

            <Link
              href="/booking"
              className={`px-4 md:px-7 py-3 md:py-3.5 text-xs font-bold uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-300 ${
                isTransparent
                  ? 'bg-white text-zinc-950 hover:bg-zinc-200'
                  : 'bg-zinc-950 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200'
              }`}
            >
              Book now
            </Link>
          </div>
        </div>
      </FadeIn>
    </nav>
  )
}
