'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import SlideInRight from './SlideInRight'

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
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden selection:bg-zinc-100">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/20 dark:bg-black/60"
            onClick={onClose}
          />

          <SlideInRight>
            <div className="relative h-full p-8 md:p-16 lg:p-20 flex flex-col bg-white dark:bg-black">
              {/* Close Button: Subtle scale */}
              <button
                onClick={onClose}
                className="absolute top-10 right-10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"
              >
                <XMarkIcon className="w-6 h-6 stroke-[1px]" />
              </button>

              <div className="max-w-xs md:max-w-sm mt-12 md:mt-20">
                <header className="mb-16">
                  {/* SMALL ATELIER HEADER: Reduced to 20px/24px */}
                  <h2 className="text-[16px] font-light font-serif uppercase tracking-tight text-zinc-900 dark:text-white leading-none mb-8">
                    Call us
                  </h2>

                  <p className="text-[12px] font-light text-zinc-500 dark:text-zinc-400 leading-[1.8] font-serif">
                    Wherever you are, our Clinical Advisors will be delighted to assist you with
                    your personalized care requirements.
                  </p>
                </header>

                {/* LEDGER CONTENT: Simplified spacing */}
                <div className="space-y-10 mb-16">
                  <ContactItem
                    icon={<EnvelopeIcon />}
                    label="Send an Email"
                    value={contactData.email}
                    href={`mailto:${contactData.email}`}
                  />
                  <ContactItem
                    icon={<DevicePhoneMobileIcon />}
                    label="Direct Line"
                    value={contactData.phoneNumber}
                    href={`tel:${contactData.phoneNumber}`}
                  />
                  <ContactItem
                    icon={<ClockIcon />}
                    label="Operating Hours"
                    value={contactData.officeHours}
                  />
                </div>

                {/* THIN DIVIDER */}
                <div className="h-[1px] w-full bg-zinc-100 dark:bg-zinc-900 mb-12" />
              </div>
            </div>
          </SlideInRight>
        </div>
      )}
    </AnimatePresence>
  )
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-6 group">
      {/* Smaller, thinner icons */}
      <div className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-all duration-500 pt-1">
        {React.cloneElement(
          icon as React.ReactElement,
          { className: 'w-5 h-5 stroke-[1px]' } as any,
        )}
      </div>
      <div className="space-y-2">
        {/* SMALL LABEL: 9px High Tracking */}
        <span className="block text-[9px] uppercase tracking-[0.35em] text-zinc-400 font-serif ">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            className="block text-[14px] md:text-[15px] font-light font-serif text-zinc-800 dark:text-zinc-200 hover:opacity-40 transition-opacity"
          >
            {value}
          </a>
        ) : (
          <p className="text-[14px] md:text-[15px] font-light font-serif text-zinc-800 dark:text-zinc-200 leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}
