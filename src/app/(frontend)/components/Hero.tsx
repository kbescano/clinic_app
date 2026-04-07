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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // SVG Circle Constants
  const radius = 8
  const circumference = 2 * Math.PI * radius

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
      {/* --- CINEMATIC OVERLAYS --- */}
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle,transparent_20%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

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

      {/* --- CONTENT OVERLAY --- */}
      <div className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center px-6">
        {SLIDES.map((slide, index) => (
          <div
            key={`content-${slide.id}`}
            className={`absolute w-full max-w-5xl flex flex-col items-center transition-all duration-[1500ms] ${slowEase} ${
              currentSlide === index
                ? 'opacity-100 translate-y-0 blur-0 scale-100'
                : 'opacity-0 translate-y-12 blur-xl scale-95 pointer-events-none'
            }`}
          >
            <p className="text-[10px] md:text-xs font-bold tracking-[0.5em] uppercase mb-6 opacity-70">
              {slide.label}
            </p>

            <h1 className="text-[11vw] md:text-[140px] font-bold tracking-tighter uppercase leading-[1] lg:leading-[0.85] mb-12 max-w-[14ch] md:max-w-[12ch] mx-auto text-balance drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              {slide.title}
            </h1>

            <Link href={'/booking'}>
              <button className="group relative flex items-center gap-6 px-8 py-4 transition-all duration-500">
                <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold group-hover:text-white/70 transition-colors">
                  {slide.cta}
                </span>
                <div className="relative w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black transition-all duration-500 ease-out overflow-hidden">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="relative z-10"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </button>
            </Link>
          </div>
        ))}
      </div>

      {/* --- DYNAMIC PAGINATION: NO DOT IF ACTIVE --- */}
      <div className="absolute bottom-12 -translate-y-10 left-0 w-full z-50 flex justify-center items-center gap-4 md:gap-6">
        {SLIDES.map((_, index) => {
          const isActive = currentSlide === index
          return (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="group relative w-10 h-10 flex items-center justify-center"
            >
              {/* Center Dot: Opacity-0 if active (hidden) */}
              <div
                className={`absolute w-1 h-1 rounded-full transition-all duration-700 ease-in-out ${
                  isActive
                    ? 'bg-white opacity-0 scale-50'
                    : 'bg-white/30 group-hover:bg-white/60 opacity-100 scale-100'
                }`}
              />

              {/* Progress Circle: Only appears and animates when active */}
              <svg
                className={`absolute inset-0 w-full h-full -rotate-90 transform transition-all duration-1000 ${slowEase} ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                {/* Thin Track Circle (Faint) */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="transparent"
                  className="text-white/10"
                />
                {/* Active Progress Border */}
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  style={{
                    strokeDashoffset: isActive ? 0 : circumference,
                    // linear timing for the 6s countdown
                    transition: isActive ? 'stroke-dashoffset 6000ms linear' : 'none',
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
