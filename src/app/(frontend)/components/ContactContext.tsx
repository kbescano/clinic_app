'use client'

import React, { createContext, useContext, useState } from 'react'
import ContactModal from './ContactModal'

interface ContactContextType {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

const ContactContext = createContext<ContactContextType | undefined>(undefined)

export function ContactProvider({
  children,
  contactData,
}: {
  children: React.ReactNode
  contactData: any
}) {
  const [isOpen, setIsOpen] = useState(false)

  const onOpen = () => setIsOpen(true)
  const onClose = () => setIsOpen(false)

  return (
    <ContactContext.Provider value={{ isOpen, onOpen, onClose }}>
      {children}
      {/* Renders at the root of the provider, escaping any 
         navbar clipping while staying on the client side.
      */}
      <ContactModal isOpen={isOpen} onClose={onClose} contactData={contactData} />
    </ContactContext.Provider>
  )
}

export function useContact() {
  const context = useContext(ContactContext)
  if (!context) throw new Error('useContact must be used within a ContactProvider')
  return context
}
