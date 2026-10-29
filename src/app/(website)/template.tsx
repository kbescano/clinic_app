'use client'

import { motion } from 'motion/react'

/**
 * Re-mounts on every navigation, giving each page a soft fade-in. Opacity only: a transform here
 * would turn this wrapper into the containing block for the fixed buttons inside pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
