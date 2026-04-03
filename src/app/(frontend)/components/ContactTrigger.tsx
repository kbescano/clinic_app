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
  const { onOpen } = useContact()

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 group outline-none transition-transform hover:scale-105"
    >
      {/* To apply a gradient to an SVG stroke or fill, we define it in <defs>.
        We use unique IDs for the gradients to ensure they don't conflict.
      */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Instagram-style Gradient Def (Orange to Purple to Blue) */}
          <linearGradient
            id="instaGradient"
            x1="2"
            y1="2"
            x2="22"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F58529" /> {/* Orange */}
            <stop offset="25%" stopColor="#DD2A7B" /> {/* Pinkish Purple */}
            <stop offset="60%" stopColor="#8134AF" /> {/* Deeper Purple */}
            <stop offset="100%" stopColor="#515BD4" /> {/* Blue */}
          </linearGradient>
        </defs>

        {/* ENVELOPE ICON (Gradient applied to stroke) */}
        <path
          d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
          stroke="url(#instaGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 6L12 13L2 6"
          stroke="url(#instaGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ALTERNATIVE: CALL ICON (Uncomment below to use instead, also uses the gradient) */}
        {/* <path
          d="M22 16.92V19.92C22 20.47 21.53 20.94 20.97 20.92C18.6 20.76 16.33 20.03 14.33 18.83C12.16 17.53 10.31 15.69 9.01 13.52C7.81 11.51 7.08 9.24 6.93 6.87C6.91 6.31 7.39 5.84 7.94 5.84H10.94C11.43 5.84 11.85 6.19 11.92 6.67L12.44 9.23C12.51 9.59 12.41 9.97 12.18 10.24L10.91 11.51C12.11 13.62 13.88 15.39 15.99 16.59L17.26 15.32C17.53 15.09 17.91 14.99 18.27 15.06L20.83 15.58C21.31 15.65 21.66 16.07 21.66 16.56V16.92Z"
          stroke="url(#instaGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        */}
      </svg>
    </button>
  )
}
