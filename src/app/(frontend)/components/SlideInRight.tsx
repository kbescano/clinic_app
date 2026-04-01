'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function SlideInRight({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{
        duration: 0.8,
        ease: [0.33, 1, 0.68, 1], // Luxury "weighted" cubic bezier
      }}
      className="fixed top-0 right-0 h-full w-full md:w-[50vw] bg-white dark:bg-black z-[210] shadow-2xl border-l border-zinc-100 dark:border-zinc-900 overflow-y-auto"
    >
      {children}
    </motion.div>
  )
}
