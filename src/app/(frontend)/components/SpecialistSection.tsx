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
      ([entry]) => setIsHeaderVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' },
    )
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="specialists"
      className="bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900">
        {/* EDITORIAL HEADER */}
        <div ref={headerRef} className="px-8 md:px-12 pt-32 pb-16">
          <header className="space-y-6">
            <div className="flex flex-col space-y-4">
              <span
                className={`text-[8px] uppercase tracking-[0.8em] text-[#595f72] font-serif block transition-all duration-[1200ms] ${
                  isHeaderVisible ? 'opacity-50 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                Clinical Staff
              </span>
              <h2
                className={`text-[24px] md:text-[32px] font-normal font-serif tracking-tight text-[#251101] dark:text-white leading-none transition-all duration-[1200ms] delay-200 ${
                  isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Specialists
              </h2>
            </div>
            {/* Atelier Signature Line */}
            <div
              className={`h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[2000ms] delay-500 ${
                isHeaderVisible ? 'w-12 opacity-20' : 'w-0 opacity-0'
              }`}
            />
          </header>
        </div>

        {/* GRID REGISTRY: No gap for a seamless catalog feel */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-zinc-100 dark:border-zinc-900">
          {specialists.map((specialist, index) => (
            <SpecialistCard
              key={specialist.id}
              specialist={specialist}
              serverUrl={serverUrl}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// --- SUB-COMPONENT ---
function SpecialistCard({
  specialist,
  serverUrl,
  index,
}: {
  specialist: Specialist
  serverUrl: string
  index: number
}) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    })
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
  const formattedIndex = (index + 1).toString().padStart(2, '0')

  return (
    <div
      ref={cardRef}
      className="group flex flex-col h-full bg-white dark:bg-[#050505] border-r border-b border-zinc-100 dark:border-zinc-900 last:border-r-0 md:[&:nth-child(2n)]:border-r-0 transition-colors duration-1000"
    >
      {/* IMAGE: Taller, cinematic verticality */}
      <div className="relative overflow-hidden w-full h-[550px] md:h-[750px] bg-zinc-50 dark:bg-black grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[1500ms]">
        {finalImageUrl ? (
          <Image
            className={`object-cover transition-all duration-[2000ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            }`}
            src={finalImageUrl}
            alt={specialist.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[7px] uppercase tracking-[0.8em] font-serif text-zinc-400">
            Image Offline
          </div>
        )}
        {/* Editorial Index */}
        <span className="absolute top-8 left-8 z-10 text-[9px] font-serif text-white/30 tracking-[0.4em]">
          /{formattedIndex}
        </span>
      </div>

      {/* CONTENT: Refined Alignment */}
      <div className="p-10 md:p-16 flex flex-col flex-grow justify-center space-y-8">
        <div className="space-y-4">
          <p
            className={`text-[8px] uppercase tracking-[0.6em] text-[#595f72] font-serif transition-all duration-[1200ms] delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {specialist.specialization}
          </p>
          <h3
            className={`text-[18px] md:text-[22px] font-normal font-serif text-[#251101] dark:text-white leading-none tracking-tight transition-all duration-[1200ms] delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {specialist.name}
          </h3>
        </div>

        {/* Signature Hairline Indicator */}
        <div
          className={`pt-8 border-t border-zinc-100 dark:border-zinc-900 transition-all duration-[1500ms] delay-600 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-8 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 group-hover:w-full opacity-30 group-hover:opacity-100" />
        </div>
      </div>
    </div>
  )
}
