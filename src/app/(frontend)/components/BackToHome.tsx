'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function BackToHome() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/')}
      className="mt-12 text-[9px] uppercase tracking-[0.6em] text-zinc-300 hover:text-black dark:hover:text-white transition-colors py-4 text-center underline underline-offset-8 decoration-zinc-100 dark:decoration-zinc-900"
    >
      Back to Home
    </button>
  )
}
