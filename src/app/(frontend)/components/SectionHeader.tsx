'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import FadeIn from './FadeIn'

interface SectionHeaderProps {
  topLabel?: string
  clinicName?: string
  logoUrl?: string | null
}

export default function SectionHeader({ topLabel, clinicName, logoUrl }: SectionHeaderProps) {
  const [opacity, setOpacity] = useState(1)
  const [isScrolled, setIsScrolled] = useState(false)

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY

    // 1. Handle Border State
    setIsScrolled(scrollY > 20)

    // 2. Universal Fade Logic
    const fadeDistance = 300
    const newOpacity = Math.max(1 - scrollY / fadeDistance, 0)
    setOpacity(newOpacity)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <header
      style={{
        opacity: opacity,
        visibility: opacity <= 0 ? 'hidden' : 'visible',
      }}
      className={`
        fixed top-0 left-0 w-full z-50
        transition-all duration-700 ease-out
        bg-white/80 dark:bg-[#050505]/90 backdrop-blur-xl
        border-b ${isScrolled ? 'border-zinc-100 dark:border-zinc-900 shadow-sm' : 'border-transparent'}
        pointer-events-auto
      `}
    >
      {/* 1440px Container to align with Registry Gird */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-20 border-x border-transparent lg:border-zinc-100 lg:dark:border-zinc-900/50">
        <FadeIn>
          <div className="flex items-center justify-between gap-8">
            {/* TEXT CONTENT: Couture Spine Pattern */}
            <div className="flex items-start gap-4 md:gap-5">
              {/* The Vertical Spine */}
              <div className="w-[1px] bg-zinc-900 dark:bg-white h-10 md:h-14 opacity-100 transition-transform duration-1000" />

              <div className="space-y-1">
                <p className="text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-zinc-400 font-serif font-medium">
                  {topLabel || 'Operations'}
                </p>

                <h2 className="text-2xl md:text-4xl font-light tracking-tighter font-serif text-zinc-900 dark:text-white leading-none uppercase">
                  {clinicName || 'Clinic'}
                </h2>

                {/* Subtle Ledger Accent */}
                <div className="mt-4 h-[1px] w-8 bg-zinc-900 dark:bg-white opacity-10" />
              </div>
            </div>

            {/* LOGO: Sharp Circle Pattern */}
            {logoUrl && (
              <div className="relative shrink-0 group">
                <div className="w-16 h-16 md:w-24 md:h-24 aspect-square bg-white dark:bg-black rounded-full border border-zinc-100 dark:border-zinc-900 flex items-center justify-center p-0 backdrop-blur-md overflow-hidden transition-all duration-700 group-hover:scale-105 group-hover:border-zinc-900 dark:group-hover:border-white">
                  <Image
                    src={logoUrl}
                    alt={`${clinicName} Logo`}
                    width={100}
                    height={100}
                    className="object-cover w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000"
                    priority
                  />
                </div>

                {/* Visual Orbit Accent */}
                <div className="absolute -inset-1 border border-zinc-900 dark:border-white opacity-0 group-hover:opacity-10 rounded-full scale-110 group-hover:scale-100 transition-all duration-1000 pointer-events-none" />
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </header>
  )
}
