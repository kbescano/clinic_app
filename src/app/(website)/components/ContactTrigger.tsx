'use client'

import React from 'react'
import { useContact } from './ContactContext'
import { motion } from 'motion/react'

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
        className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-950 text-white ring-1 ring-white/30 shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-950 dark:ring-black/10"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      </button>
    </motion.div>
  )
}
