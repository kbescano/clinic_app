'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

interface SlideFromBottomProps {
  children: React.ReactNode
  /** Dynamic height for desktop (e.g., '60vh', '500px') */
  height?: string
}

export default function SlideFromBottom({ children, height = '50vh' }: SlideFromBottomProps) {
  // --- THE NUCLEAR SCROLL LOCK ---
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflowY = 'hidden'

    return () => {
      const savedScrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      window.scrollTo(0, parseInt(savedScrollY || '0') * -1)
    }
  }, [])

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{
        duration: 0.8,
        ease: [0.33, 1, 0.68, 1],
      }}
      style={{ '--slide-height': height } as React.CSSProperties}
      /* MOBILE: Full width (w-full), Full height (h-full), anchored top-left (inset-0)
         DESKTOP (md): 50vw width, dynamic height, centered horizontally (left-1/2 -translate-x-1/2)
      */
      className="fixed inset-0 md:top-auto md:bottom-0 w-full h-full md:w-[50vw] md:h-[var(--slide-height)] md:left-1/2 md:-translate-x-1/2 bg-white dark:bg-black z-[250] shadow-2xl border-t md:border-x border-zinc-100 dark:border-zinc-900 flex flex-col"
    >
      {/* MINIMALIST DRAG HANDLE */}
      <div className="flex justify-center pt-4 pb-2 shrink-0">
        <div className="w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-hidden px-6 pb-12">{children}</div>
    </motion.div>
  )
}
