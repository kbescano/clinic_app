'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Specialist, Media } from '@/payload-types'

// --- CONSTANTS ---
const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

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
    // Increased threshold to 0.2 for deliberate scroll timing
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
      className="bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-100 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto border-x border-zinc-100 dark:border-zinc-900">
        {/* EDITORIAL HEADER: Choreographed Entrance */}
        <div ref={headerRef} className="px-8 md:px-12 pt-32 pb-16 overflow-hidden">
          <header className="space-y-6">
            <div className="flex flex-col space-y-4">
              <span
                className={`text-[8px] uppercase text-[#595f72] font-serif block transition-all duration-[2000ms] ${atelierEase} ${
                  isHeaderVisible
                    ? 'opacity-50 translate-y-0 tracking-[0.8em]'
                    : 'opacity-0 translate-y-8 tracking-[1.5em]'
                }`}
              >
                Clinical Staff
              </span>
              <h2
                className={`text-[24px] md:text-[32px] font-normal font-serif text-[#251101] dark:text-white leading-none transition-all duration-[2000ms] delay-[200ms] ${atelierEase} ${
                  isHeaderVisible
                    ? 'opacity-100 translate-y-0 tracking-tight'
                    : 'opacity-0 translate-y-12 tracking-[0.2em]'
                }`}
              >
                Specialists
              </h2>
            </div>
            {/* Atelier Signature Line: Draws in */}
            <div
              className={`h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[2500ms] delay-[400ms] ${atelierEase} ${
                isHeaderVisible ? 'w-12 opacity-20' : 'w-0 opacity-0'
              }`}
            />
          </header>
        </div>

        {/* GRID REGISTRY */}
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
    // 20% visibility required before the curtain opens
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.2,
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
      {/* IMAGE CONTAINER */}
      <div className="relative overflow-hidden w-full h-[550px] md:h-[750px] bg-zinc-50 dark:bg-black grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[1500ms]">
        {/* 1. THE CURTAIN REVEAL: Solid block sliding right */}
        <div
          className={`absolute inset-0 z-20 bg-white dark:bg-[#050505] origin-right transition-transform duration-[2000ms] ${atelierEase} ${
            isVisible ? 'scale-x-0' : 'scale-x-100'
          }`}
        />

        {/* The Image (Scales down & un-blurs as the curtain opens) */}
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
            <div className="w-full h-full flex items-center justify-center text-[7px] uppercase tracking-[0.8em] font-serif text-zinc-400">
              Image Offline
            </div>
          )}
        </div>

        {/* Editorial Index: Floats in */}
        <span
          className={`absolute top-8 left-8 z-30 text-[9px] font-serif text-white/40 mix-blend-difference transition-all duration-[2000ms] delay-[800ms] ${atelierEase} ${
            isVisible
              ? 'opacity-100 translate-y-0 tracking-[0.4em]'
              : 'opacity-0 -translate-y-4 tracking-[1em]'
          }`}
        >
          /{formattedIndex}
        </span>
      </div>

      {/* CONTENT CONTAINER */}
      <div className="relative p-10 md:p-16 flex flex-col flex-grow justify-center space-y-8">
        <div className="space-y-4">
          {/* 2. TYPOGRAPHY COLLAPSE */}
          <p
            className={`text-[8px] uppercase text-[#595f72] font-serif transition-all duration-[1500ms] delay-[400ms] ${atelierEase} ${
              isVisible
                ? 'opacity-100 translate-y-0 tracking-[0.6em]'
                : 'opacity-0 translate-y-8 tracking-[1em]'
            }`}
          >
            {specialist.specialization}
          </p>
          <h3
            className={`text-[18px] md:text-[22px] font-normal font-serif text-[#251101] dark:text-white leading-none transition-all duration-[1500ms] delay-[600ms] ${atelierEase} ${
              isVisible
                ? 'opacity-100 translate-y-0 tracking-tight'
                : 'opacity-0 translate-y-8 tracking-[0.2em]'
            }`}
          >
            {specialist.name}
          </h3>
        </div>

        {/* 3. DRAW-IN HAIRLINES */}
        <div className="relative pt-8 mt-8">
          {/* Base structural line draws left-to-right */}
          <div
            className={`absolute top-0 left-0 h-[0.5px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[2000ms] delay-[800ms] ${atelierEase} ${
              isVisible ? 'w-full' : 'w-0'
            }`}
          />

          {/* Signature dark line fades up and expands on hover */}
          <div
            className={`w-8 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-[1500ms] delay-[1000ms] ${atelierEase} ${
              isVisible ? 'opacity-30 translate-y-0' : 'opacity-0 translate-y-4'
            } group-hover:w-full group-hover:opacity-100`}
          />
        </div>
      </div>
    </div>
  )
}
