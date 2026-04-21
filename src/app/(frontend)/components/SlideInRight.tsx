'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SlideInRightProps {
  children: React.ReactNode
  /** Dynamic width for medium screens and up (e.g., '40vw', '500px') */
  width?: string
}

export default function SlideInRight({ children, width = '50vw' }: SlideInRightProps) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{
        duration: 0.8,
        ease: [0.33, 1, 0.68, 1], // Luxury "weighted" cubic bezier
      }}
      // 1. Pass the dynamic value as a CSS variable
      style={{ '--slide-width': width } as React.CSSProperties}
      // 2. Reference the variable in a static Tailwind class
      className="fixed top-0 right-0 h-full w-full md:w-[var(--slide-width)] bg-white dark:bg-black z-[210] shadow-2xl border-l border-zinc-100 dark:border-zinc-900 overflow-y-auto"
    >
      {children}
    </motion.div>
  )
}
