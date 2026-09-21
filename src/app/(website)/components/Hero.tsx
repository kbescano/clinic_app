'use client'

import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    id: 1,
    label: 'Clinical Treatments',
    title: 'The Art of Rejuvenation',
    cta: 'Discover the process',
    video: 'https://www.pexels.com/download/video/4267991/',
  },
  {
    id: 2,
    label: 'The Collection',
    title: 'Your Daily Ritual',
    cta: 'Shop the edit',
    video: 'https://www.pexels.com/download/video/4264901/',
  },
  {
    id: 3,
    label: 'Advanced Dermal',
    title: 'Precision Skin Care',
    cta: 'Book an analysis',
    video: 'https://www.pexels.com/download/video/8204093/',
  },
]

export default function CinematicVideoHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isMounted, setIsMounted] = useState(false) // Trigger for first-load animation
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const radius = 8
  const circumference = 2 * Math.PI * radius
  const SLIDE_DURATION = 6000

  useEffect(() => {
    // Force a re-render to start the first animation
    setIsMounted(true)

    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, SLIDE_DURATION)

    const readyTimer = setTimeout(() => setIsReady(true), 400)

    return () => {
      clearInterval(slideTimer)
      clearTimeout(readyTimer)
    }
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((video) => {
      if (video) {
        video.defaultMuted = true
        video.muted = true
      }
    })
  }, [isReady])

  const slowEase = 'cubic-bezier(0.2, 0, 0.2, 1)'

  return (
    <section className="relative h-[95dvh] md:h-[100dvh] overflow-hidden bg-[#050505] text-white font-sans">
      {/* --- CINEMATIC OVERLAYS --- */}
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-black/10 to-black/40 pointer-events-none" />

      {/* --- VIDEO STACK --- */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ${slowEase} ${
            currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <video
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            autoPlay
            loop
            muted
            playsInline
            className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
              currentSlide === index && isReady ? 'scale-105' : 'scale-100'
            }`}
          >
            <source src={slide.video} type="video/mp4" />
          </video>
        </div>
      ))}

      {/* --- CONTENT OVERLAY: bottom-left, editorial --- */}
      <div className="absolute inset-0 z-40">
        {SLIDES.map((slide, index) => (
          <div
            key={`content-${slide.id}`}
            className={`absolute left-6 right-6 md:left-14 md:right-14 bottom-28 md:bottom-32 flex flex-col items-start transition-all duration-[1200ms] ${slowEase} ${
              currentSlide === index
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10 pointer-events-none'
            }`}
            aria-hidden={currentSlide !== index}
          >
            <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-5 md:mb-8">
              {slide.label}
            </p>

            {currentSlide === index ? (
              <h1 className="text-[clamp(2.75rem,9.5vw,10rem)] font-extrabold tracking-tighter uppercase leading-[0.86] mb-8 md:mb-12 max-w-[16ch] text-balance">
                {slide.title}
              </h1>
            ) : (
              <p
                aria-hidden
                className="text-[clamp(2.75rem,9.5vw,10rem)] font-extrabold tracking-tighter uppercase leading-[0.86] mb-8 md:mb-12 max-w-[16ch] text-balance"
              >
                {slide.title}
              </p>
            )}

            <Link
              href="/booking"
              tabIndex={currentSlide === index ? 0 : -1}
              className="group inline-flex items-center gap-4 bg-white text-zinc-950 px-7 md:px-9 py-4 md:py-5 text-xs md:text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-zinc-200"
            >
              {slide.cta}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      {/* --- DYNAMIC PAGINATION: NO DOT IF ACTIVE --- */}
      <div className="absolute bottom-10 left-5 md:left-[52px] z-50 flex items-center gap-1 md:gap-2">
        {SLIDES.map((_, index) => {
          const isActive = currentSlide === index
          return (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              // Reduced from w-10 to w-6 to pull them closer
              className="group relative w-6 h-6 flex items-center justify-center"
            >
              {/* Center Dot */}
              <div
                className={`absolute w-1 h-1 rounded-full transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'bg-white opacity-0 scale-50'
                    : 'bg-white/30 group-hover:bg-white/60 opacity-100 scale-100'
                }`}
              />

              {/* Progress Circle Container */}
              <svg
                className={`absolute inset-0 w-full h-full -rotate-90 transform transition-all duration-1000 ${slowEase} ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="transparent"
                  className="text-white/10"
                />
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  style={{
                    // Logic: Start at full circumference, transition to 0 ONLY if mounted and active
                    strokeDashoffset: isActive && isMounted ? 0 : circumference,
                    transition: isActive ? `stroke-dashoffset ${SLIDE_DURATION}ms linear` : 'none',
                  }}
                  className="text-white"
                />
              </svg>
            </button>
          )
        })}
      </div>
    </section>
  )
}
