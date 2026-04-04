'use client'

import React, { useState, useEffect, useRef } from 'react'

export default function CinematicVideoHero() {
  const [isReady, setIsReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // FORCE MUTE: This bypasses the React 'muted' attribute bug
    if (videoRef.current) {
      videoRef.current.defaultMuted = true
      videoRef.current.muted = true
    }

    const timer = setTimeout(() => setIsReady(true), 400)
    return () => clearTimeout(timer)
  }, [])

  const slowEase = 'cubic-bezier(0.2, 0, 0.2, 1)'

  return (
    <section className="relative h-screen md:h-[100dvh] overflow-hidden bg-[#050505]">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className={`h-full w-full object-cover transition-all duration-[4000ms] ${slowEase} ${
          isReady ? 'scale-100 blur-0 opacity-100' : 'scale-110 blur-md opacity-0'
        } object-center`}
        poster="https://images.pexels.com/photos/12556701/pexels-photo-12556701.jpeg"
      >
        <source src="https://www.pexels.com/download/video/4267991/" type="video/mp4" />
      </video>

      {/* --- OPTICAL GRADIENTS --- */}
      <div className="absolute inset-0 z-10 bg-black/30 mix-blend-multiply pointer-events-none" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90 pointer-events-none" />

      {/* --- BOTTOM ANCHORED CONTENT --- */}
      <div className="absolute inset-0 z-40 flex flex-col justify-end px-6 pb-10 md:px-16 md:pb-16">
        <div className="max-w-7xl w-full mx-auto">
          <div className="flex items-start gap-4 md:gap-6">
            {/* THE ATELIER PILLAR: Extended duration for a "growing" effect */}
            <div
              className={`w-px bg-white/30 transition-all duration-[2500ms] ${slowEase} origin-bottom ${
                isReady ? 'h-14 md:h-20 opacity-100' : 'h-0 opacity-0'
              }`}
            />

            <div className="space-y-6">
              {/* 01. THE REGISTRY TAG: Microscopic & Technical */}
              <div
                className={`flex items-center gap-3 transition-all duration-[2000ms] delay-[800ms] ${slowEase} ${
                  isReady ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
              >
                <p className="text-[7px] md:text-[8px] font-mono tracking-[0.6em] text-white/30 uppercase">
                  [ collection.dermal_logic_2026 ]
                </p>
                <div
                  className={`h-px bg-white/10 transition-all duration-[2000ms] delay-[1000ms] ${
                    isReady ? 'w-12' : 'w-0'
                  }`}
                />
              </div>

              {/* 02. THE STANDOUT HEADER: Large, Thin, & Indented */}
              <div className="space-y-4">
                <h1
                  className={`text-[42px] md:text-[64px] font-serif font-light tracking-tighter text-white leading-[0.85] lowercase transition-all duration-[3000ms] delay-[1200ms] ${slowEase} ${
                    isReady ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-xl scale-[0.98]'
                  }`}
                >
                  the skin <br />
                  <span className="italic opacity-40 pl-12 md:pl-20 inline-block transition-all duration-[3000ms] delay-[1500ms]">
                    edit
                  </span>
                </h1>

                {/* 03. THE SUBTITLE: Justified Micro-Serif */}
                <p
                  className={`max-w-[240px] md:max-w-[300px] text-[10px] md:text-[11px] font-serif font-light text-white/40 leading-relaxed tracking-tight transition-all duration-[2500ms] delay-[2000ms] ${slowEase} ${
                    isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  Personalized skin care solutions designed for{' '}
                  <span className="text-white/80 italic underline underline-offset-4 decoration-white/10">
                    healthy, radiant skin
                  </span>
                  . A new attitude towards dermal health emerges.
                </p>
              </div>

              {/* 04. KINETIC ANCHOR: The structural "end" point */}
              <div
                className={`transition-all duration-[2000ms] delay-[2800ms] ${slowEase} ${
                  isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  <div className="w-12 h-px bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
