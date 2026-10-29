'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import SlideFromBottom from './SlideFromBottom'
import { EASE } from '@/components/shared/motion'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  contactData: {
    email: string
    address: string
    phoneNumber: string
    officeHours: string
  }
}

export default function ContactModal({ isOpen, onClose, contactData }: ContactModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Escape closes; focus moves into the sheet when it opens.
  useEffect(() => {
    if (!isOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const rows = [
    { label: 'Email', value: contactData.email, href: `mailto:${contactData.email}` },
    { label: 'Phone', value: contactData.phoneNumber, href: `tel:${contactData.phoneNumber}` },
    { label: 'Hours', value: contactData.officeHours },
    { label: 'Visit', value: contactData.address },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <SlideFromBottom label="Contact the clinic">
            <div className="relative p-6 pb-12 font-display md:p-14">
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close contact details"
                className="absolute right-4 top-4 p-3 text-zinc-950 transition-opacity hover:opacity-60 dark:text-white md:right-8 md:top-8"
              >
                <XMarkIcon className="h-6 w-6" strokeWidth={2} />
              </button>

              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Contact</p>
              <h2 className="text-5xl font-extrabold leading-[0.9] tracking-tighter text-zinc-950 dark:text-white md:text-7xl">
                Call us
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
                Wherever you are, our Clinical Advisors will be delighted to assist you with your personalized care requirements.
              </p>

              <div className="mt-10 border-t-2 border-zinc-950 dark:border-zinc-700 md:mt-14">
                {rows.map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: 0.25 + i * 0.08 }}
                    className="grid gap-1 border-b border-zinc-300 py-5 dark:border-zinc-800 md:grid-cols-[8rem_1fr] md:items-baseline md:gap-6"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{row.label}</span>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="break-words text-xl font-bold tracking-tight text-zinc-950 underline-offset-4 hover:underline dark:text-white md:text-2xl"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line text-xl font-bold tracking-tight text-zinc-950 dark:text-white md:text-2xl">
                        {row.value}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </SlideFromBottom>
        </div>
      )}
    </AnimatePresence>
  )
}
