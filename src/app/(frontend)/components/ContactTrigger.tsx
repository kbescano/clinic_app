'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useContact } from './ContactContext'
import { motion } from 'framer-motion'

interface ContactTriggerProps {
  contactData: {
    email: string
    address: string
    phoneNumber: string
    officeHours: string
  }
}

export default function ContactTrigger({ contactData }: ContactTriggerProps) {
  const { onOpen } = useContact()
  const pathname = usePathname()

  // Detect if we are on the Hero/Dark section
  const isHomePage = pathname === '/'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 1, ease: [0.19, 1, 0.22, 1] }}
      className="fixed bottom-20 right-5 md:right-10 z-[150]"
    >
      <button
        onClick={onOpen}
        aria-label={`Contact ${contactData.email}`}
        className="relative group flex items-center justify-center w-12 h-12 md:w-14 md:h-14 outline-none transition-all duration-700"
      >
        {/* HAIRLINE OUTER RING: Static and elegant */}
        <div
          className={`absolute inset-[-4px] rounded-full border-[0.5px] transition-all duration-700 ${
            isHomePage
              ? 'border-white/20 group-hover:border-white/40'
              : 'border-zinc-200 dark:border-zinc-800 group-hover:border-[#251101]'
          }`}
        />

        {/* BUBBLE BODY: Pure solid fill with no gradients */}

        {/* ICON: Minimalist stroke, no gradients */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="white"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10 transition-transform duration-700 group-hover:scale-110"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </button>
    </motion.div>
  )
}
