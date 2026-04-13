'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Specialist, Media } from '@/payload-types'

// --- MAIN COMPONENT ---
export default function SpecialistSection({
  specialists,
  serverUrl,
}: {
  specialists: Specialist[]
  serverUrl: string
}) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      },
    )

    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="specialists"
      className="bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900 bg-white dark:bg-[#050505]">
        {/* ANIMATED HEADER */}
        <div ref={headerRef} className="px-4 md:px-12 pt-24 md:pt-32 bg-white dark:bg-[#050505]">
          <header className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-start gap-4 md:gap-5">
              <div
                className={`bg-zinc-900 dark:bg-white transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isHeaderVisible ? 'w-[1px] h-12 md:h-16 opacity-100' : 'w-[1px] h-0 opacity-0'
                }`}
              />
              <div className="space-y-1">
                <p
                  className={`text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-[#595f72] font-serif transition-all duration-[1200ms] delay-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  Clinical Expertise
                </p>
                <h2
                  className={`text-[20px] md:text-[24px] font-light font-serif text-[#251101] dark:text-white uppercase leading-none tracking-tight transition-all duration-[1200ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isHeaderVisible
                      ? 'opacity-100 translate-y-0 blur-0'
                      : 'opacity-0 translate-y-6 blur-md'
                  }`}
                >
                  Meet Our Specialists
                </h2>
              </div>
            </div>
          </header>
        </div>

        {/* GRID REGISTRY: Updated to 2 columns for all desktop views */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px lg:gap-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-900">
          {specialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} serverUrl={serverUrl} />
          ))}
        </div>
      </div>
    </section>
  )
}

// --- SUB-COMPONENT ---
function SpecialistCard({ specialist, serverUrl }: { specialist: Specialist; serverUrl: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const imageDoc = specialist.image as Media | undefined
  const rawPath = imageDoc?.url || ''
  const finalImageUrl = rawPath.startsWith('http')
    ? rawPath
    : rawPath
      ? `${serverUrl}${rawPath}`
      : ''

  return (
    <div
      ref={cardRef}
      className="group flex flex-col h-full bg-white dark:bg-black transition-colors duration-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10"
    >
      <div className="relative overflow-hidden w-full h-[500px] md:h-[700px] bg-white dark:bg-black grayscale-[0.2] group-hover:grayscale-0 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
        {finalImageUrl ? (
          <Image
            className={`object-cover transition-all duration-[2000ms] group-hover:scale-105 ${
              isVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-110 blur-md'
            }`}
            src={finalImageUrl}
            alt={specialist.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[8px] uppercase tracking-[0.4em] font-serif text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/10">
            Image Unavailable
          </div>
        )}
      </div>

      <div className="p-8 md:p-12 flex flex-col flex-grow border-t border-zinc-100 dark:border-zinc-900">
        <div className="space-y-4">
          <p
            className={`text-[8px] md:text-[9px] uppercase tracking-[0.4em] font-serif text-[#595f72] dark:text-zinc-500 transition-all duration-[1200ms] delay-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {specialist.specialization}
          </p>
          <h3
            className={`text-[16px] md:text-[18px] font-light font-serif text-[#251101] dark:text-white leading-tight tracking-tighter uppercase transition-all duration-[1200ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-md'}`}
          >
            {specialist.name}
          </h3>
        </div>

        <div
          className={`mt-10 pt-6 border-t border-zinc-50 dark:border-zinc-900/50 flex justify-end transition-all duration-[1500ms] delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="w-12 h-[1px] bg-zinc-100 dark:bg-zinc-800 group-hover:w-full group-hover:bg-zinc-900 dark:group-hover:bg-white transition-all duration-[1000ms]" />
        </div>
      </div>
    </div>
  )
}
