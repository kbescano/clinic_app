'use client'

import React, { useState, useEffect } from 'react'

export default function CinematicVideoHero() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // A slightly longer initial delay to let the browser settle
    const timer = setTimeout(() => setIsReady(true), 400)
    return () => clearTimeout(timer)
  }, [])

  // Custom long-duration ease for that "Atelier" feel
  const slowEase = 'cubic-bezier(0.2, 0, 0.2, 1)'

  return (
    <section className="relative h-[50vh] md:h-[65vh] overflow-hidden bg-[#050505] selection:bg-white selection:text-black">
      {/* --- VIDEO ENGINE: Very slow zoom and fade --- */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`h-full w-full object-cover transition-all duration-[4000ms] ${slowEase} ${
          isReady ? 'scale-100 blur-0 opacity-100' : 'scale-110 blur-md opacity-0'
        }`}
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

            <div className="space-y-3">
              {/* MAIN TITLE: Slow blur-to-clear transition */}
              <div
                className={`space-y-1 transition-all duration-[3000ms] delay-[1200ms] ${slowEase} ${
                  isReady ? 'opacity-100 blur-0' : 'opacity-0 blur-lg'
                }`}
              >
                <h1 className="text-[18px] md:text-[22px] font-serif font-light tracking-tighter text-white leading-none lowercase">
                  our <span className="opacity-40">treatments</span>
                </h1>

                {/* SUBTITLE: Whisper-thin fade */}
                <p
                  className={`max-w-[260px] text-[10px] md:text-[11px] font-serif font-light text-white/40 leading-relaxed tracking-tight transition-all duration-[2500ms] delay-[1800ms] ${slowEase} ${
                    isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  Personalized skin care solutions designed for{' '}
                  <span className="text-white/70">healthy, radiant skin</span>.
                </p>
              </div>

              {/* KINETIC DISCOVERY CUE: Fades in last */}
              <div
                className={`pt-2 transition-all duration-[2000ms] delay-[2500ms] ${slowEase} ${
                  isReady ? 'opacity-20' : 'opacity-0'
                }`}
              >
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
