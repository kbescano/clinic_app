'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useContact } from './ContactContext'

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

  // Logic gate: Use white on the homepage top, black everywhere else
  const isHomePage = pathname === '/'

  return (
    <button
      onClick={onOpen}
      // Use contactData here to give screen readers context
      aria-label={`Contact us at ${contactData.email}`}
      className="flex items-center gap-3 group outline-none transition-all duration-500 hover:scale-110"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-opacity duration-500"
      >
        <defs>
          {/* STEALTH BLACK GRADIENT: For internal pages / Clinical look */}
          <linearGradient id="blackAtelierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="40%" stopColor="#050505" />
            <stop offset="75%" stopColor="#121212" />
            <stop offset="100%" stopColor="#251101" />
          </linearGradient>

          {/* ALABASTER WHITE GRADIENT: For homepage hero / Cinematic look */}
          <linearGradient id="whiteAtelierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FAFAFA" />
            <stop offset="70%" stopColor="#F5F5F4" />
            <stop offset="100%" stopColor="#ECECEB" />
          </linearGradient>
        </defs>

        {/* ENVELOPE ICON: Stroke switches ID based on route */}
        <path
          d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
          stroke={isHomePage ? 'url(#whiteAtelierGradient)' : 'url(#blackAtelierGradient)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
        <path
          d="M22 6L12 13L2 6"
          stroke={isHomePage ? 'url(#whiteAtelierGradient)' : 'url(#blackAtelierGradient)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700"
        />
      </svg>
    </button>
  )
}
