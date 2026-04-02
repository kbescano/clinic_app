'use client'

import React from 'react'
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
  // We use onOpen from the Context to trigger the Modal at the Layout level.
  // This prevents the Modal from being "cut" by the Navbar's overflow.
  const { onOpen } = useContact()

  return (
    <button onClick={onOpen} className="flex items-center gap-3 group outline-none">
      {/* ATELIER TYPOGRAPHY: 
          Reduced to 8px/9px with high tracking and italic serif 
      */}
      <span className="text-[8px] md:text-[9px] uppercase tracking-[0.35em] font-serif font-medium pt-0.5 text-[#595f72] dark:text-white hover:opacity-50 transition-opacity">
        Call Us
      </span>
    </button>
  )
}
