'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import SlideFromBottom from './SlideFromBottom'

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

const atelierEase = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

export default function ContactModal({ isOpen, onClose, contactData }: ContactModalProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Delay content animation slightly so the modal container can begin sliding up first
      const timer = setTimeout(() => setShowContent(true), 300)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = 'unset'
      setShowContent(false)
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden selection:bg-zinc-100">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <SlideFromBottom height="50vw">
            <div className="relative h-full p-8 md:p-16 lg:p-20 flex flex-col bg-white dark:bg-[#050505]">
              {/* Close Button: Minimalist Hairline */}
              <button
                onClick={onClose}
                className="absolute top-10 right-10 p-2 text-zinc-400 hover:text-[#251101] dark:hover:text-white transition-all outline-none"
              >
                <XMarkIcon className="w-5 h-5 stroke-[1px]" />
              </button>

              <div className="max-w-xs md:max-w-sm mt-12 md:mt-20">
                <header className="mb-16">
                  <div className="flex items-center gap-4 mb-8">
                    {/* Animated Typography Tracking */}
                    <h2
                      className={`text-[12px] font-normal font-serif uppercase text-[#251101] dark:text-white leading-none transition-all duration-[2000ms] ${atelierEase} ${
                        showContent
                          ? 'opacity-100 translate-y-0 tracking-[0.4em]'
                          : 'opacity-0 translate-y-6 tracking-[1em]'
                      }`}
                    >
                      Call us
                    </h2>
                    {/* Horizontal Draw-in Line */}
                    <div
                      className={`h-[0.5px] bg-[#251101]/20 dark:bg-white/20 transition-all duration-[2000ms] delay-200 ${atelierEase} ${
                        showContent ? 'w-8' : 'w-0'
                      }`}
                    />
                  </div>

                  <p
                    className={`text-[12px] font-light text-[#595f72] dark:text-zinc-400 leading-[1.8] font-serif transition-all duration-[1500ms] delay-300 ${atelierEase} ${
                      showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                  >
                    Wherever you are, our Clinical Advisors will be delighted to assist you with
                    your personalized care requirements.
                  </p>
                </header>

                {/* LEDGER CONTENT */}
                <div className="space-y-10 mb-16 relative">
                  {/* Vertical Structural Line that draws down behind the icons */}
                  <div
                    className={`absolute left-[11px] top-6 bottom-4 w-[1px] bg-zinc-100 dark:bg-zinc-900 transition-all duration-[2000ms] delay-[500ms] origin-top ${atelierEase} ${
                      showContent ? 'scale-y-100' : 'scale-y-0'
                    }`}
                  />

                  <ContactItem
                    icon={<EnvelopeIcon />}
                    label="Send an Email"
                    value={contactData.email}
                    href={`mailto:${contactData.email}`}
                    isVisible={showContent}
                    delay="delay-[500ms]"
                  />
                  <ContactItem
                    icon={<DevicePhoneMobileIcon />}
                    label="Direct Line"
                    value={contactData.phoneNumber}
                    href={`tel:${contactData.phoneNumber}`}
                    isVisible={showContent}
                    delay="delay-[700ms]"
                  />
                  <ContactItem
                    icon={<ClockIcon />}
                    label="Operating Hours"
                    value={contactData.officeHours}
                    isVisible={showContent}
                    delay="delay-[900ms]"
                  />
                </div>

                {/* BOTTOM THIN DIVIDER: Draws in from left */}
                <div
                  className={`h-[0.5px] bg-zinc-100 dark:bg-zinc-900 mb-12 transition-all duration-[2000ms] delay-[1100ms] ${atelierEase} ${
                    showContent ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            </div>
          </SlideFromBottom>
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
  isVisible,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
  isVisible: boolean
  delay: string
}) {
  return (
    <div
      className={`relative flex items-start gap-6 group transition-all duration-[1500ms] ${delay} ${atelierEase} ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      {/* Icon Background Mask (To hide the vertical line underneath) */}
      <div className="relative z-10 flex items-center justify-center w-6 h-6 bg-white dark:bg-[#050505]">
        <div className="text-zinc-400 group-hover:text-[#251101] dark:group-hover:text-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          {React.cloneElement(
            icon as React.ReactElement,
            { className: 'w-4 h-4 stroke-[1.2px]' } as React.SVGProps<SVGSVGElement>,
          )}
        </div>
      </div>

      <div className="space-y-2 pt-0.5">
        <span className="block text-[8px] uppercase tracking-[0.4em] text-[#595f72] font-serif">
          {label}
        </span>
        {href ? (
          <a
            href={href}
            className="group/link inline-block relative text-[13px] md:text-[14px] font-serif text-[#251101] dark:text-zinc-200 outline-none pb-0.5"
          >
            <span>{value}</span>
            {/* Hover Draw-in Underline */}
            <span className="absolute bottom-0 left-0 w-0 h-[0.5px] bg-[#251101] dark:bg-white transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:w-full" />
          </a>
        ) : (
          <p className="text-[13px] md:text-[14px] font-serif text-[#251101] dark:text-zinc-200 leading-tight">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}
