'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Specialist, Media } from '@/payload-types'

// --- CONSTANTS ---
const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

// --- MAIN COMPONENT ---
export default function SpecialistSection({ specialists }: { specialists: Specialist[] }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsHeaderVisible(entry.isIntersecting),
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' },
    )
    if (headerRef.current) observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="specialists"
      className="bg-white dark:bg-[#050505] pt-16 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100"
    >
      {/* BOUNDED CONTAINER: flex-col for mobile, flex-row for sticky side-header on desktop */}
      <div className="max-w-[1440px] mx-auto border-x border-zinc-950 dark:border-zinc-700 flex flex-col md:flex-row relative">
        {/* STICKY HEADER COLUMN 
            md:sticky top-24: keeps header in view on desktop
            sticky top-0: keeps header pinned on mobile
        */}
        <div className="w-full md:w-1/3 p-6 md:p-12 border-b md:border-b-0 md:border-r border-zinc-950 dark:border-zinc-700 z-30 bg-white dark:bg-[#050505] sticky top-0 md:top-24 self-start h-fit overflow-hidden">
          <div ref={headerRef}>
            <header className="space-y-6">
              <div className="flex flex-col space-y-4">
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 block transition-all duration-[1200ms] ${atelierEase} ${
                    isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                >
                  Clinical staff
                </span>
                <h2
                  className={`text-5xl md:text-6xl font-extrabold tracking-tighter text-zinc-950 dark:text-white leading-[0.9] transition-all duration-[1200ms] delay-[150ms] ${atelierEase} ${
                    isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  Specialists
                </h2>
              </div>
              {/* Atelier Signature Line: Draws in */}
              <div
                className={`h-1 bg-zinc-950 dark:bg-white transition-all duration-[1500ms] delay-[300ms] ${atelierEase} ${
                  isHeaderVisible ? 'w-16' : 'w-0'
                }`}
              />
            </header>
          </div>
        </div>

        {/* GRID REGISTRY: Occupies the right column */}
        <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 border-t md:border-t-0 border-zinc-950 dark:border-zinc-700">
          {specialists.map((specialist, index) => (
            <SpecialistCard
              key={specialist.id}
              specialist={specialist}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// --- SUB-COMPONENT (Logic & Animation Unchanged) ---
function SpecialistCard({ specialist, index }: { specialist: Specialist; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.2,
      rootMargin: '0px 0px -50px 0px',
    })
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const imageDoc = specialist.image as Media | undefined
  // Media URLs are relative (/api/media/file/...) and must resolve against whichever host is
  // serving the page; prefixing NEXT_PUBLIC_SERVER_URL breaks them whenever that host changes.
  const finalImageUrl = imageDoc?.url || ''
  const formattedIndex = (index + 1).toString().padStart(2, '0')

  return (
    <div
      ref={cardRef}
      className="group flex flex-col h-full bg-white dark:bg-[#050505] border-r border-b border-zinc-950 dark:border-zinc-700 last:border-r-0 md:[&:nth-child(2n)]:border-r-0"
    >
      <div className="relative overflow-hidden w-full h-[550px] md:h-[750px] bg-zinc-100 dark:bg-black md:grayscale md:group-hover:grayscale-0 transition-[filter] duration-700">
        <div
          className={`absolute inset-0 z-20 bg-white dark:bg-[#050505] origin-right transition-transform duration-[2000ms] ${atelierEase} ${
            isVisible ? 'scale-x-0' : 'scale-x-100'
          }`}
        />

        <div
          className={`h-full w-full transition-all duration-[2500ms] delay-200 ${atelierEase} origin-center ${
            isVisible ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.1] blur-[15px]'
          }`}
        >
          {finalImageUrl ? (
            <Image
              className={`object-cover transition-all duration-[3000ms] ${atelierEase} group-hover:scale-[1.03]`}
              src={finalImageUrl}
              alt={specialist.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
              Image Offline
            </div>
          )}
        </div>

        <span
          className={`absolute top-6 left-6 z-30 text-sm font-bold tabular-nums tracking-widest text-white mix-blend-difference transition-all duration-[1200ms] delay-[600ms] ${atelierEase} ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          /{formattedIndex}
        </span>
      </div>

      <div className="relative p-8 md:p-12 flex flex-col flex-grow justify-center space-y-8">
        <div className="space-y-4">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition-all duration-[1000ms] delay-[300ms] ${atelierEase} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {specialist.specialization}
          </p>
          <h3
            className={`text-3xl md:text-4xl font-extrabold tracking-tighter text-zinc-950 dark:text-white leading-[1.02] transition-all duration-[1000ms] delay-[450ms] ${atelierEase} ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {specialist.name}
          </h3>
        </div>

        <div
          className={`h-1 bg-zinc-950 dark:bg-white transition-all duration-[700ms] ${atelierEase} ${
            isVisible ? 'w-12 opacity-100' : 'w-0 opacity-0'
          } group-hover:w-full`}
        />
      </div>
    </div>
  )
}
