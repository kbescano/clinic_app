'use client'

import React from 'react'
import { motion } from 'motion/react'
import { useScrollLock } from '@/components/shared/SmoothScroll'

/**
 * A sheet that rises from the bottom edge: full screen on phones, a centred panel on desktop.
 * Mounting it locks page scroll; unmounting releases it.
 */
export default function SlideFromBottom({ children, label }: { children: React.ReactNode; label: string }) {
  useScrollLock(true)

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
      className="fixed inset-0 z-[250] flex h-full w-full flex-col border-zinc-950 bg-white dark:border-zinc-700 dark:bg-black md:inset-x-auto md:bottom-0 md:left-1/2 md:top-auto md:h-auto md:max-h-[88vh] md:w-[min(760px,92vw)] md:-translate-x-1/2 md:border-x-2 md:border-t-2"
    >
      {/* data-lenis-prevent: the sheet scrolls natively even though the page behind is locked */}
      <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </motion.div>
  )
}
