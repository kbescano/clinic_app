'use client'

import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] flex items-center justify-center selection:bg-zinc-100">
      <div className="flex flex-col items-center gap-6">
        {/* ATELIER SPINNER: A thin, elegant drawing line */}
        <div className="w-[1px] h-12 bg-zinc-900 dark:bg-white animate-pulse" />

        <div className="space-y-2 text-center">
          <p className="text-[9px] uppercase tracking-[0.6em] text-zinc-400 font-serif italic animate-pulse">
            Loading...
          </p>
          <span className="block text-[4px] opacity-10 uppercase tracking-[0.3em] text-zinc-300 dark:text-zinc-700 font-serif">
            ken escaño
          </span>
        </div>
      </div>
    </div>
  )
}
