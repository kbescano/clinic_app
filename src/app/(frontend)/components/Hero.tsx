'use client'

import Link from 'next/link'
import React, { useState, useEffect, useRef } from 'react'

const SLIDES = [
  {
    id: 1,
    label: 'Clinical Treatments',
    title: 'The Art of Rejuvenation',
    cta: 'Discover the process',
    video: 'https://www.pexels.com/download/video/4267991/', // Placeholder for Sports Cars
  },
  {
    id: 2,
    label: 'The Collection',
    title: 'Your Daily Ritual',
    cta: 'Shop the edit',
    video: 'https://www.pexels.com/download/video/4264901/', // Placeholder for Collections
  },
  {
    id: 3,
    label: 'Advanced Dermal',
    title: 'Precision Skin Care',
    cta: 'Book an analysis',
    video: 'https://www.pexels.com/download/video/8204093/', // Placeholder for Racing
  },
]

export default function CinematicVideoHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // SLIDE TIMER: Cycles every 6 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)

    const readyTimer = setTimeout(() => setIsReady(true), 400)

    return () => {
      clearInterval(slideTimer)
      clearTimeout(readyTimer)
    }
  }, [])

  // FORCE MUTE: Handle all video refs
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
    <section className="relative h-screen md:h-[100dvh] overflow-hidden bg-[#050505] text-white font-sans">
      {/* --- VIDEO STACK (CROSS-FADE) --- */}
      {SLIDES.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ${slowEase} ${
            currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <video
            // Wrap the assignment in curly braces to ensure it returns void
            ref={(el) => {
              videoRefs.current[index] = el
            }}
            autoPlay
            loop
            muted
            playsInline
            className={`h-full w-full object-cover transition-transform duration-[6000ms] ${
              currentSlide === index && isReady ? 'scale-105' : 'scale-100'
            }`}
          >
            <source src={slide.video} type="video/mp4" />
          </video>
          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        </div>
      ))}

      {/* --- CONTENT OVERLAY --- */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6">
        {SLIDES.map((slide, index) => (
          <div
            key={`content-${slide.id}`}
            className={`absolute flex flex-col items-center transition-all duration-[1200ms] ${slowEase} ${
              currentSlide === index
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10 pointer-events-none'
            }`}
          >
            <p className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mb-4 opacity-80">
              {slide.label}
            </p>
            {/* UPDATED: Dropped mobile font to text-4xl/5xl and tightened character limit */}
            <h1 className="text-3xl md:text-8xl font-bold tracking-tight md:tracking-[0.1em] uppercase leading-[1.1] md:leading-[0.9] mb-10 max-w-[16ch] md:max-w-[15ch] mx-auto whitespace-normal text-balance break-normal">
              {slide.title}
            </h1>
            <Link href={'/booking'}>
              <button className="group flex items-center gap-4 text-[8px] md:text-xs tracking-[0.3em] uppercase hover:text-black transition-colors">
                <span>{slide.cta}</span>

                <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:border-black transition-all">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* --- INTERACTIVE PAGINATION --- */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        {SLIDES.map((_, index) => (
          <button key={index} onClick={() => setCurrentSlide(index)} className="group relative p-2">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                currentSlide === index ? 'bg-black scale-125' : 'bg-white/40 hover:bg-white'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
