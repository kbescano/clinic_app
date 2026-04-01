'use client'

import React from 'react'

export function RegistrySkeleton() {
  return (
    <div className="w-full animate-pulse">
      {/* MOCK HEADER */}
      <div className="flex items-start gap-5 mb-16">
        <div className="w-[1px] h-12 bg-zinc-100 dark:bg-zinc-900" />
        <div className="space-y-3">
          <div className="h-2 w-24 bg-zinc-50 dark:bg-zinc-900/50" />
          <div className="h-6 w-48 bg-zinc-50 dark:bg-zinc-900/50" />
        </div>
      </div>

      {/* MOCK BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 mb-20">
        <div className="md:col-span-6 h-64 bg-white dark:bg-black" />
        <div className="md:col-span-3 h-64 bg-white dark:bg-black" />
        <div className="md:col-span-3 h-64 bg-white dark:bg-black" />
      </div>

      {/* MOCK TABLE ROWS */}
      <div className="space-y-px bg-zinc-100 dark:bg-zinc-900">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-white dark:bg-black flex items-center px-8 justify-between"
          >
            <div className="h-3 w-32 bg-zinc-50 dark:bg-zinc-900/50" />
            <div className="h-3 w-48 bg-zinc-50 dark:bg-zinc-900/50" />
            <div className="h-6 w-12 bg-zinc-50 dark:bg-zinc-900/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
